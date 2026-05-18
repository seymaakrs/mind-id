import dagre from "@dagrejs/dagre"
import type { Edge, Node } from "@xyflow/react"
import {
  AGENT_GRAPH_EDGES,
  AGENT_GRAPH_NODES,
  KIND_COLORS,
} from "./data/agentGraph"
import type { AgentNodeData } from "./AgentNode"
import type { NeonEdgeData } from "./NeonEdge"

const W = 220
const H = 130

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
      sourceHandle: e.source === "orchestrator" && e.target.includes("_agent") ? "dispatch" : undefined,
      type: "neonEdge",
      data: {
        color: KIND_COLORS[targetNode.kind],
        label: e.label,
        main: e.main,
      },
    }
  })

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 120, marginx: 50, marginy: 100 })

  nodes.forEach((n) => g.setNode(n.id, { width: W, height: H }))
  AGENT_GRAPH_EDGES.filter((e) => e.main).forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  const positioned = nodes.map((n) => {
    const p = g.node(n.id)
    return { ...n, position: { x: p.x - W / 2, y: p.y - H / 2 } }
  })

  const experts = ["image_agent", "video_agent", "marketing_agent", "analysis_agent"]
  const orch = positioned.find((n) => n.id === "orchestrator")!
  const ox = orch.position.x + W / 2
  const oy = orch.position.y + H + 80
  const colW = 240
  const rowH = 150

  const laid = positioned.map((n) => {
    const i = experts.indexOf(n.id)
    if (i < 0) return n
    const col = i % 2
    const row = Math.floor(i / 2)
    return {
      ...n,
      position: {
        x: ox - colW + col * colW - W / 2,
        y: oy + row * rowH,
      },
    }
  })

  return { nodes: laid, edges }
}
