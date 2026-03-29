import {
  type WorkflowState,
  type WorkflowAgent,
  type WorkflowTool,
  type StreamEvent,
  createInitialWorkflowState,
} from "@/types/workflow";

/**
 * Pure reducer: processes a single stream event and returns a new WorkflowState.
 * Handles the full event lifecycle: agent_start → llm_start → llm_end → tool_start → tool_end/error → agent_end
 */
export function reduceWorkflowEvent(
  state: WorkflowState,
  event: StreamEvent
): WorkflowState {
  if (event.type === "heartbeat") return state;

  if (event.type === "result") {
    return {
      ...state,
      isComplete: true,
      finalResult: {
        success: event.success ?? false,
        output: event.output,
        error: event.error,
        logPath: event.log_path,
      },
    };
  }

  // progress events
  const newAgents = new Map(state.agents);
  let newTools = [...state.tools];

  switch (event.event) {
    case "agent_start": {
      if (!event.agent_id) break;
      const agent: WorkflowAgent = {
        id: event.agent_id,
        name: event.agent_name ?? "unknown",
        model: event.model ?? "",
        status: "idle",
        parentId: event.parent_agent_id ?? null,
        toolsAvailable: event.tools_available ?? [],
        llmMessages: [],
        outputPreview: null,
      };
      newAgents.set(event.agent_id, agent);

      // Link parent's tool_start (is_agent_call) to this child agent
      if (event.parent_agent_id) {
        const parentToolIdx = newTools.findLastIndex(
          (t) =>
            t.agentId === event.parent_agent_id &&
            t.isAgentCall &&
            t.status === "executing" &&
            !t.childAgentId
        );
        if (parentToolIdx >= 0) {
          newTools = [...newTools];
          newTools[parentToolIdx] = {
            ...newTools[parentToolIdx],
            childAgentId: event.agent_id,
          };
        }
      }
      break;
    }

    case "llm_start": {
      if (!event.agent_id) break;
      const agent = newAgents.get(event.agent_id);
      if (agent) {
        newAgents.set(event.agent_id, { ...agent, status: "thinking" });
      }
      break;
    }

    case "llm_end": {
      if (!event.agent_id) break;
      const agent = newAgents.get(event.agent_id);
      if (agent) {
        newAgents.set(event.agent_id, {
          ...agent,
          status: "decided",
          llmMessages: event.message
            ? [...agent.llmMessages, event.message]
            : agent.llmMessages,
        });
      }
      break;
    }

    case "tool_start": {
      if (!event.agent_id || !event.tool) break;
      const agent = newAgents.get(event.agent_id);
      if (agent) {
        newAgents.set(event.agent_id, { ...agent, status: "executing" });
      }

      const toolId = `${event.agent_id}_${event.tool}_${newTools.length}`;
      const tool: WorkflowTool = {
        id: toolId,
        agentId: event.agent_id,
        tool: event.tool,
        isAgentCall: event.is_agent_call ?? false,
        status: "executing",
        inputPrompt: event.input_prompt,
        inputPreview: event.input_preview,
        edgeLabel: event.edge_label,
      };
      newTools = [...newTools, tool];
      break;
    }

    case "tool_end": {
      if (!event.agent_id || !event.tool) break;
      const agent = newAgents.get(event.agent_id);
      if (agent) {
        newAgents.set(event.agent_id, { ...agent, status: "waiting" });
      }

      // Find the last executing tool matching agent + tool name
      const toolIdx = newTools.findLastIndex(
        (t) =>
          t.agentId === event.agent_id &&
          t.tool === event.tool &&
          t.status === "executing"
      );
      if (toolIdx >= 0) {
        newTools = [...newTools];
        newTools[toolIdx] = {
          ...newTools[toolIdx],
          status: "completed",
          outputPreview: event.output_preview,
          edgeLabel: event.edge_label ?? newTools[toolIdx].edgeLabel,
          durationMs: event.duration_ms,
        };
      }
      break;
    }

    case "tool_error": {
      if (!event.agent_id || !event.tool) break;
      const agent = newAgents.get(event.agent_id);
      if (agent) {
        newAgents.set(event.agent_id, { ...agent, status: "error" });
      }

      const toolIdx = newTools.findLastIndex(
        (t) =>
          t.agentId === event.agent_id &&
          t.tool === event.tool &&
          t.status === "executing"
      );
      if (toolIdx >= 0) {
        newTools = [...newTools];
        newTools[toolIdx] = {
          ...newTools[toolIdx],
          status: "error",
          durationMs: event.duration_ms,
          error: {
            code: event.error_code ?? "UNKNOWN",
            retryable: event.retryable ?? false,
            messageTr: event.user_message_tr ?? "Bir hata oluştu",
            service: event.service,
          },
        };
      }
      break;
    }

    case "agent_end": {
      if (!event.agent_id) break;
      const agent = newAgents.get(event.agent_id);
      if (agent) {
        newAgents.set(event.agent_id, {
          ...agent,
          status: "completed",
          outputPreview: event.output_preview ?? agent.outputPreview,
        });
      }
      break;
    }

    case "handoff": {
      // Rare in this project - just log for now
      break;
    }
  }

  return {
    ...state,
    agents: newAgents,
    tools: newTools,
  };
}

/**
 * Processes an array of stream events from scratch into a WorkflowState.
 * Useful for rebuilding state from stored events.
 */
export function buildWorkflowState(events: StreamEvent[]): WorkflowState {
  return events.reduce(reduceWorkflowEvent, createInitialWorkflowState());
}
