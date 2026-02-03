"use client";

import { ApiProvider, TimeRange, PROVIDER_INFO } from "@/types/statistics";
import { useApiStatistics } from "@/hooks/useApiStatistics";
import { SpendingLineChart } from "../api-charts/spending-line-chart";
import { ApiUsageSummaryCards } from "../api-charts/api-usage-summary";
import { AlertCircle, CheckCircle2, Building2, FolderKanban, Loader2, Info, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProviderStatsViewProps {
  provider: ApiProvider;
  timeRange: TimeRange;
}

export function ProviderStatsView({
  provider,
  timeRange,
}: ProviderStatsViewProps) {
  const { stats } = useApiStatistics(provider, timeRange);
  const info = PROVIDER_INFO[provider];

  // Loading state
  if (stats.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Yukleniyor...</p>
      </div>
    );
  }

  // Error state
  if (stats.error) {
    return (
      <div className="space-y-6">
        {/* Provider Header */}
        <ProviderHeader info={info} />

        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive text-center">{stats.error}</p>
        </div>
      </div>
    );
  }

  // Check if this is a Google Cloud service with billing account info
  const isGoogleCloudService = ["gemini", "veo", "firebase"].includes(provider);
  const isCloudConvert = provider === "cloudconvert";
  const hasBillingAccount = stats.billingAccount && stats.configured;
  const hasSpendData = stats.dailyData.length > 0 || stats.summary.currentPeriodSpend > 0;

  // CloudConvert - only show credit balance
  if (isCloudConvert) {
    return (
      <div className="space-y-6">
        <ProviderHeader info={info} />

        {/* Credit Balance Card */}
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mevcut Kredi Bakiyesi</p>
                <p className="text-4xl font-bold mt-2">
                  {stats.summary.creditsRemaining ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">kredi</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Coins className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CloudConvert Notice */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <p className="text-sm text-orange-200">
            <strong>Not:</strong> CloudConvert API&apos;si sadece mevcut kredi
            bakiyesini gosterir. Gecmis harcama verileri API uzerinden alinamiyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <ProviderHeader info={info} />

      {/* For Google Cloud services - show billing account info card */}
      {isGoogleCloudService && hasBillingAccount && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Faturalandirma Hesabi Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Hesap Adi</p>
                <p className="text-sm font-medium">{stats.billingAccount.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Durum</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  {stats.billingAccount.open ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      Kapali
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Proje ID</p>
                <p className="text-sm font-medium font-mono">{stats.billingAccount.projectId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bagli Projeler</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <FolderKanban className="w-3 h-3" />
                  {stats.billingAccount.linkedProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show summary cards for OpenAI (has real spend data) */}
      {hasSpendData && (
        <ApiUsageSummaryCards summary={stats.summary} loading={stats.loading} currency={stats.currency} />
      )}

      {/* Show chart if we have daily data */}
      {hasSpendData && (
        <SpendingLineChart
          data={stats.dailyData}
          provider={provider}
          loading={stats.loading}
          currency={stats.currency}
        />
      )}

      {/* Google Cloud Notice - show note from API */}
      {isGoogleCloudService && stats.note && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            {stats.note}
          </p>
        </div>
      )}

      {/* Not configured notice */}
      {isGoogleCloudService && !stats.configured && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <strong>Yapilandirilmamis:</strong> Bu servis icin gerekli environment
            degiskenleri ayarlanmamis. Billing bilgilerini gormek icin gerekli
            credentials&apos;lari .env.local dosyasina ekleyin.
          </div>
        </div>
      )}
    </div>
  );
}

// Provider header component
function ProviderHeader({ info }: { info: typeof PROVIDER_INFO[keyof typeof PROVIDER_INFO] }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${info.color}20` }}
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: info.color }}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{info.label}</h2>
        <p className="text-sm text-muted-foreground">{info.description}</p>
      </div>
    </div>
  );
}
