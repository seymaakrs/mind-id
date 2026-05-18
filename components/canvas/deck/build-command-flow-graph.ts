import dagre from "@dagrejs/dagre"
import type { Edge, Node } from "@xyflow/react"
import {
  AGENTS_ZONE_LABEL,
  COMMAND_FLOW_AGENTS,
  COMMAND_FLOW_MAIN,
} from "./command-flow-graph-data"
import type { DeckEdgeData, DeckFlowLabelData, DeckNodeData } from "./types"

const CARD_W = 260
const CARD_H_GHOST = 200
const CARD_H_LEAF = 195
const COL_GAP = 300
const ROW_GAP = 220

function resolveRepo(id: string): DeckNodeData["repo"] {
  if (id === "cf-user") return "root"
  if (id === "cf-firestore") return "mindid-nocodb"
  if (
    id === "cf-orchestrator" ||
    id === "cf-image" ||
    id === "cf-video" ||
    id === "cf-marketing" ||
    id === "cf-analysis"
  ) {
    return "mind-agent"
  }
  return "mind-id"
}

function toFlowCard(
  def: (typeof COMMAND_FLOW_MAIN)[0] | (typeof COMMAND_FLOW_AGENTS)[0],
  parentId?: string
): Node<DeckNodeData> {
  return {
    id: def.id,
    type: "deckFlowCard",
    position: { x: 0, y: 0 },
    data: {
      title: def.title,
      role: def.role,
      description: def.description,
      tag: def.tag,
      agentKey: def.agentKey,
      type:
        def.id === "cf-orchestrator"
          ? "agent"
          : def.id === "cf-user"
            ? "root"
            : def.agentKey
              ? "agent"
              : "page",
      status: def.status,
      repo: resolveRepo(def.id),
      collaboratesWith: [],
      visualKind: def.visual,
      branchColor: def.color,
      parentId,
      flowStep: def.step,
    },
  }
}

function layoutMainChain(nodes: Node<DeckNodeData>[], edges: Edge<DeckEdgeData>[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 140, marginx: 60, marginy: 80 })

  nodes.forEach((n) => {
    const h = n.data.visualKind === "ghost" ? CARD_H_GHOST : CARD_H_LEAF
    g.setNode(n.id, { width: CARD_W, height: h })
  })
  edges
    .filter((e) => !e.id.startsWith("dispatch") && !e.id.startsWith("result"))
    .forEach((e) => {
      if (COMMAND_FLOW_MAIN.some((m) => m.id === e.source) && COMMAND_FLOW_MAIN.some((m) => m.id === e.target)) {
        g.setEdge(e.source, e.target)
      }
    })

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    const h = n.data.visualKind === "ghost" ? CARD_H_GHOST : CARD_H_LEAF
    return { ...n, position: { x: pos.x - CARD_W / 2, y: pos.y - h / 2 } }
  })
}

const MAIN_EDGE_LABELS: Record<string, string> = {
  "main-cf-user-cf-agent-page": "görevi yazdın",
  "main-cf-agent-page-cf-api": "gönder",
  "main-cf-api-cf-orchestrator": "POST /task + Firestore kaydı",
  "main-orch-firestore": "durum + özet",
  "main-cf-firestore-cf-active-tasks": "listele & izle",
}

export function buildCommandFlowGraph(): {
  nodes: Node<DeckNodeData | DeckFlowLabelData>[]
  edges: Edge<DeckEdgeData>[]
} {
  const nodes: Node<DeckNodeData | DeckFlowLabelData>[] = []
  const edges: Edge<DeckEdgeData>[] = []

  COMMAND_FLOW_MAIN.forEach((def) => nodes.push(toFlowCard(def)))

  COMMAND_FLOW_AGENTS.forEach((def) => {
    nodes.push(toFlowCard(def, "cf-orchestrator"))
    edges.push({
      id: `dispatch-${def.id}`,
      source: "cf-orchestrator",
      sourceHandle: "dispatch",
      target: def.id,
      type: "deckPulse",
      data: {
        branchColor: def.color,
        kind: "hierarchy",
        animated: true,
        label: "işi verir",
      },
      zIndex: 2,
    })
    edges.push({
      id: `result-${def.id}`,
      source: def.id,
      target: "cf-firestore",
      type: "deckPulse",
      data: {
        branchColor: "#4ade80",
        kind: "hierarchy",
        animated: true,
        label: "sonucu yazar",
      },
      zIndex: 1,
    })
  })

  const mainIds = COMMAND_FLOW_MAIN.map((d) => d.id)
  for (let i = 0; i < mainIds.length - 1; i++) {
    const src = mainIds[i]
    const tgt = mainIds[i + 1]
    if (src === "cf-orchestrator" && tgt === "cf-firestore") continue
    const edgeId = `main-${src}-${tgt}`
    const srcDef = COMMAND_FLOW_MAIN.find((d) => d.id === src)!
    edges.push({
      id: edgeId,
      source: src,
      target: tgt,
      type: "deckPulse",
      data: {
        branchColor: srcDef.color,
        kind: "hierarchy",
        animated: true,
        label: MAIN_EDGE_LABELS[edgeId],
      },
      zIndex: 3,
    })
  }

  edges.push({
    id: "main-orch-firestore",
    source: "cf-orchestrator",
    target: "cf-firestore",
    type: "deckPulse",
    data: {
      branchColor: "#f472b6",
      kind: "hierarchy",
      animated: true,
      label: MAIN_EDGE_LABELS["main-orch-firestore"],
    },
    zIndex: 2,
  })

  const mainNodes = nodes.filter((n): n is Node<DeckNodeData> =>
    COMMAND_FLOW_MAIN.some((d) => d.id === n.id)
  )
  const agentNodes = nodes.filter((n): n is Node<DeckNodeData> =>
    COMMAND_FLOW_AGENTS.some((d) => d.id === n.id)
  )

  const laidMain = layoutMainChain(mainNodes, edges)
  const orch = laidMain.find((n) => n.id === "cf-orchestrator")!
  const orchCenterX = orch.position.x + CARD_W / 2
  const orchBottom = orch.position.y + CARD_H_GHOST

  const gridCols = 2
  const gridRows = 2
  const gridWidth = (gridCols - 1) * COL_GAP
  const gridStartX = orchCenterX - gridWidth / 2 - CARD_W / 2
  const zoneY = orchBottom + 56
  const gridStartY = zoneY + 72

  const zoneNode: Node<DeckFlowLabelData> = {
    id: AGENTS_ZONE_LABEL.id,
    type: "deckFlowLabel",
    position: { x: orchCenterX - 270, y: zoneY },
    data: {
      title: AGENTS_ZONE_LABEL.title,
      subtitle: AGENTS_ZONE_LABEL.subtitle,
    },
    selectable: false,
    draggable: false,
  }

  const agentOrder = ["cf-image", "cf-video", "cf-marketing", "cf-analysis"]
  const laidAgents = agentNodes.map((n) => {
    const idx = agentOrder.indexOf(n.id)
    const col = idx % gridCols
    const row = Math.floor(idx / gridCols)
    return {
      ...n,
      position: {
        x: gridStartX + col * COL_GAP,
        y: gridStartY + row * ROW_GAP,
      },
    }
  })

  return { nodes: [...laidMain, ...laidAgents, zoneNode], edges }
}

export function getCommandFlowNode(
  nodes: Node<DeckNodeData>[],
  id: string
) {
  return nodes.find((n) => n.id === id)
}
