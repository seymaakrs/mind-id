import { useState, useCallback } from "react";

type AgentTaskExtras = Record<string, unknown>;

type AgentTaskRequest = {
  task: string;
  businessId: string;
  extras?: AgentTaskExtras;
};

type UseAgentTaskReturn = {
  response: string | null;
  loading: boolean;
  error: string | null;
  sendTask: (request: AgentTaskRequest) => Promise<string | null>;
  reset: () => void;
};

export function useAgentTask(): UseAgentTaskReturn {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTask = useCallback(
    async ({ task, businessId, extras }: AgentTaskRequest): Promise<string | null> => {
      if (!task.trim() || !businessId) {
        setError("Görev ve işletme ID'si zorunludur.");
        return null;
      }

      setLoading(true);
      setError(null);
      setResponse(null);

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
        });

        const responseText = await res.text();
        let parsedResponse: { output?: string; error?: string; details?: string } | null = null;

        try {
          parsedResponse = JSON.parse(responseText);
        } catch {
          // Response is not JSON
        }

        if (!res.ok) {
          const errorMsg =
            parsedResponse?.error ||
            parsedResponse?.details ||
            responseText ||
            "İstek başarısız oldu.";
          setError(errorMsg);
          return null;
        }

        if (parsedResponse?.output) {
          setResponse(parsedResponse.output);
          return parsedResponse.output;
        } else {
          setError("Beklenmeyen yanıt formatı.");
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Bir hata oluştu.";
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    response,
    loading,
    error,
    sendTask,
    reset,
  };
}
