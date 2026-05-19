"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { AgentNode, type AgentNodeData } from "./AgentNode"
import { NeonEdge } from "./NeonEdge"
import { CanvasSidebar } from "./CanvasSidebar"
import { DetailDrawer } from "./DetailDrawer"
import { TerminalPanel } from "./TerminalPanel"
import { buildMindIDFlowGraph } from "./buildLayout"
import {
  AGENT_GRAPH_NODES,
  type AgentGraphNode,
  type AgentStatus,
} from "./data/agentGraph"

const nodeTypes = { mindIdAgent: AgentNode }
const edgeTypes = { neonEdge: NeonEdge }

const MOCK_STATUSES: AgentStatus[] = ["waiting", "running", "completed", "idle", "blocked"]

function formatLog(node: AgentGraphNode, status: AgentStatus) {
  const t = new Date().toLocaleTimeString("tr-TR")
  return `[${t}] Agent [${node.className}] status: ${status}`
}

function CanvasInner() {
  const [nodeStates, setNodeStates] = useState<Record<string, AgentStatus>>(() =>
    Object.fromEntries(AGENT_GRAPH_NODES.map((n) => [n.id, n.status]))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([
    "> MindID Canvas v0.2 — dikey soy ağacı (üstten alta)",
    "> 4 repo: mind-id · mind-agent · customer_agent · NocoDB",
    "> Mock canlı log (5sn) — ileride Firestore/NocoDB bağlanır",
  ])
  const { fitView } = useReactFlow()

  const graphNodes = useMemo(
    () =>
      AGENT_GRAPH_NODES.map((n) => ({
        ...n,
        status: nodeStates[n.id] ?? n.status,
      })),
    [nodeStates]
  )

  const { nodes, edges } = useMemo(
    () => buildMindIDFlowGraph(nodeStates),
    [nodeStates]
  )

  const selectedNode = graphNodes.find((n) => n.id === selectedId) ?? null

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.12, duration: 300 }), 100)
    return () => clearTimeout(t)
  }, [fitView, nodes.length])

  useEffect(() => {
    const interval = setInterval(() => {
      const pick = AGENT_GRAPH_NODES[Math.floor(Math.random() * AGENT_GRAPH_NODES.length)]
      const status = MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)]
      setNodeStates((prev) => ({ ...prev, [pick.id]: status }))
      setLogs((prev) => [...prev.slice(-40), formatLog(pick, status)])
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedId(node.id)
  }, [])

  return (
    <div className="flex h-full min-h-[720px] min-w-[1280px] flex-col bg-black">
      <div className="flex min-h-0 flex-1">
        <CanvasSidebar
          nodes={graphNodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div className="mind-id-canvas-grid relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            minZoom={0.15}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.55 }}
            nodesDraggable
            proOptions={{ hideAttribution: true }}
            className="!bg-black"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="rgba(0,255,0,0.08)"
            />
          </ReactFlow>
        </div>
        <DetailDrawer
          node={selectedNode}
          logs={logs}
          onClose={() => setSelectedId(null)}
        />
      </div>
      <TerminalPanel lines={logs} />
    </div>
  )
}

export function MindIDCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}

export default MindIDCanvas
