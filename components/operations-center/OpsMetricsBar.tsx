"use client"

import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  XCircle,
  Server,
  ServerOff,
  Loader2,
  BarChart3,
  Flame,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ServerStatus } from "@/hooks/useServerHealth"
import type { OpsNavigateTarget } from "@/hooks/useOperationsCenter"
import { CURRENCY_SYMBOLS } from "@/types/statistics"

interface OpsMetricsBarProps {
  runningCount: number
  stuckCount: number
  failedCount: number
  errorCount: number
  serverHealth: ServerStatus
  healthLoading: boolean
  apiPeriodSpend: number
  apiProvidersWithData: number
  statsLoading: boolean
  hotLeadsCount: number
  newLeads24h: number
  salesConfigured: boolean
  isLoading: boolean
  onNavigate: (target: OpsNavigateTarget) => void
}

function MetricChip({
  label,
  value,
  icon: Icon,
  tone = "default",
  onClick,
  pulse,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: "default" | "blue" | "red" | "green" | "amber"
  onClick?: () => void
  pulse?: boolean
}) {
  const toneClass = {
    default: "border-border text-foreground",
    blue: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    red: "border-red-500/40 text-red-400 bg-red-500/5",
    green: "border-green-500/40 text-green-400 bg-green-500/10",
    amber: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  }[tone]

  const inner = (
  <>
      <Icon className={cn("h-3.5 w-3.5 shrink-0", pulse && "animate-pulse")} />
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
    </>
  )

  if (onClick) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        className={cn(
          "h-7 gap-1.5 rounded-full px-2.5 font-normal",
          toneClass,
          pulse && "animate-pulse"
        )}
      >
        {inner}
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full border px-2.5",
        toneClass,
        pulse && "animate-pulse"
      )}
    >
      {inner}
    </div>
  )
}

export function OpsMetricsBar({
  runningCount,
  stuckCount,
  failedCount,
  errorCount,
  serverHealth,
  healthLoading,
  apiPeriodSpend,
  apiProvidersWithData,
  statsLoading,
  hotLeadsCount,
  newLeads24h,
  salesConfigured,
  isLoading,
  onNavigate,
}: OpsMetricsBarProps) {
  const showHealth =
    !healthLoading &&
    (serverHealth === "disconnected" || serverHealth === "error")
  const showSpend = !statsLoading && apiPeriodSpend > 0
  const hasAnyMetric =
    runningCount > 0 ||
    stuckCount > 0 ||
    failedCount > 0 ||
    errorCount > 0 ||
    showHealth ||
    showSpend ||
    hotLeadsCount > 0 ||
    newLeads24h > 0

  if (isLoading && !hasAnyMetric) {
    return (
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur-sm">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Operasyon verisi yükleniyor…</span>
      </div>
    )
  }

  if (!hasAnyMetric) return null

  const currencySymbol = CURRENCY_SYMBOLS.USD

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur-sm">
      <span className="mr-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Komuta
      </span>

      {runningCount > 0 && (
        <MetricChip
          label="Çalışıyor"
          value={runningCount}
          icon={Activity}
          tone="blue"
          onClick={() => onNavigate("aktif-gorevler")}
        />
      )}
      {stuckCount > 0 && (
        <MetricChip
          label="Takıldı"
          value={stuckCount}
          icon={AlertTriangle}
          tone="red"
          pulse
          onClick={() => onNavigate("aktif-gorevler")}
        />
      )}
      {failedCount > 0 && (
        <MetricChip
          label="Başarısız"
          value={failedCount}
          icon={XCircle}
          tone="red"
          onClick={() => onNavigate("aktif-gorevler")}
        />
      )}
      {errorCount > 0 && (
        <MetricChip
          label="Hata"
          value={errorCount}
          icon={AlertTriangle}
          tone="amber"
        />
      )}
      {showHealth && (
        <MetricChip
          label="Mutfak"
          value="Kapalı"
          icon={ServerOff}
          tone="red"
          onClick={() => onNavigate("settings")}
        />
      )}
      {serverHealth === "connected" && runningCount > 0 && (
        <MetricChip label="Mutfak" value="Açık" icon={Server} tone="green" />
      )}
      {salesConfigured && hotLeadsCount > 0 && (
        <MetricChip
          label="Sıcak lead"
          value={hotLeadsCount}
          icon={Flame}
          tone="amber"
        />
      )}
      {salesConfigured && newLeads24h > 0 && (
        <MetricChip
          label="24s lead"
          value={newLeads24h}
          icon={UserPlus}
          tone="green"
        />
      )}
      {showSpend && (
        <MetricChip
          label={`7g API (${apiProvidersWithData})`}
          value={`${currencySymbol}${apiPeriodSpend.toFixed(2)}`}
          icon={BarChart3}
          tone="default"
          onClick={() => onNavigate("istatistikler")}
        />
      )}
    </div>
  )
}
