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
  type AgentGraphNode,
  type AgentStatus,
} from "./data/agentGraph"
import {
  nodeIdToNavigateTarget,
  type OpsNavigateTarget,
} from "@/hooks/useOperationsCenter"

const nodeTypes = { mindIdAgent: AgentNode }
const edgeTypes = { neonEdge: NeonEdge }

interface MindIDCanvasProps {
  nodeStates: Record<string, AgentStatus>
  activityLines: string[]
  onNavigate?: (target: OpsNavigateTarget) => void
}

function CanvasInner({
  nodeStates,
  activityLines,
  onNavigate,
}: MindIDCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { fitView } = useReactFlow()

  const graphNodes = useMemo(
    (): AgentGraphNode[] =>
      AGENT_GRAPH_NODES.map((n) => ({
        ...n,
        status: nodeStates[n.id] ?? "idle",
      })),
    [nodeStates]
  )

  const { nodes, edges } = useMemo(
    () => buildMindIDFlowGraph(nodeStates),
    [nodeStates]
  )

  const selectedNode = graphNodes.find((n) => n.id === selectedId) ?? null
  const navigateTarget = selectedId ? nodeIdToNavigateTarget(selectedId) : null

  const terminalLines = useMemo(() => {
    if (activityLines.length === 0) return []
    return activityLines
  }, [activityLines])

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
          logs={terminalLines}
          navigateTarget={navigateTarget}
          onNavigate={
            navigateTarget && onNavigate
              ? () => onNavigate(navigateTarget)
              : undefined
          }
          onClose={() => setSelectedId(null)}
        />
      </div>
      {terminalLines.length > 0 && <TerminalPanel lines={terminalLines} />}
    </div>
  )
}

export function MindIDCanvas(props: MindIDCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

export default MindIDCanvas
