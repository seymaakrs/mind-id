import type { RepoKey, StatusKey, NodeType } from "../topology/types"

export type DeckViewMode = "command" | "ecosystem"

export type DeckVisualKind = "ghost" | "leaf"

export interface DeckNodeData extends Record<string, unknown> {
  title: string
  role: string
  description: string
  type: NodeType
  status: StatusKey
  repo: RepoKey | "root"
  collaboratesWith: string[]
  visualKind: DeckVisualKind
  branchColor: string
  parentId?: string
  /** Komut akışı modunda adım numarası */
  flowStep?: number
  /** mind-agent teknik adı (örn. image_agent) */
  agentKey?: string
  /** Kart üstü kısa etiket */
  tag?: string
}

export type DeckEdgeKind = "hierarchy" | "collaboration"

export interface DeckEdgeData extends Record<string, unknown> {
  branchColor: string
  kind: DeckEdgeKind
  animated?: boolean
  /** Kablo üstü açıklama */
  label?: string
}

export interface DeckFlowLabelData extends Record<string, unknown> {
  title: string
  subtitle: string
}
