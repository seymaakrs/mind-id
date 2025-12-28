import { useState, useCallback } from "react";

type RequestState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
};

type UseApiRequestReturn<T> = RequestState<T> & {
  execute: (url: string, options?: ApiRequestOptions) => Promise<T | null>;
  reset: () => void;
};

export function useApiRequest<T = unknown>(): UseApiRequestReturn<T> {
  const [state, setState] = useState<RequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, options: ApiRequestOptions = {}): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await fetch(url, {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        });

        const responseText = await response.text();
        let parsedResponse: T | null = null;

        try {
          parsedResponse = JSON.parse(responseText) as T;
        } catch {
          // Response is not JSON
        }

        if (!response.ok) {
          const errorObj = parsedResponse as { error?: string; details?: string } | null;
          const errorMessage =
            errorObj?.error || errorObj?.details || responseText || `HTTP ${response.status}`;
          setState({ data: null, loading: false, error: errorMessage });
          return null;
        }

        setState({ data: parsedResponse, loading: false, error: null });
        return parsedResponse;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu";
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
