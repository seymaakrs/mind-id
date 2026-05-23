import { listLeadRecords, isNocoDBConfigured } from "@/lib/nocodb/client"
import {
  SALES_WORKFLOW_REGISTRY,
  resolveRegistryN8nIds,
  type SalesWorkflowRegistryEntry,
} from "@/lib/sales/workflow-registry"
import type {
  SalesActivityEvent,
  SalesLeadsSummary,
  SalesOperationsResponse,
  SalesWorkflowExecution,
} from "@/types/sales-operations"

const N8N_DEFAULT_BASE = "https://mindidai.app.n8n.cloud"

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000)
}

function parseNocoDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function summarizeLeads(
  rows: Record<string, unknown>[]
): SalesLeadsSummary {
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const hourAgo = now - 60 * 60 * 1000

  let hotCount = 0
  let newLast24h = 0
  let updatedLastHour = 0
  let lastLeadAt: string | null = null
  const byWorkflowId: Record<string, number> = {}

  for (const row of rows) {
    const asama = String(row.asama ?? "")
    const created = parseNocoDate(row.CreatedAt)
    const updated = parseNocoDate(row.UpdatedAt) ?? created
    const wfId = String(row.source_workflow_id ?? "unknown")

    if (asama === "Sicak") hotCount += 1
    if (created && created.getTime() >= dayAgo) newLast24h += 1
    if (updated && updated.getTime() >= hourAgo) updatedLastHour += 1

    if (updated) {
      const iso = updated.toISOString()
      if (!lastLeadAt || iso > lastLeadAt) lastLeadAt = iso
    }

    if (updated && updated.getTime() >= dayAgo) {
      byWorkflowId[wfId] = (byWorkflowId[wfId] ?? 0) + 1
    }
  }

  return {
    total: rows.length,
    hotCount,
    newLast24h,
    updatedLastHour,
    lastLeadAt,
    byWorkflowId,
  }
}

function buildLeadEvents(
  rows: Record<string, unknown>[],
  registry: SalesWorkflowRegistryEntry[]
): SalesActivityEvent[] {
  const events: SalesActivityEvent[] = []
  const hourAgo = hoursAgo(1)

  for (const row of rows.slice(0, 15)) {
    const updated = parseNocoDate(row.UpdatedAt) ?? parseNocoDate(row.CreatedAt)
    if (!updated || updated < hourAgo) continue

    const wfId = String(row.source_workflow_id ?? "")
    const entry = registry.find((r) => r.n8nWorkflowId === wfId)
    const ad = String(row.ad_soyad ?? "Lead")
    const asama = String(row.asama ?? "")
    events.push({
      at: updated.toISOString(),
      message: `Lead güncellendi: ${ad} · ${asama}${entry ? ` · ${entry.n8nName}` : ""}`,
      nodeId: entry?.nodeId,
    })
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12)
}

interface N8nWorkflowRemote {
  id: string
  name: string
  active: boolean
}

interface N8nExecutionRemote {
  id: string
  status: string
  startedAt: string
  stoppedAt?: string
}

function getN8nConfig(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.N8N_API_KEY?.trim()
  const baseUrl = (
    process.env.N8N_BASE_URL?.trim() || N8N_DEFAULT_BASE
  ).replace(/\/+$/, "")
  if (!apiKey) return null
  return { baseUrl: `${baseUrl}/api/v1`, apiKey }
}

async function fetchN8nWorkflows(): Promise<N8nWorkflowRemote[]> {
  const config = getN8nConfig()
  if (!config) return []

  const response = await fetch(`${config.baseUrl}/workflows`, {
    headers: { "X-N8N-API-KEY": config.apiKey },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`n8n workflows ${response.status}`)
  }

  const data = (await response.json()) as { data?: N8nWorkflowRemote[] }
  return data.data ?? []
}

