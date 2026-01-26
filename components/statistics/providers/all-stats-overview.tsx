"use client";

import { TimeRange } from "@/types/statistics";
import { useAllApiStatistics } from "@/hooks/useApiStatistics";
import { SpendingBarChart } from "../api-charts/spending-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface AllStatsOverviewProps {
  timeRange: TimeRange;
}

export function AllStatsOverview({ timeRange }: AllStatsOverviewProps) {
  const { allStats, loading, error } = useAllApiStatistics(timeRange);

  // Filter stats that have real data
  const statsWithData = allStats.filter(
    (stat) =>
      stat.summary.currentPeriodSpend > 0 ||
      stat.summary.creditsRemaining !== undefined ||
      stat.billingAccount
  );

  // Calculate totals only from providers with real spend data
  const totalSpend = allStats.reduce(
    (sum, stat) => sum + stat.summary.currentPeriodSpend,
    0
  );
  const totalRequests = allStats.reduce(
    (sum, stat) => sum + (stat.summary.requests || 0),
    0
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Hata: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Toplam Donem Harcamasi
                </p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? "..." : `$${totalSpend.toFixed(2)}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Veri Alinan Servisler
                </p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? "..." : `${statsWithData.length}/${allStats.length}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam API Istekleri</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? "..." : totalRequests.toLocaleString("tr-TR")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart Comparison - only show if we have data */}
      {statsWithData.length > 0 && (
        <SpendingBarChart data={allStats} loading={loading} />
      )}

      {/* Individual Provider Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servis Detaylari</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-muted-foreground">Yukleniyor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Servis
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Durum
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Donem Harcamasi
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Ek Bilgi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allStats.map((stat) => {
                    const hasData =
                      stat.summary.currentPeriodSpend > 0 ||
                      stat.summary.creditsRemaining !== undefined;
                    const hasBillingAccount = stat.billingAccount !== undefined;
                    const isConfigured = stat.configured !== false;

                    return (
                      <tr
                        key={stat.provider}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium">{stat.summary.label}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {stat.error ? (
                            <span className="inline-flex items-center gap-1 text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Hata
                            </span>
                          ) : hasData ? (
                            <span className="inline-flex items-center gap-1 text-green-500 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              Aktif
                            </span>
                          ) : hasBillingAccount ? (
                            <span className="inline-flex items-center gap-1 text-blue-500 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              Bagli
                            </span>
                          ) : isConfigured ? (
                            <span className="inline-flex items-center gap-1 text-yellow-500 text-sm">
                              <Clock className="w-4 h-4" />
                              Veri Yok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Yapilandirilmamis
                            </span>
                          )}
                        </td>
                        <td className="text-right py-3 px-4">
                          {stat.summary.currentPeriodSpend > 0
                            ? `$${stat.summary.currentPeriodSpend.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground text-sm">
                          {stat.summary.creditsRemaining !== undefined
                            ? `${stat.summary.creditsRemaining} kredi`
                            : stat.billingAccount
                              ? stat.billingAccount.displayName
                              : stat.note
                                ? "BigQuery gerekli"
                                : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
