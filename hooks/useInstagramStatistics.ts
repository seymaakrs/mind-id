"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getInstagramStats,
  getInstagramStatsByWeek,
  getInstagramAvailableWeeks,
} from "@/lib/firebase/firestore";
import type {
  InstagramWeeklyStats,
  InstagramWeekOption,
} from "@/types/instagram-statistics";

interface UseInstagramStatisticsResult {
  // Available weeks for dropdown
  availableWeeks: InstagramWeekOption[];
  availableWeeksLoading: boolean;

  // Selected week
  selectedWeekId: string | null;
  setSelectedWeekId: (weekId: string | null) => void;

  // Stats for selected week
  stats: InstagramWeeklyStats | null;
  statsLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}

export function useInstagramStatistics(
  businessId: string | null
): UseInstagramStatisticsResult {
  const [availableWeeks, setAvailableWeeks] = useState<InstagramWeekOption[]>([]);
  const [availableWeeksLoading, setAvailableWeeksLoading] = useState(false);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [stats, setStats] = useState<InstagramWeeklyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available weeks when businessId changes
  const fetchAvailableWeeks = useCallback(async () => {
    if (!businessId) {
      setAvailableWeeks([]);
      setSelectedWeekId(null);
      setStats(null);
      return;
    }

    setAvailableWeeksLoading(true);
    setError(null);

    try {
      const weeks = await getInstagramAvailableWeeks(businessId);
      setAvailableWeeks(weeks);

      // Auto-select the most recent week if available
      if (weeks.length > 0) {
        setSelectedWeekId(weeks[0].week_id);
      } else {
        setSelectedWeekId(null);
        setStats(null);
      }
    } catch (err) {
      console.error("Error fetching Instagram weeks:", err);
      setError(err instanceof Error ? err.message : "Haftalar yuklenemedi");
      setAvailableWeeks([]);
      setSelectedWeekId(null);
    } finally {
      setAvailableWeeksLoading(false);
    }
  }, [businessId]);

  // Fetch stats when selectedWeekId changes
  const fetchStats = useCallback(async () => {
    if (!businessId || !selectedWeekId) {
      setStats(null);
      return;
    }

    setStatsLoading(true);
    setError(null);

    try {
      const weekStats = await getInstagramStatsByWeek(businessId, selectedWeekId);
      setStats(weekStats);
    } catch (err) {
      console.error("Error fetching Instagram stats:", err);
      setError(err instanceof Error ? err.message : "Istatistikler yuklenemedi");
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [businessId, selectedWeekId]);

  // Full refetch
  const refetch = useCallback(async () => {
    await fetchAvailableWeeks();
  }, [fetchAvailableWeeks]);

  // Fetch available weeks when businessId changes
  useEffect(() => {
    fetchAvailableWeeks();
  }, [fetchAvailableWeeks]);

  // Fetch stats when selectedWeekId changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    availableWeeks,
    availableWeeksLoading,
    selectedWeekId,
    setSelectedWeekId,
    stats,
    statsLoading,
    error,
    refetch,
  };
}
