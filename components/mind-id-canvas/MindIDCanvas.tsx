"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ReactFlow, ReactFlowProvider, useReactFlow, type Node } from "@xyflow/react"
import { CanvasDotBackground } from "./CanvasDotBackground"
import "@xyflow/react/dist/style.css"
import { AgentNode } from "./AgentNode"
import { NeonEdge } from "./NeonEdge"
import { CanvasSidebar } from "./CanvasSidebar"
import { DetailDrawer } from "./DetailDrawer"
import { TerminalPanel } from "./TerminalPanel"
import { buildMindIDFlowGraph } from "./buildLayout"
import {
  AGENT_GRAPH_NODES,
} from "./data/agentGraph"
import { useLiveAgentStates } from "./useLiveAgentStates"

const nodeTypes = { mindIdAgent: AgentNode }
const edgeTypes = { neonEdge: NeonEdge }

function CanvasInner() {
  // Canli veri: Firestore active_tasks dinleyici. Deploy edilen agent'lar,
  // cron job'lar, gercek kullanici task'lari → bu canvas anlik sekillenir.
  const { states: liveStates, logs: liveLogs, connected, activeCount } =
    useLiveAgentStates()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { fitView } = useReactFlow()

  const graphNodes = useMemo(
    () =>
      AGENT_GRAPH_NODES.map((n) => ({
        ...n,
        status: liveStates[n.id] ?? n.status,
      })),
    [liveStates]
  )

  const { nodes, edges } = useMemo(
    () => buildMindIDFlowGraph(liveStates),
    [liveStates]
  )

  // Header banner için statü
  const connectionLabel = connected
    ? `Canli — ${activeCount} aktif gorev`
    : "Firestore bekleniyor…"

  const headerLogs = useMemo(
    () => [
      `> MindID Canvas v0.3 — ${connectionLabel}`,
      "> Aktif task'lar tool isimlerine gore ilgili agent'lari aydinlatir",
      ...liveLogs,
    ],
    [connected, activeCount, liveLogs, connectionLabel]
  )

  const selectedNode = graphNodes.find((n) => n.id === selectedId) ?? null

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.12, duration: 300 }), 100)
    return () => clearTimeout(t)
  }, [fitView, nodes.length])

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedId(node.id)
  }, [])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-black">
      <div className="flex min-h-0 flex-1">
        <CanvasSidebar
          nodes={graphNodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div className="mind-id-canvas-grid relative min-w-0 flex-1">
          <CanvasDotBackground />
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
            className="relative z-[1] !bg-transparent"
          />
        </div>
        <DetailDrawer
          node={selectedNode}
          logs={headerLogs}
          onClose={() => setSelectedId(null)}
        />
      </div>
      <TerminalPanel lines={headerLogs} />
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
