"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ApiProvider,
  TimeRange,
  ProviderStats,
  PROVIDER_INFO,
  BillingAccountInfo,
} from "@/types/statistics";

// Define response types for API data
interface GoogleCloudServiceData {
  service: string;
  label: string;
  configured: boolean;
  projectId?: string;
  billingAccount?: {
    name: string;
    displayName: string;
    open: boolean;
  };
  linkedProjects?: number;
  summary?: {
    totalSpend?: number;
    currentPeriodSpend?: number;
    trend?: number;
    requests?: number;
    tokensUsed?: number;
  };
  dailyData?: { date: string; amount: number }[];
  note?: string;
}

// Fetch real stats from API
async function fetchRealStats(
  provider: ApiProvider,
  timeRange: TimeRange
): Promise<ProviderStats> {
  const endpoint = getApiEndpoint(provider);

  if (!endpoint) {
    // "all" view - will be handled by useAllApiStatistics
    return {
      provider,
      summary: {
        provider,
        label: PROVIDER_INFO[provider].label,
        totalSpend: 0,
        currentPeriodSpend: 0,
        trend: 0,
      },
      dailyData: [],
      loading: false,
      error: null,
    };
  }

  // Add timeRange if not already in endpoint
  const url = endpoint.includes("?")
    ? `${endpoint}&timeRange=${timeRange}`
    : `${endpoint}?timeRange=${timeRange}`;

  const response = await fetch(url);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "API hatasi");
  }

  const data = result.data;

  // Handle Google Cloud API response format (has services array)
  if (data.services && Array.isArray(data.services)) {
    const serviceData = data.services.find(
      (s: GoogleCloudServiceData) => s.service === provider
    ) as GoogleCloudServiceData | undefined;

    if (serviceData) {
      // Build billing account info if available
      let billingAccount: BillingAccountInfo | undefined;
      if (serviceData.configured && serviceData.billingAccount) {
        billingAccount = {
          name: serviceData.billingAccount.name,
          displayName: serviceData.billingAccount.displayName,
          open: serviceData.billingAccount.open,
          linkedProjects: serviceData.linkedProjects || 0,
          projectId: serviceData.projectId || "",
        };
      }

      return {
        provider,
        summary: {
          provider,
          label: PROVIDER_INFO[provider].label,
          totalSpend: serviceData.summary?.totalSpend || 0,
          currentPeriodSpend: serviceData.summary?.currentPeriodSpend || 0,
          trend: serviceData.summary?.trend || 0,
          requests: serviceData.summary?.requests,
          tokensUsed: serviceData.summary?.tokensUsed,
        },
        dailyData: serviceData.dailyData || [],
        loading: false,
        error: null,
        billingAccount,
        configured: serviceData.configured,
        note: serviceData.note || data.note,
      };
    }
  }

  // Standard response format (OpenAI, CloudConvert)
  return {
    provider,
    summary: {
      provider,
      label: PROVIDER_INFO[provider].label,
      totalSpend: data.summary?.totalSpend || 0,
      currentPeriodSpend: data.summary?.currentPeriodSpend || 0,
      trend: data.summary?.trend || 0,
      requests: data.summary?.requests,
      tokensUsed: data.summary?.tokensUsed,
      creditsRemaining: data.summary?.creditsRemaining,
    },
    dailyData: data.dailyData || [],
    loading: false,
    error: null,
    configured: true,
  };
}

// Get API endpoint for provider
function getApiEndpoint(provider: ApiProvider): string | null {
  switch (provider) {
    case "openai":
      return "/api/statistics/openai";
    case "cloudconvert":
      return "/api/statistics/cloudconvert";
    case "gemini":
      return "/api/statistics/google-ai?service=gemini";
    case "veo":
      return "/api/statistics/google-ai?service=veo";
    case "firebase":
      return "/api/statistics/google-ai?service=firebase";
    default:
      return null;
  }
}

export function useApiStatistics(provider: ApiProvider, timeRange: TimeRange) {
  const [stats, setStats] = useState<ProviderStats>({
    provider,
    summary: {
      provider,
      label: PROVIDER_INFO[provider].label,
      totalSpend: 0,
      currentPeriodSpend: 0,
      trend: 0,
    },
    dailyData: [],
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // For "all" view, we don't fetch here - use useAllApiStatistics
      if (provider === "all") {
        setStats((prev) => ({ ...prev, loading: false }));
        return;
      }

      const realStats = await fetchRealStats(provider, timeRange);
      setStats(realStats);
    } catch (error) {
      console.error(`Error fetching ${provider} stats:`, error);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      }));
    }
  }, [provider, timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, refetch: fetchStats };
}

// Hook for fetching all providers at once (for comparison view)
export function useAllApiStatistics(timeRange: TimeRange) {
  const [allStats, setAllStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const providers: ApiProvider[] = ["openai", "gemini", "veo", "cloudconvert", "firebase"];

      // Fetch all providers in parallel
      const statsPromises = providers.map(async (p) => {
        try {
          return await fetchRealStats(p, timeRange);
        } catch (err) {
          // Return error state for this provider
          return {
            provider: p,
            summary: {
              provider: p,
              label: PROVIDER_INFO[p].label,
              totalSpend: 0,
              currentPeriodSpend: 0,
              trend: 0,
            },
            dailyData: [],
            loading: false,
            error: err instanceof Error ? err.message : "API hatasi",
          } as ProviderStats;
        }
      });

      const stats = await Promise.all(statsPromises);
      setAllStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  return { allStats, loading, error, refetch: fetchAllStats };
}