async function fetchLastExecution(
  workflowId: string
): Promise<N8nExecutionRemote | null> {
  const config = getN8nConfig()
  if (!config) return null

  const url = new URL(`${config.baseUrl}/executions`)
  url.searchParams.set("workflowId", workflowId)
  url.searchParams.set("limit", "1")

  const response = await fetch(url.toString(), {
    headers: { "X-N8N-API-KEY": config.apiKey },
    cache: "no-store",
  })

  if (!response.ok) return null

  const data = (await response.json()) as { data?: N8nExecutionRemote[] }
  return data.data?.[0] ?? null
}

function mapExecutionStatus(
  status: string | undefined
): SalesWorkflowExecution["lastExecutionStatus"] {
  if (!status) return null
  const s = status.toLowerCase()
  if (s === "success" || s === "successful") return "success"
  if (s === "error" || s === "failed" || s === "crashed") return "error"
  if (s === "running" || s === "new" || s === "waiting") return "running"
  return "unknown"
}

async function buildWorkflowStatuses(
  leads: SalesLeadsSummary | null
): Promise<{
  workflows: SalesWorkflowExecution[]
  registry: SalesWorkflowRegistryEntry[]
  n8nReachable: boolean
}> {
  let remote: N8nWorkflowRemote[] = []

  try {
    remote = await fetchN8nWorkflows()
  } catch {
    return {
      workflows: [],
      registry: SALES_WORKFLOW_REGISTRY,
      n8nReachable: false,
    }
  }

  const resolved = resolveRegistryN8nIds(remote)
  const results: SalesWorkflowExecution[] = []

  for (const entry of resolved) {
    if (entry.planned) continue

    const remoteWf = entry.n8nWorkflowId
      ? remote.find((w) => w.id === entry.n8nWorkflowId)
      : undefined

    let lastExecution: N8nExecutionRemote | null = null
    if (entry.n8nWorkflowId) {
      try {
        lastExecution = await fetchLastExecution(entry.n8nWorkflowId)
      } catch {
        lastExecution = null
      }
    }

    const recentLeadWrites = entry.n8nWorkflowId
      ? (leads?.byWorkflowId[entry.n8nWorkflowId] ?? 0)
      : 0

    results.push({
      nodeId: entry.nodeId,
      n8nWorkflowId: entry.n8nWorkflowId ?? "",
      n8nName: entry.n8nName,
      active: remoteWf?.active ?? false,
      lastExecutionAt: lastExecution?.startedAt ?? null,
      lastExecutionStatus: mapExecutionStatus(lastExecution?.status),
      recentLeadWrites,
    })
  }

  return { workflows: results, registry: resolved, n8nReachable: true }
}

export async function fetchSalesOperations(): Promise<SalesOperationsResponse> {
  const fetchedAt = new Date().toISOString()
  const configured = {
    nocodb: isNocoDBConfigured(),
    n8n: getN8nConfig() !== null,
  }

  let leads: SalesLeadsSummary | null = null
  let leadRows: Record<string, unknown>[] = []
  const events: SalesActivityEvent[] = []

  if (configured.nocodb) {
    try {
      leadRows = await listLeadRecords(100)
      leads = summarizeLeads(leadRows)
    } catch (err) {
      events.push({
        at: fetchedAt,
        message: `NocoDB okuma hatası: ${err instanceof Error ? err.message : "bilinmeyen"}`,
      })
    }
  }

  let workflows: SalesWorkflowExecution[] = []
  let n8nReachable = false
  let registry = SALES_WORKFLOW_REGISTRY

  if (configured.n8n) {
    try {
      const built = await buildWorkflowStatuses(leads)
      workflows = built.workflows
      registry = built.registry
      n8nReachable = built.n8nReachable
    } catch (err) {
      events.push({
        at: fetchedAt,
        message: `n8n API hatası: ${err instanceof Error ? err.message : "bilinmeyen"}`,
      })
    }
  }

  if (leadRows.length > 0) {
    events.push(...buildLeadEvents(leadRows, registry))
  }

  return {
    success: true,
    fetchedAt,
    configured,
    n8nReachable,
    workflows,
    leads,
    events,
  }
}
