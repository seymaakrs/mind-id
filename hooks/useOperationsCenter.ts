"use client"

import { useMemo } from "react"
import { useActiveTasks } from "@/contexts/ActiveTasksContext"
import { useErrorNotifications } from "@/contexts/ErrorNotificationContext"
import { useTaskStream } from "@/contexts/TaskStreamContext"
import { useServerHealth } from "@/hooks/useServerHealth"
import { useBusinesses } from "@/hooks/useBusinesses"
import { useAllApiStatistics } from "@/hooks/useApiStatistics"
import { deriveNodeStatuses } from "@/lib/operations-center/derive-node-status"
import { buildActivityLines } from "@/lib/operations-center/build-activity-lines"
import type { AgentStatus } from "@/components/mind-id-canvas/data/agentGraph"
import { AGENT_GRAPH_NODES } from "@/components/mind-id-canvas/data/agentGraph"
import { isTaskStuck } from "@/types/active-tasks"
import { useSalesOperations } from "@/hooks/useSalesOperations"

export type OpsNavigateTarget =
  | "agent"
  | "aktif-gorevler"
  | "istatistikler"
  | "isletmeler"
  | "settings"

export function nodeIdToNavigateTarget(nodeId: string): OpsNavigateTarget | null {
  if (
    nodeId === "panel-agent" ||
    nodeId === "api-agent-task" ||
    nodeId === "orchestrator" ||
    nodeId === "image_agent" ||
    nodeId === "video_agent" ||
    nodeId === "marketing_agent" ||
    nodeId === "analysis_agent"
  ) {
    return "agent"
  }
  if (nodeId === "active-tasks" || nodeId === "firestore") {
    return "aktif-gorevler"
  }
  if (nodeId === "portal-mind-id") return null
  return null
}

export function useOperationsCenter() {
  const {
    tasks: activeTasks,
    loading: activeTasksLoading,
    runningCount,
    stuckCount,
    failedCount,
    successCount,
  } = useActiveTasks()

  const {
    errors,
    unreadCount: errorCount,
    loading: errorsLoading,
  } = useErrorNotifications()

  const { activeTasks: streamTasks } = useTaskStream()
  const {
    status: serverHealth,
    message: serverMessage,
    loading: healthLoading,
  } = useServerHealth(true)

  const { businesses, loading: businessesLoading } = useBusinesses()
  const { allStats, loading: statsLoading } = useAllApiStatistics("7d")
  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useSalesOperations()

  const nodeStates = useMemo(() => {
    const derived = deriveNodeStatuses({
      activeTasks,
      errors,
      serverHealth,
      streamTasks,
      sales: salesData,
    })
    const merged: Record<string, AgentStatus> = {}
    for (const node of AGENT_GRAPH_NODES) {
      merged[node.id] = derived[node.id] ?? "idle"
    }
    return merged
  }, [activeTasks, errors, serverHealth, streamTasks, salesData])

  const activityLines = useMemo(
    () =>
      buildActivityLines({
        activeTasks,
        errors,
        streamTasks,
        serverHealth,
        serverMessage,
        sales: salesData,
      }),
    [activeTasks, errors, streamTasks, serverHealth, serverMessage, salesData]
  )

  const apiPeriodSpend = useMemo(
    () =>
      allStats.reduce((sum, s) => sum + s.summary.currentPeriodSpend, 0),
    [allStats]
  )

  const apiProvidersWithData = useMemo(
    () =>
      allStats.filter(
        (s) =>
          s.summary.currentPeriodSpend > 0 ||
          s.summary.creditsRemaining !== undefined
      ).length,
    [allStats]
  )

  const operationalTasks = useMemo(
    () =>
      [...activeTasks]
        .filter(
          (t) =>
            t.status === "running" ||
            isTaskStuck(t) ||
            t.status === "failed"
        )
        .sort((a, b) => {
          const pa = isTaskStuck(a) ? 0 : a.status === "running" ? 1 : 2
          const pb = isTaskStuck(b) ? 0 : b.status === "running" ? 1 : 2
          return pa - pb
        })
        .slice(0, 8),
    [activeTasks]
  )

  const isLoading =
    activeTasksLoading || errorsLoading || healthLoading || salesLoading

  return {
    nodeStates,
    activityLines,
    activeTasks,
    activeTasksLoading,
    operationalTasks,
    runningCount,
    stuckCount,
    failedCount,
    successCount,
    errorCount,
    errors,
    errorsLoading,
    serverHealth,
    serverMessage,
    healthLoading,
    streamTasks,
    businessesCount: businesses.length,
    businessesLoading,
    apiPeriodSpend,
    apiProvidersWithData,
    statsLoading,
    salesData,
    salesLoading,
    salesError,
    isLoading,
  }
}
