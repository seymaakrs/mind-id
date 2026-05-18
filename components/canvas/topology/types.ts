export type RepoKey = "mind-id" | "mind-agent" | "mindid-nocodb" | "customer_agent"
export type StatusKey = "calisir" | "devam" | "hata" | "pasif"
export type NodeType = "page" | "agent" | "data" | "integration" | "workflow" | "hub" | "root"

export interface TopologyNodeData extends Record<string, unknown> {
  title: string
  role: string
  description: string
  type: NodeType
  status: StatusKey
  repo: RepoKey | "root"
  collaboratesWith: string[]
}

export interface TopologyRawNode extends TopologyNodeData {
  id: string
  type: NodeType
}

export type CyberEdgeKind = "hierarchy" | "collaboration"

export interface CyberEdgeData extends Record<string, unknown> {
  kind: CyberEdgeKind
}
