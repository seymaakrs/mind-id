"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createTask, updateTaskStatus } from "@/lib/firebase/firestore";

// Progress event types
export type ProgressEvent =
  | "agent_start"
  | "tool_start"
  | "tool_end"
  | "tool_error"
  | "handoff"
  | "agent_end";

export type ProgressMessage = {
  event: ProgressEvent;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

type StreamMessage =
  | { type: "heartbeat" }
  | {
      type: "progress";
      event: ProgressEvent;
      message: string;
      timestamp?: string;
      data?: Record<string, unknown>;
    }
  | { type: "result"; success: true; output: string; log_path?: string }
  | { type: "result"; success: false; error: string };

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface ActiveTask {
  id: string;
  businessId: string;
  businessName?: string;
  taskDescription: string;
  status: TaskStatus;
  progressMessages: ProgressMessage[];
  currentProgress?: string;
  response?: string;
  error?: string;
  createdAt: Date;
  logPath?: string;
}

export type SendTaskParams = {
  task: string;
  businessId: string;
  businessName?: string;
  createdBy?: string;
  extras?: Record<string, unknown>;
};

interface SendTaskResult {
  taskId: string;
  // Promise that resolves when the task completes (for backward compatibility)
  resultPromise: Promise<string | null>;
}

interface TaskStreamContextType {
  // State
  activeTasks: ActiveTask[];
  isWidgetMinimized: boolean;
  widgetPosition: { x: number; y: number };

  // Actions
  sendTask: (params: SendTaskParams) => Promise<SendTaskResult | null>;
  cancelTask: (taskId: string) => void;
  dismissTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  setWidgetMinimized: (minimized: boolean) => void;
  setWidgetPosition: (pos: { x: number; y: number }) => void;

  // For backward compatibility with useAgentTask
  getTaskState: (taskId: string) => ActiveTask | undefined;
}

const TaskStreamContext = createContext<TaskStreamContextType | null>(null);

// localStorage keys
const WIDGET_POSITION_KEY = "task-widget-position";
const WIDGET_MINIMIZED_KEY = "task-widget-minimized";

// Default position (will be calculated on client)
const DEFAULT_POSITION = { x: -1, y: -1 }; // -1 means use CSS default

export function TaskStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);
  const [widgetPosition, setWidgetPositionState] = useState(DEFAULT_POSITION);

  // AbortController map for canceling requests
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Auto-dismiss timers
  const dismissTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track tasks we're currently streaming
  const streamingTasksRef = useRef<Set<string>>(new Set());

  // Load saved state from localStorage on client
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem(WIDGET_POSITION_KEY);
      if (savedPosition) {
        const parsed = JSON.parse(savedPosition);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setWidgetPositionState(parsed);
        }
      }

      const savedMinimized = localStorage.getItem(WIDGET_MINIMIZED_KEY);
      if (savedMinimized) {
        setIsWidgetMinimized(savedMinimized === "true");
      }
    } catch (e) {
      console.warn("Failed to load widget state from localStorage:", e);
    }
  }, []);

  // Set up auto-dismiss timer when a task completes
  const setupAutoDismiss = useCallback((taskId: string) => {
    // Clear existing timer if any
    const existingTimer = dismissTimersRef.current.get(taskId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer for 30 seconds
    const timer = setTimeout(() => {
      setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
      dismissTimersRef.current.delete(taskId);
    }, 30000);

    dismissTimersRef.current.set(taskId, timer);
  }, []);

  // Update task in state
  const updateTask = useCallback(
    (taskId: string, updates: Partial<ActiveTask>) => {
      setActiveTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );

      // If task completed or failed, set up auto-dismiss
      if (updates.status === "completed" || updates.status === "failed") {
        setupAutoDismiss(taskId);
      }
    },
    [setupAutoDismiss]
  );

  // Process stream for a task
  const processStream = useCallback(
    async (
      taskId: string,
      businessId: string,
      response: Response,
      abortController: AbortController
    ): Promise<string | null> => {
      if (!response.body) {
        updateTask(taskId, {
          status: "failed",
          error: "Yanit stream'i okunamadi.",
        });
        await updateTaskStatus(
          businessId,
          taskId,
          "failed",
          undefined,
          "Yanit stream'i okunamadi."
        );
        return null;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalOutput: string | null = null;
      let finalError: string | null = null;
      let receivedAnyData = false;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          receivedAnyData = true;
          buffer += decoder.decode(value, { stream: true });

          // Parse each line as separate JSON (NDJSON)
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line) as StreamMessage;

              switch (data.type) {
                case "heartbeat":
                  // Connection alive
                  break;

                case "progress": {
                  const progressMsg: ProgressMessage = {
                    event: data.event,
                    message: data.message,
                    timestamp: data.timestamp || new Date().toISOString(),
                    data: data.data,
                  };

                  setActiveTasks((prev) =>
                    prev.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            status: "running" as TaskStatus,
                            progressMessages: [
                              ...task.progressMessages,
                              progressMsg,
                            ],
                            currentProgress: data.message,
                          }
                        : task
                    )
                  );
                  break;
                }

                case "result":
                  if (data.success) {
                    finalOutput = data.output;
                    updateTask(taskId, {
                      status: "completed",
                      response: data.output,
                      currentProgress: undefined,
                      logPath: data.log_path,
                    });
                  } else {
                    finalError = data.error || "Bilinmeyen hata.";
                    updateTask(taskId, {
                      status: "failed",
                      error: finalError,
                      currentProgress: undefined,
                    });
                  }
                  break;
              }
            } catch {
              console.warn("NDJSON parse hatasi:", line);
            }
          }
        }
      } catch (streamError) {
        console.error("Stream read error:", streamError);
        if (!finalOutput && !finalError) {
          finalError = receivedAnyData
            ? "Baglanti kesildi. Gorev arka planda devam ediyor olabilir."
            : "Sunucu baglantisi kurulamadi.";
          updateTask(taskId, {
            status: "failed",
            error: finalError,
          });
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer) as StreamMessage;
          if (data.type === "result") {
            if (data.success) {
              finalOutput = data.output;
              updateTask(taskId, {
                status: "completed",
                response: data.output,
                currentProgress: undefined,
                logPath: data.log_path,
              });
            } else {
              finalError = data.error || "Bilinmeyen hata.";
              updateTask(taskId, {
                status: "failed",
                error: finalError,
                currentProgress: undefined,
              });
            }
          }
        } catch {
          console.warn("Son buffer parse hatasi:", buffer);
        }
      }

      // Update Firestore
      if (finalOutput) {
        await updateTaskStatus(businessId, taskId, "completed", finalOutput);
      } else if (finalError) {
        await updateTaskStatus(
          businessId,
          taskId,
          "failed",
          undefined,
          finalError
        );
      }

      // Cleanup
      streamingTasksRef.current.delete(taskId);
      abortControllersRef.current.delete(taskId);

      return finalOutput;
    },
    [updateTask]
  );

  // Send task - returns taskId immediately, processes stream in background
  const sendTask = useCallback(
    async ({
      task,
      businessId,
      businessName,
      createdBy,
      extras,
    }: SendTaskParams): Promise<SendTaskResult | null> => {
      if (!task.trim() || !businessId) {
        return null;
      }

      const abortController = new AbortController();

      try {
        // Create task in Firestore first
        const taskData: {
          businessId: string;
          type: "immediate";
          task: string;
          createdBy?: string;
          extras?: Record<string, unknown>;
        } = {
          businessId,
          type: "immediate",
          task: task.trim(),
        };

        if (createdBy) {
          taskData.createdBy = createdBy;
        }

        if (extras && Object.keys(extras).length > 0) {
          taskData.extras = extras;
        }

        const taskId = await createTask(businessId, taskData);

        // Add to active tasks
        const newTask: ActiveTask = {
          id: taskId,
          businessId,
          businessName,
          taskDescription: task.trim(),
          status: "pending",
          progressMessages: [],
          createdAt: new Date(),
        };

        setActiveTasks((prev) => [newTask, ...prev]);

        // Store abort controller
        abortControllersRef.current.set(taskId, abortController);
        streamingTasksRef.current.add(taskId);

        // Create a promise that will resolve when the stream completes
        const resultPromise = (async (): Promise<string | null> => {
          try {
            // Make API request
            const res = await fetch("/api/agent-task", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/x-ndjson",
                Connection: "keep-alive",
              },
              body: JSON.stringify({
                task: task.trim(),
                business_id: businessId,
                task_id: taskId,
                ...(extras && Object.keys(extras).length > 0 ? { extras } : {}),
              }),
              signal: abortController.signal,
              keepalive: false,
            });

            if (!res.ok) {
              const errorText = await res.text();
              let parsedError: { error?: string; details?: string } | null = null;
              try {
                parsedError = JSON.parse(errorText);
              } catch {
                // Not JSON
              }
              const errorMsg =
                parsedError?.error ||
                parsedError?.details ||
                errorText ||
                "Istek basarisiz oldu.";

              await updateTaskStatus(
                businessId,
                taskId,
                "failed",
                undefined,
                errorMsg
              );
              updateTask(taskId, {
                status: "failed",
                error: errorMsg,
              });

              return null;
            }

            // Process stream
            return await processStream(taskId, businessId, res, abortController);
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
              return null;
            }
            console.error("sendTask stream error:", err);
            return null;
          }
        })();

        // Return taskId immediately, along with the result promise
        return { taskId, resultPromise };
      } catch (err) {
        console.error("sendTask error:", err);
        return null;
      }
    },
    [processStream, updateTask]
  );

  // Cancel task
  const cancelTask = useCallback((taskId: string) => {
    const controller = abortControllersRef.current.get(taskId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(taskId);
    }

    streamingTasksRef.current.delete(taskId);

    setActiveTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: "failed" as TaskStatus, error: "Iptal edildi." }
          : task
      )
    );
  }, []);

  // Dismiss task (remove from list)
  const dismissTask = useCallback((taskId: string) => {
    // Clear auto-dismiss timer if exists
    const timer = dismissTimersRef.current.get(taskId);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(taskId);
    }

    setActiveTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  // Clear all completed/failed tasks
  const clearCompletedTasks = useCallback(() => {
    // Clear all dismiss timers for completed tasks
    activeTasks.forEach((task) => {
      if (task.status === "completed" || task.status === "failed") {
        const timer = dismissTimersRef.current.get(task.id);
        if (timer) {
          clearTimeout(timer);
          dismissTimersRef.current.delete(task.id);
        }
      }
    });

    setActiveTasks((prev) =>
      prev.filter(
        (task) => task.status !== "completed" && task.status !== "failed"
      )
    );
  }, [activeTasks]);

  // Set widget minimized
  const setWidgetMinimized = useCallback((minimized: boolean) => {
    setIsWidgetMinimized(minimized);
    try {
      localStorage.setItem(WIDGET_MINIMIZED_KEY, String(minimized));
    } catch (e) {
      console.warn("Failed to save minimized state:", e);
    }
  }, []);

  // Set widget position
  const setWidgetPosition = useCallback((pos: { x: number; y: number }) => {
    setWidgetPositionState(pos);
    try {
      localStorage.setItem(WIDGET_POSITION_KEY, JSON.stringify(pos));
    } catch (e) {
      console.warn("Failed to save widget position:", e);
    }
  }, []);

  // Get task state (for backward compatibility)
  const getTaskState = useCallback(
    (taskId: string) => {
      return activeTasks.find((task) => task.id === taskId);
    },
    [activeTasks]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
      dismissTimersRef.current.clear();

      // Note: We don't abort controllers on unmount because
      // the tasks should continue in the background
    };
  }, []);

  const value: TaskStreamContextType = {
    activeTasks,
    isWidgetMinimized,
    widgetPosition,
    sendTask,
    cancelTask,
    dismissTask,
    clearCompletedTasks,
    setWidgetMinimized,
    setWidgetPosition,
    getTaskState,
  };

  return (
    <TaskStreamContext.Provider value={value}>
      {children}
    </TaskStreamContext.Provider>
  );
}

export function useTaskStream() {
  const context = useContext(TaskStreamContext);
  if (!context) {
    throw new Error("useTaskStream must be used within a TaskStreamProvider");
  }
  return context;
}
