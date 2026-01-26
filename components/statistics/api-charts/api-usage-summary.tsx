"use client";

import { ApiUsageSummary, PROVIDER_INFO } from "@/types/statistics";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Zap, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiUsageSummaryCardsProps {
  summary: ApiUsageSummary;
  loading?: boolean;
}

export function ApiUsageSummaryCards({
  summary,
  loading,
}: ApiUsageSummaryCardsProps) {
  const info = PROVIDER_INFO[summary.provider];

  const TrendIcon =
    summary.trend > 0 ? TrendingUp : summary.trend < 0 ? TrendingDown : Minus;
  const trendColor =
    summary.trend > 0
      ? "text-red-500"
      : summary.trend < 0
        ? "text-green-500"
        : "text-muted-foreground";

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Donem Harcamasi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Donem Harcamasi</p>
              <p className="text-2xl font-bold mt-1">
                ${summary.currentPeriodSpend.toFixed(2)}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${info.color}20` }}
            >
              <DollarSign className="w-6 h-6" style={{ color: info.color }} />
            </div>
          </div>
          <div className={cn("flex items-center gap-1 mt-2 text-sm", trendColor)}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(summary.trend)}% onceki doneme gore</span>
          </div>
        </CardContent>
      </Card>

      {/* Toplam Harcama */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Harcama</p>
              <p className="text-2xl font-bold mt-1">
                ${summary.totalSpend.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Tum zamanlar</p>
        </CardContent>
      </Card>

      {/* API Istekleri veya Token Kullanimi */}
      {summary.tokensUsed !== undefined ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Token Kullanimi</p>
                <p className="text-2xl font-bold mt-1">
                  {(summary.tokensUsed / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Bu donemde</p>
          </CardContent>
        </Card>
      ) : summary.requests !== undefined ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Istekleri</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.requests.toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Bu donemde</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Kalan Kredi (CloudConvert icin) */}
      {summary.creditsRemaining !== undefined ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kalan Kredi</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.creditsRemaining}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Mevcut bakiye
            </p>
          </CardContent>
        </Card>
      ) : summary.requests !== undefined && summary.tokensUsed !== undefined ? null : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Istekleri</p>
                <p className="text-2xl font-bold mt-1">
                  {(summary.requests || 0).toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Bu donemde</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
