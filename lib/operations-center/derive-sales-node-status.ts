import type { AgentStatus } from "@/components/mind-id-canvas/data/agentGraph"
import { SALES_WORKFLOW_REGISTRY } from "@/lib/sales/workflow-registry"
import type { SalesOperationsResponse } from "@/types/sales-operations"

const RECENT_EXEC_MS = 6 * 60 * 60 * 1000

function isRecent(iso: string | null): boolean {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() < RECENT_EXEC_MS
}

export function deriveSalesNodeStatuses(
  sales: SalesOperationsResponse | null | undefined
): Record<string, AgentStatus> {
  const states: Record<string, AgentStatus> = {}

  if (!sales) return states

  for (const entry of SALES_WORKFLOW_REGISTRY) {
    if (entry.planned) {
      states[entry.nodeId] = "blocked"
      continue
    }
  }

  for (const wf of sales.workflows) {
    if (wf.recentLeadWrites > 0) {
      states[wf.nodeId] = "running"
      continue
    }
    if (!wf.active) {
      states[wf.nodeId] = "blocked"
      continue
    }
    if (wf.lastExecutionStatus === "error") {
      states[wf.nodeId] = "blocked"
      continue
    }
    if (wf.lastExecutionStatus === "running") {
      states[wf.nodeId] = "running"
      continue
    }
    if (
      wf.lastExecutionStatus === "success" &&
      isRecent(wf.lastExecutionAt)
    ) {
      states[wf.nodeId] = "completed"
      continue
    }
    states[wf.nodeId] = "idle"
  }

  const anySalesRunning = sales.workflows.some(
    (w) => states[w.nodeId] === "running"
  )
  const anySalesBlocked = sales.workflows.some(
    (w) => states[w.nodeId] === "blocked"
  )

  if (sales.configured.n8n) {
    if (!sales.n8nReachable) {
      states["n8n-sales-hub"] = "blocked"
    } else if (anySalesRunning) {
      states["n8n-sales-hub"] = "running"
    } else if (anySalesBlocked) {
      states["n8n-sales-hub"] = "waiting"
    } else {
      states["n8n-sales-hub"] = "idle"
    }
  }

  if (sales.leads) {
    if (sales.leads.updatedLastHour > 0) {
      states["nocodb-leads"] = "running"
    } else if (sales.leads.total > 0) {
      states["nocodb-leads"] = "waiting"
    } else {
      states["nocodb-leads"] = "idle"
    }

    if (sales.leads.hotCount > 0 || sales.leads.newLast24h > 0) {
      states["sales-panel"] = "running"
    } else if (sales.leads.total > 0) {
      states["sales-panel"] = "waiting"
    } else {
      states["sales-panel"] = "idle"
    }
  }

  return states
}
