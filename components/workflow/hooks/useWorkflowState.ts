"use client";

import { useMemo, useRef } from "react";
import { useTaskStream } from "@/contexts/TaskStreamContext";
import {
  type WorkflowState,
  type StreamEvent,
  createInitialWorkflowState,
} from "@/types/workflow";
import { reduceWorkflowEvent } from "../lib/event-to-state";

/**
 * Hook that derives WorkflowState from a task's progress messages.
 * Incrementally processes new events using a pointer to avoid re-reducing all events.
 */
export function useWorkflowState(taskId: string | null): {
  workflowState: WorkflowState;
  isActive: boolean;
  hasEvents: boolean;
} {
  const { activeTasks } = useTaskStream();
  const task = activeTasks.find((t) => t.id === taskId);

  // Track processed event count and cached state
  const cacheRef = useRef<{
    processedCount: number;
    state: WorkflowState;
  }>({
    processedCount: 0,
    state: createInitialWorkflowState(),
  });

  const workflowState = useMemo(() => {
    const messages = task?.progressMessages ?? [];

    // Reset if task changed or messages were cleared
    if (messages.length < cacheRef.current.processedCount) {
      cacheRef.current = {
        processedCount: 0,
        state: createInitialWorkflowState(),
      };
    }

    // Incrementally process only new events
    let state = cacheRef.current.state;
    for (let i = cacheRef.current.processedCount; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.data) continue;

      // Reconstruct StreamEvent from stored data
      const event: StreamEvent = {
        type: "progress",
        timestamp: msg.timestamp,
        event: msg.event as StreamEvent["event"],
        message: msg.message,
        agent_id: msg.data.agent_id as string | undefined,
        parent_agent_id: msg.data.parent_agent_id as
          | string
          | null
          | undefined,
        agent_name: msg.data.agent_name as string | undefined,
        status: msg.data.status as string | undefined,
        model: msg.data.model as string | undefined,
        tools_available: msg.data.tools_available as string[] | undefined,
        tool: msg.data.tool as string | undefined,
        is_agent_call: msg.data.is_agent_call as boolean | undefined,
        input_prompt: msg.data.input_prompt as string | undefined,
        input_preview: msg.data.input_preview as
          | Record<string, string>
          | undefined,
        output_preview: msg.data.output_preview as string | undefined,
        edge_label: msg.data.edge_label as string | undefined,
        duration_ms: msg.data.duration_ms as number | undefined,
        error_code: msg.data.error_code as string | undefined,
        retryable: msg.data.retryable as boolean | undefined,
        user_message_tr: msg.data.user_message_tr as string | undefined,
        service: msg.data.service as string | undefined,
        tool_calls_planned: msg.data.tool_calls_planned as
          | StreamEvent["tool_calls_planned"]
          | undefined,
        from_agent_id: msg.data.from_agent_id as string | undefined,
        from_agent_name: msg.data.from_agent_name as string | undefined,
        to_agent_name: msg.data.to_agent_name as string | undefined,
      };

      state = reduceWorkflowEvent(state, event);
    }

    // Handle result event from task completion
    if (
      task?.status === "completed" &&
      task.response &&
      !state.isComplete
    ) {
      state = reduceWorkflowEvent(state, {
        type: "result",
        timestamp: new Date().toISOString(),
        success: true,
        output: task.response,
      });
    } else if (
      task?.status === "failed" &&
      task.error &&
      !state.isComplete
    ) {
      state = reduceWorkflowEvent(state, {
        type: "result",
        timestamp: new Date().toISOString(),
        success: false,
        error: task.error,
      });
    }

    cacheRef.current = {
      processedCount: messages.length,
      state,
    };

    return state;
  }, [task?.progressMessages, task?.status, task?.response, task?.error]);

  return {
    workflowState,
    isActive: task?.status === "running" || task?.status === "pending",
    hasEvents: (task?.progressMessages?.length ?? 0) > 0,
  };
}
