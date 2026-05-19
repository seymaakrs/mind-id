import dagre from "@dagrejs/dagre"
import type { Edge, Node } from "@xyflow/react"
import {
  AGENT_GRAPH_EDGES,
  AGENT_GRAPH_NODES,
  KIND_COLORS,
} from "./data/agentGraph"
import type { AgentNodeData } from "./AgentNode"
import type { NeonEdgeData } from "./NeonEdge"

const NODE_W = 220
const NODE_H = 132

/** Dikey soy ağacı — üstten alta (TB), geniş dallar için nodesep yüksek */
export function buildMindIDFlowGraph(nodeStates: Record<string, AgentNodeData["status"]>) {
  const nodes: Node<AgentNodeData>[] = AGENT_GRAPH_NODES.map((n, i) => ({
    id: n.id,
    type: "mindIdAgent",
    position: { x: 0, y: 0 },
    data: {
      ...n,
      status: nodeStates[n.id] ?? n.status,
      index: i + 1,
    },
  }))

  const edges: Edge<NeonEdgeData>[] = AGENT_GRAPH_EDGES.map((e) => {
    const targetNode = AGENT_GRAPH_NODES.find((n) => n.id === e.target)!
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "neonEdge",
      data: {
        color: KIND_COLORS[targetNode.kind],
        label: e.label,
        main: e.main,
      },
      style: e.main ? undefined : { opacity: 0.65 },
    }
  })

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: 52,
    ranksep: 88,
    marginx: 80,
    marginy: 60,
  })

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  AGENT_GRAPH_EDGES.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  const positioned = nodes.map((n) => {
    const p = g.node(n.id)
    return {
      ...n,
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      sourcePosition: "bottom" as const,
      targetPosition: "top" as const,
    }
  })

  return { nodes: positioned, edges }
}
