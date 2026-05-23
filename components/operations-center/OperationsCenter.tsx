"use client"

import { MindIDCanvas } from "@/components/mind-id-canvas/MindIDCanvas"
import {
  useOperationsCenter,
  type OpsNavigateTarget,
} from "@/hooks/useOperationsCenter"
import { OpsMetricsBar } from "./OpsMetricsBar"
import { OpsActiveTasksRail } from "./OpsActiveTasksRail"

interface OperationsCenterProps {
  onNavigate: (target: OpsNavigateTarget) => void
}

export function OperationsCenter({ onNavigate }: OperationsCenterProps) {
  const ops = useOperationsCenter()

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <OpsMetricsBar
        runningCount={ops.runningCount}
        stuckCount={ops.stuckCount}
        failedCount={ops.failedCount}
        errorCount={ops.errorCount}
        serverHealth={ops.serverHealth}
        healthLoading={ops.healthLoading}
        apiPeriodSpend={ops.apiPeriodSpend}
        apiProvidersWithData={ops.apiProvidersWithData}
        statsLoading={ops.statsLoading}
        hotLeadsCount={ops.salesData?.leads?.hotCount ?? 0}
        newLeads24h={ops.salesData?.leads?.newLast24h ?? 0}
        salesConfigured={
          ops.salesData?.configured.nocodb === true ||
          ops.salesData?.configured.n8n === true
        }
        isLoading={ops.isLoading}
        onNavigate={onNavigate}
      />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <MindIDCanvas
            nodeStates={ops.nodeStates}
            activityLines={ops.activityLines}
            onNavigate={onNavigate}
          />
        </div>
        <OpsActiveTasksRail
          tasks={ops.operationalTasks}
          loading={ops.activeTasksLoading}
          onViewAll={() => onNavigate("aktif-gorevler")}
        />
      </div>
    </div>
  )
}
