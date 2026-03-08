import { useState, useCallback, useMemo } from "react";
import {
  useTaskStream,
  type ProgressMessage,
  type ActiveTask,
} from "@/contexts/TaskStreamContext";

type AgentTaskExtras = Record<string, unknown>;

type AgentTaskRequest = {
  task: string;
  businessId: string;
  businessName?: string;
  createdBy?: string;
  extras?: AgentTaskExtras;
};

type UseAgentTaskReturn = {
  response: string | null;
  loading: boolean;
  error: string | null;
  progressMessages: ProgressMessage[];
  currentProgress: string | null;
  logPath: string | null;
  sendTask: (request: AgentTaskRequest) => Promise<string | null>;
  cancelTask: () => void;
  reset: () => void;
  // Access to the current task
  currentTask: ActiveTask | null;
  // Access to the current task ID
  currentTaskId: string | null;
};

export function useAgentTask(): UseAgentTaskReturn {
  const {
    activeTasks,
    sendTask: contextSendTask,
    cancelTask: contextCancelTask,
  } = useTaskStream();

  // Track the current task ID for this hook instance
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Get current task from context
  const currentTask = useMemo(() => {
    if (!currentTaskId) return null;
    return activeTasks.find((t) => t.id === currentTaskId) || null;
  }, [activeTasks, currentTaskId]);

  // Derive state from current task
  const response = currentTask?.response || null;
  const loading =
    currentTask?.status === "pending" || currentTask?.status === "running";
  const error = currentTask?.error || null;
  const progressMessages = currentTask?.progressMessages || [];
  const currentProgress = currentTask?.currentProgress || null;
  const logPath = currentTask?.logPath || null;

  const sendTask = useCallback(
    async ({
      task,
      businessId,
      businessName,
      createdBy,
      extras,
    }: AgentTaskRequest): Promise<string | null> => {
      // Reset current task
      setCurrentTaskId(null);

      try {
        const result = await contextSendTask({
          task,
          businessId,
          businessName,
          createdBy,
          extras,
        });

        if (result) {
          // Set the task ID immediately
          setCurrentTaskId(result.taskId);

          // Don't await resultPromise - let stream process in background
          // This prevents UI from blocking while waiting for stream to complete
          result.resultPromise.catch((err) => {
            console.error("Background task stream error:", err);
          });

          return result.taskId;
        }

        return null;
      } catch (err) {
        console.error("sendTask error:", err);
        return null;
      }
    },
    [contextSendTask]
  );

  const cancelTask = useCallback(() => {
    if (currentTaskId) {
      contextCancelTask(currentTaskId);
    }
  }, [currentTaskId, contextCancelTask]);

  const reset = useCallback(() => {
    setCurrentTaskId(null);
  }, []);

  return {
    response,
    loading,
    error,
    progressMessages,
    currentProgress,
    logPath,
    sendTask,
    cancelTask,
    reset,
    currentTask,
    currentTaskId,
  };
}

// Re-export types for convenience
export type { ProgressMessage, AgentTaskRequest, UseAgentTaskReturn };
