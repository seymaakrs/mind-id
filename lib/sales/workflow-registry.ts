/**
 * Canvas node ↔ n8n workflow eşlemesi (customer_agent/n8n/workflows export ile senkron).
 * n8n ID'leri canlı API ile doğrulanır; planned olanların workflow'u yoktur.
 */
export interface SalesWorkflowRegistryEntry {
  nodeId: string
  n8nWorkflowId?: string
  n8nName: string
  planned: boolean
}

export const SALES_WORKFLOW_REGISTRY: SalesWorkflowRegistryEntry[] = [
  {
    nodeId: "sales-lead-toplama",
    n8nWorkflowId: "l31p16NRZeyk4eEm",
    n8nName: "Lead Toplama Agent",
    planned: false,
  },
  {
    nodeId: "sales-meta-lead",
    n8nWorkflowId: "xblguxS49CJ4r4OF",
    n8nName: "Meta Lead Ads Agent",
    planned: false,
  },
  {
    nodeId: "sales-takip",
    n8nWorkflowId: "nWNMQYHJzsMvMUGP",
    n8nName: "Takip Agent",
    planned: false,
  },
  {
    nodeId: "sales-itiraz",
    n8nWorkflowId: "9nTdKNPLCjo8DKfE",
    n8nName: "Itiraz Agent",
    planned: false,
  },
  {
    nodeId: "sales-upsell",
    n8nWorkflowId: "kVXXr4e6O5F3lGiD",
    n8nName: "Upsell Agent",
    planned: false,
  },
  {
    nodeId: "sales-referans",
    n8nWorkflowId: "28hnN6OrH5TF9NX2",
    n8nName: "Referans Agent",
    planned: false,
  },
  {
    nodeId: "sales-mail",
    n8nWorkflowId: "faolAyTcoUJIBcal",
    n8nName: "Müşteri Mail Otomasyonu (Claude Trigger)",
    planned: false,
  },
  { nodeId: "sales-linkedin", n8nName: "LinkedIn Agent", planned: true },
  { nodeId: "sales-clay", n8nName: "Clay Local Agent", planned: true },
  { nodeId: "sales-igdm", n8nName: "Instagram DM Agent", planned: true },
]

export function resolveRegistryN8nIds(
  remoteWorkflows: Array<{ id: string; name: string }>
): SalesWorkflowRegistryEntry[] {
  return SALES_WORKFLOW_REGISTRY.map((entry) => {
    if (entry.planned || entry.n8nWorkflowId) return entry
    const match = remoteWorkflows.find(
      (w) => w.name === entry.n8nName || w.name.includes(entry.n8nName)
    )
    if (!match) return entry
    return { ...entry, n8nWorkflowId: match.id }
  })
}
