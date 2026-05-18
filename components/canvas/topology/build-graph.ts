import dagre from "@dagrejs/dagre"
import type { Edge, Node } from "@xyflow/react"
import { REPO_META, ROOT_META, TOPOLOGY_NODES } from "./data"
import type { CyberEdgeData, RepoKey, TopologyNodeData } from "./types"

const NODE_W = 228
const NODE_H = 76
const HUB_H = 88

function applyDagreLayout(
  nodes: Node<TopologyNodeData>[],
  edges: Edge<CyberEdgeData>[],
  rankdir: "TB" | "LR" = "TB"
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir, nodesep: 36, ranksep: 72, marginx: 24, marginy: 24 })

  nodes.forEach((n) => {
    const isHub = n.data.type === "hub" || n.data.type === "root"
    g.setNode(n.id, { width: NODE_W, height: isHub ? HUB_H : NODE_H })
  })
  edges
    .filter((e) => (e.data as CyberEdgeData | undefined)?.kind === "hierarchy")
    .forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    const h = n.data.type === "hub" || n.data.type === "root" ? HUB_H : NODE_H
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - h / 2 } }
  })
}

export function buildTopologyGraph(rankdir: "TB" | "LR" = "TB") {
  const nodes: Node<TopologyNodeData>[] = []
  const edges: Edge<CyberEdgeData>[] = []

  nodes.push({
    id: "root",
    type: "cyber",
    position: { x: 0, y: 0 },
    data: {
      title: ROOT_META.label,
      role: ROOT_META.sub,
      description: "4 repo / 19 bileşen — merkezi topoloji.",
      type: "root",
      status: "calisir",
      repo: "root",
      collaboratesWith: [],
    },
  })

  ;(Object.keys(REPO_META) as RepoKey[]).forEach((repo) => {
    const meta = REPO_META[repo]
    nodes.push({
      id: `hub-${repo}`,
      type: "cyber",
      position: { x: 0, y: 0 },
      data: {
        title: meta.label,
        role: meta.sub,
        description: `${meta.label} katmanı.`,
        type: "hub",
        status: "calisir",
        repo,
        collaboratesWith: [],
      },
    })
    edges.push({
      id: `e-root-${repo}`,
      source: "root",
      target: `hub-${repo}`,
      type: "cyber",
      data: { kind: "hierarchy" },
    })
  })

  TOPOLOGY_NODES.forEach((raw) => {
    nodes.push({
      id: raw.id,
      type: "cyber",
      position: { x: 0, y: 0 },
      data: {
        title: raw.title,
        role: raw.role,
        description: raw.description,
        type: raw.type,
        status: raw.status,
        repo: raw.repo,
        collaboratesWith: raw.collaboratesWith,
      },
    })
    edges.push({
      id: `e-hub-${raw.id}`,
      source: `hub-${raw.repo}`,
      target: raw.id,
      type: "cyber",
      data: { kind: "hierarchy" },
    })
  })

  TOPOLOGY_NODES.forEach((raw) => {
    raw.collaboratesWith.forEach((targetId) => {
      const edgeId = `c-${raw.id}-${targetId}`
      const reverse = `c-${targetId}-${raw.id}`
      if (edges.some((e) => e.id === edgeId || e.id === reverse)) return
      edges.push({
        id: edgeId,
        source: raw.id,
        target: targetId,
        type: "cyber",
        data: { kind: "collaboration" },
      })
    })
  })

  const layoutEdges = edges.filter((e) => e.data?.kind === "hierarchy")
  const positioned = applyDagreLayout(nodes, layoutEdges, rankdir)

  return { nodes: positioned, edges }
}

export function countStatusSummary() {
  const counts = { calisir: 0, devam: 0, hata: 0, pasif: 0 } as Record<
    "calisir" | "devam" | "hata" | "pasif",
    number
  >
  TOPOLOGY_NODES.forEach((n) => counts[n.status]++)
  return counts
}
