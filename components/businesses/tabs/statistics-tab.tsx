"use client";

import { Instagram, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstagramStatistics } from "@/hooks/useInstagramStatistics";
import { InstagramWeekSelector } from "@/components/statistics/instagram/instagram-week-selector";
import { InstagramSummaryCards } from "@/components/statistics/instagram/instagram-summary-cards";
import { InstagramContentBreakdown } from "@/components/statistics/instagram/instagram-content-breakdown";
import { InstagramTopPosts } from "@/components/statistics/instagram/instagram-top-posts";
import { InstagramAgentSummary } from "@/components/statistics/instagram/instagram-agent-summary";

interface StatisticsTabProps {
  businessId: string;
}

export function StatisticsTab({ businessId }: StatisticsTabProps) {
  const {
    availableWeeks,
    availableWeeksLoading,
    selectedWeekId,
    setSelectedWeekId,
    stats,
    statsLoading,
    error,
    refetch,
  } = useInstagramStatistics(businessId);

  const isLoading = statsLoading || availableWeeksLoading;
  const hasNoData = !isLoading && availableWeeks.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#E1306C20" }}
          >
            <Instagram className="w-5 h-5" style={{ color: "#E1306C" }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Instagram Istatistikleri</h3>
            <p className="text-sm text-muted-foreground">
              Haftalik performans metrikleri
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InstagramWeekSelector
            weeks={availableWeeks}
            selectedWeekId={selectedWeekId}
            onWeekChange={setSelectedWeekId}
            loading={availableWeeksLoading}
            disabled={isLoading}
          />

          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state - no data */}
      {hasNoData && (
        <Card>
          <CardContent className="py-16 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#E1306C20" }}
            >
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Henuz Veri Yok</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Bu isletme icin henuz Instagram istatistik verisi bulunmuyor.
              Veriler haftalik olarak otomatik toplanacaktir.
            </p>
          </CardContent>
        </Card>
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
      {isLoading && !stats && selectedWeekId && (
        <div className="space-y-6">
          <InstagramSummaryCards stats={null as never} loading={true} />
          <InstagramContentBreakdown stats={null as never} loading={true} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InstagramTopPosts stats={null as never} loading={true} />
            <InstagramAgentSummary stats={null as never} loading={true} />
          </div>
        </div>
      )}
    </div>
  );
}
