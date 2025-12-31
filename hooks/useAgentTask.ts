import { useState, useCallback, useRef } from "react";

type AgentTaskExtras = Record<string, unknown>;

type AgentTaskRequest = {
  task: string;
  businessId: string;
  extras?: AgentTaskExtras;
};

type StreamMessage =
  | { type: "heartbeat"; count: number }
  | { type: "result"; success: true; output: string; log_path?: string }
  | { type: "result"; success: false; error: string };

type UseAgentTaskReturn = {
  response: string | null;
  loading: boolean;
  error: string | null;
  heartbeatCount: number;
  logPath: string | null;
  sendTask: (request: AgentTaskRequest) => Promise<string | null>;
  cancelTask: () => void;
  reset: () => void;
};

export function useAgentTask(): UseAgentTaskReturn {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
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
      setHeartbeatCount(0);
      setLogPath(null);

      try {
        const res = await fetch("/api/agent-task", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task: task.trim(),
            business_id: businessId,
            ...(extras && Object.keys(extras).length > 0 ? { extras } : {}),
          }),
          signal: abortController.signal,
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
          setError(errorMsg);
          return null;
        }

        // Streaming NDJSON response
        if (!res.body) {
          setError("Yanıt stream'i okunamadı.");
          return null;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalOutput: string | null = null;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Her satırı ayrı JSON olarak parse et
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Son satır tamamlanmamış olabilir

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line) as StreamMessage;

              if (data.type === "heartbeat") {
                setHeartbeatCount(data.count);
              } else if (data.type === "result") {
                if (data.success) {
                  finalOutput = data.output;
                  setResponse(data.output);
                  if (data.log_path) {
                    setLogPath(data.log_path);
                  }
                } else {
                  setError(data.error || "Bilinmeyen hata.");
                }
              }
            } catch {
              console.warn("NDJSON parse hatası:", line);
            }
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
                setError(data.error || "Bilinmeyen hata.");
              }
            }
          } catch {
            console.warn("Son buffer parse hatası:", buffer);
          }
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
    setHeartbeatCount(0);
    setLogPath(null);
  }, []);

  return {
    response,
    loading,
    error,
    heartbeatCount,
    logPath,
    sendTask,
    cancelTask,
    reset,
  };
}
