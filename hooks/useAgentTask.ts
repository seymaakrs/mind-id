import { useState, useCallback, useRef } from "react";
import { createTask, updateTaskStatus } from "@/lib/firebase/firestore";

type AgentTaskExtras = Record<string, unknown>;

type AgentTaskRequest = {
  task: string;
  businessId: string;
  extras?: AgentTaskExtras;
};

// Progress event types
type ProgressEvent = "agent_start" | "tool_start" | "tool_end" | "tool_error" | "handoff" | "agent_end";

type ProgressMessage = {
  event: ProgressEvent;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

type StreamMessage =
  | { type: "heartbeat" }
  | { type: "progress"; event: ProgressEvent; message: string; timestamp?: string; data?: Record<string, unknown> }
  | { type: "result"; success: true; output: string; log_path?: string }
  | { type: "result"; success: false; error: string };

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
};

export function useAgentTask(): UseAgentTaskReturn {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [currentProgress, setCurrentProgress] = useState<string | null>(null);
  const [logPath, setLogPath] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendTask = useCallback(
    async ({ task, businessId, extras }: AgentTaskRequest): Promise<string | null> => {
      if (!task.trim() || !businessId) {
        setError("Görev ve işletme ID'si zorunludur.");
        return null;
      }

      // Önceki isteği iptal et
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);
      setResponse(null);
      setProgressMessages([]);
      setCurrentProgress(null);
      setLogPath(null);

      try {
        // Önce Firestore'da task oluştur
        const taskData: { businessId: string; type: "immediate"; task: string; extras?: Record<string, unknown> } = {
          businessId,
          type: "immediate",
          task: task.trim(),
        };

        // extras sadece varsa ekle (Firestore undefined kabul etmez)
        if (extras && Object.keys(extras).length > 0) {
          taskData.extras = extras;
        }

        const taskId = await createTask(businessId, taskData);

        const res = await fetch("/api/agent-task", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/x-ndjson",
            "Connection": "keep-alive",
          },
          body: JSON.stringify({
            task: task.trim(),
            business_id: businessId,
            task_id: taskId,
            ...(extras && Object.keys(extras).length > 0 ? { extras } : {}),
          }),
          signal: abortController.signal,
          keepalive: false, // false for streaming (true breaks streams)
        });

        // Hata durumunda JSON response olarak döner
        if (!res.ok) {
          const errorText = await res.text();
          let parsedError: { error?: string; details?: string } | null = null;
          try {
            parsedError = JSON.parse(errorText);
          } catch {
            // JSON değil
          }
          const errorMsg =
            parsedError?.error ||
            parsedError?.details ||
            errorText ||
            "İstek başarısız oldu.";

          // Task durumunu failed olarak güncelle
          await updateTaskStatus(businessId, taskId, "failed", undefined, errorMsg);

          setError(errorMsg);
          return null;
        }

        // Streaming NDJSON response
        if (!res.body) {
          await updateTaskStatus(businessId, taskId, "failed", undefined, "Yanıt stream'i okunamadı.");
          setError("Yanıt stream'i okunamadı.");
          return null;
        }

        const reader = res.body.getReader();
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

            // Her satırı ayrı JSON olarak parse et
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Son satır tamamlanmamış olabilir

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const data = JSON.parse(line) as StreamMessage;

                switch (data.type) {
                  case "heartbeat":
                    // Bağlantı canlı, UI'da bir şey göstermeye gerek yok
                    break;

                  case "progress": {
                    // Progress mesajını kaydet ve göster
                    const progressMsg: ProgressMessage = {
                      event: data.event,
                      message: data.message,
                      timestamp: data.timestamp || new Date().toISOString(),
                      data: data.data,
                    };
                    setProgressMessages((prev) => [...prev, progressMsg]);
                    setCurrentProgress(data.message);
                    break;
                  }

                  case "result":
                    // Final sonuç
                    setCurrentProgress(null);
                    if (data.success) {
                      finalOutput = data.output;
                      setResponse(data.output);
                      if (data.log_path) {
                        setLogPath(data.log_path);
                      }
                    } else {
                      finalError = data.error || "Bilinmeyen hata.";
                      setError(finalError);
                    }
                    break;
                }
              } catch {
                console.warn("NDJSON parse hatası:", line);
              }
            }
          }
        } catch (streamError) {
          // Stream okuma hatası - bağlantı kesilmiş olabilir
          console.error("Stream read error:", streamError);
          if (!finalOutput && !finalError) {
            finalError = receivedAnyData
              ? "Bağlantı kesildi. Görev arka planda devam ediyor olabilir."
              : "Sunucu bağlantısı kurulamadı.";
            setError(finalError);
          }
        }

        // Buffer'da kalan veriyi işle
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer) as StreamMessage;
            if (data.type === "result") {
              if (data.success) {
                finalOutput = data.output;
                setResponse(data.output);
                if (data.log_path) {
                  setLogPath(data.log_path);
                }
              } else {
                finalError = data.error || "Bilinmeyen hata.";
                setError(finalError);
              }
            }
          } catch {
            console.warn("Son buffer parse hatası:", buffer);
          }
        }

        // Task durumunu güncelle
        if (finalOutput) {
          await updateTaskStatus(businessId, taskId, "completed", finalOutput);
        } else if (finalError) {
          await updateTaskStatus(businessId, taskId, "failed", undefined, finalError);
        }

        return finalOutput;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setError("İstek iptal edildi.");
          return null;
        }
        const errorMsg = err instanceof Error ? err.message : "Bir hata oluştu.";
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const cancelTask = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
    setProgressMessages([]);
    setCurrentProgress(null);
    setLogPath(null);
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
  };
}
