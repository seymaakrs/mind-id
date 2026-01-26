"use client";

import { useState } from "react";
import { ApiProvider, TimeRange } from "@/types/statistics";
import { ApiSidebar } from "./api-sidebar";
import { TimeRangeFilter } from "./time-range-filter";
import { AllStatsOverview } from "./providers/all-stats-overview";
import { ProviderStatsView } from "./providers/provider-stats-view";
import { BarChart3 } from "lucide-react";

export function ApiStatisticsPanel() {
  const [activeProvider, setActiveProvider] = useState<ApiProvider>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  return (
    <div className="flex h-full min-h-[600px] bg-background rounded-lg border border-border overflow-hidden">
      {/* Sidebar */}
      <ApiSidebar
        activeProvider={activeProvider}
        onProviderChange={setActiveProvider}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">API Istatistikleri</h1>
          </div>
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeProvider === "all" ? (
            <AllStatsOverview timeRange={timeRange} />
          ) : (
            <ProviderStatsView provider={activeProvider} timeRange={timeRange} />
          )}
        </div>
      </div>
    </div>
  );
}
