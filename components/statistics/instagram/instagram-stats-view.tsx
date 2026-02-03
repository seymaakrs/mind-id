"use client";

import { Instagram, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useInstagramStatistics } from "@/hooks/useInstagramStatistics";
import { useState } from "react";
import { InstagramWeekSelector } from "./instagram-week-selector";
import { InstagramSummaryCards } from "./instagram-summary-cards";
import { InstagramContentBreakdown } from "./instagram-content-breakdown";
import { InstagramTopPosts } from "./instagram-top-posts";
import { InstagramAgentSummary } from "./instagram-agent-summary";

export function InstagramStatsView() {
  const { businesses, loading: businessesLoading } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const {
    availableWeeks,
    availableWeeksLoading,
    selectedWeekId,
    setSelectedWeekId,
    stats,
    statsLoading,
    error,
    refetch,
  } = useInstagramStatistics(selectedBusinessId || null);

  const isLoading = statsLoading || availableWeeksLoading;
  const hasNoData = !isLoading && availableWeeks.length === 0 && selectedBusinessId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#E1306C20" }}
          >
            <Instagram className="w-5 h-5" style={{ color: "#E1306C" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Instagram Istatistikleri</h2>
            <p className="text-sm text-muted-foreground">
              Haftalik performans metrikleri
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={!selectedBusinessId || isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Selectors row */}
      <div className="flex flex-wrap items-center gap-4">
        <BusinessSelector
          businesses={businesses}
          loading={businessesLoading}
          selectedId={selectedBusinessId}
          onSelect={setSelectedBusinessId}
          placeholder="Isletme secin"
          className="w-[280px]"
        />

        {selectedBusinessId && (
          <InstagramWeekSelector
            weeks={availableWeeks}
            selectedWeekId={selectedWeekId}
            onWeekChange={setSelectedWeekId}
            loading={availableWeeksLoading}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state - no business selected */}
      {!selectedBusinessId && !businessesLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "#E1306C20" }}
          >
            <Instagram className="w-8 h-8" style={{ color: "#E1306C" }} />
          </div>
          <h3 className="text-lg font-medium mb-2">Isletme Secin</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Instagram istatistiklerini goruntulemek icin yukaridaki menudan bir isletme secin.
          </p>
        </div>
      )}

      {/* Empty state - no data for selected business */}
      {hasNoData && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Instagram className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Henuz Veri Yok</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Bu isletme icin henuz Instagram istatistik verisi bulunmuyor.
            Veriler haftalik olarak otomatik toplanacaktir.
          </p>
        </div>
      )}

      {/* Stats content */}
      {stats && (
        <div className="space-y-6">
          <InstagramSummaryCards stats={stats} loading={statsLoading} />
          <InstagramContentBreakdown stats={stats} loading={statsLoading} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InstagramTopPosts stats={stats} loading={statsLoading} />
            <InstagramAgentSummary stats={stats} loading={statsLoading} />
          </div>
        </div>
      )}

      {/* Loading state when fetching stats but no stats yet */}
      {isLoading && !stats && selectedBusinessId && selectedWeekId && (
        <div className="space-y-6">
          <InstagramSummaryCards stats={null as unknown as any} loading={true} />
          <InstagramContentBreakdown stats={null as unknown as any} loading={true} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InstagramTopPosts stats={null as unknown as any} loading={true} />
            <InstagramAgentSummary stats={null as unknown as any} loading={true} />
          </div>
        </div>
      )}
    </div>
  );
}
