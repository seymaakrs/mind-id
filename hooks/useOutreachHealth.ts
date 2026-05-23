"use client";

import { useEffect, useState } from "react";

interface HealthState {
  loading: boolean;
  paused: boolean | null;
  reason?: string | null;
  pausedAt?: string | null;
  configured?: boolean;
  error?: string | null;
}

/**
 * Outreach Robotu'nun (Bekçi'nin set ettiği) anlık pause durumu.
 * Her 30 sn yenilenir. Pause = portal kullanıcısına global uyarı şeridi.
 */
export function useOutreachHealth(refreshMs = 30_000): HealthState {
  const [state, setState] = useState<HealthState>({
    loading: true,
    paused: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const r = await fetch("/api/sales/outreach/health", { cache: "no-store" });
        if (!r.ok) {
          if (cancelled) return;
          setState({
            loading: false,
            paused: null,
            error: `${r.status}: ${r.statusText}`,
          });
          return;
        }
        const data = await r.json();
        if (cancelled) return;
        setState({
          loading: false,
          paused: Boolean(data?.paused),
          reason: data?.reason ?? null,
          pausedAt: data?.paused_at ?? null,
          configured: data?.configured ?? false,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          loading: false,
          paused: null,
          error: e instanceof Error ? e.message : "unknown",
        });
      }
    }

    void load();
    const interval = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshMs]);

  return state;
}
