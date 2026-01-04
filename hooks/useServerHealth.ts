import { useState, useEffect, useCallback } from "react";

export type ServerStatus = "checking" | "connected" | "disconnected" | "error";

interface HealthResponse {
  status: "connected" | "disconnected" | "error";
  serverUrl?: string;
  message?: string;
  details?: Record<string, unknown>;
}

interface UseServerHealthReturn {
  status: ServerStatus;
  serverUrl: string | null;
  message: string | null;
  lastChecked: Date | null;
  checkHealth: () => Promise<void>;
}

const CHECK_INTERVAL = 30000; // 30 saniye

export function useServerHealth(autoCheck = true): UseServerHealthReturn {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus("checking");

    try {
      const response = await fetch("/api/health-check");
      const data: HealthResponse = await response.json();

      setStatus(data.status);
      setServerUrl(data.serverUrl || null);
      setMessage(data.message || null);
      setLastChecked(new Date());
    } catch {
      setStatus("disconnected");
      setMessage("API endpoint unreachable");
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;

    // İlk kontrol
    checkHealth();

    // Periyodik kontrol
    const intervalId = setInterval(checkHealth, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [autoCheck, checkHealth]);

  return {
    status,
    serverUrl,
    message,
    lastChecked,
    checkHealth,
  };
}
