"use client"

/**
 * Komuta merkezi — Komut akışı (varsayılan) + Ekosistem haritası modları.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Maximize2, RefreshCw, GitBranch, Network } from "lucide-react"
import { DeckGhostNode } from "./deck/DeckGhostNode"
import { DeckLeafNode } from "./deck/DeckLeafNode"
import { DeckFlowCardNode } from "./deck/DeckFlowCardNode"
import { DeckFlowLabelNode } from "./deck/DeckFlowLabelNode"
import { DeckPulseEdge } from "./deck/DeckPulseEdge"
import { DeckCableEdge } from "./deck/DeckCableEdge"
import { DeckActivitySidebar } from "./deck/DeckActivitySidebar"
import { buildDeckGraph } from "./deck/build-deck-graph"
import { buildCommandFlowGraph } from "./deck/build-command-flow-graph"
import type { DeckEdgeData, DeckNodeData, DeckViewMode } from "./deck/types"

export type { DeckViewMode } from "./deck/types"

const nodeTypes: NodeTypes = {
  deckGhost: DeckGhostNode,
  deckLeaf: DeckLeafNode,
  deckFlowCard: DeckFlowCardNode,
  deckFlowLabel: DeckFlowLabelNode,
}
const edgeTypes: EdgeTypes = {
  deckPulse: DeckPulseEdge,
  deckCable: DeckCableEdge,
}

function DeckToolbar({
  mode,
  onModeChange,
  onFit,
  onReset,
}: {
  mode: DeckViewMode
  onModeChange: (m: DeckViewMode) => void
  onFit: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-red-950/50 bg-[#0a0a0e] px-3 py-2">
      <button
        type="button"
        onClick={() => onModeChange("command")}
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
          mode === "command"
            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
            : "text-white/50 hover:text-white/80"
        }`}
      >
        <GitBranch className="h-3.5 w-3.5" />
        Komut akışı
      </button>
      <button
        type="button"
        onClick={() => onModeChange("ecosystem")}
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
          mode === "ecosystem"
            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
            : "text-white/50 hover:text-white/80"
        }`}
      >
        <Network className="h-3.5 w-3.5" />
        Ekosistem
      </button>
      <span className="mx-1 h-4 w-px bg-white/10" />
      <button
        type="button"
        onClick={onFit}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] uppercase tracking-wide text-white/70 hover:bg-white/5 hover:text-amber-200"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        FIT
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] uppercase tracking-wide text-white/70 hover:bg-white/5 hover:text-amber-200"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Sıfırla
      </button>
    </div>
  )
}

function CanvasInner() {
  const [mode, setMode] = useState<DeckViewMode>("command")
  const ecosystem = useMemo(() => buildDeckGraph(), [])
  const command = useMemo(() => buildCommandFlowGraph(), [])
  const [selected, setSelected] = useState<Node<DeckNodeData> | null>(null)
  const [showCables, setShowCables] = useState(true)
  const { fitView } = useReactFlow()

  const { nodes, edges: rawEdges } = mode === "command" ? command : ecosystem

  const edges = useMemo(() => {
    if (mode === "command") return rawEdges
    if (showCables) return rawEdges
    return rawEdges.filter((e) => (e.data as DeckEdgeData)?.kind === "hierarchy")
  }, [mode, rawEdges, showCables])

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelected(node as Node<DeckNodeData>)
  }, [])

  const onPaneClick = useCallback(() => setSelected(null), [])

  const handleFit = useCallback(() => {
    fitView({ padding: mode === "command" ? 0.15 : 0.35, duration: 400, maxZoom: 0.95 })
  }, [fitView, mode])

  const handleReset = useCallback(() => {
    setSelected(null)
    handleFit()
  }, [handleFit])

  const handleModeChange = useCallback((m: DeckViewMode) => {
    setMode(m)
    setSelected(null)
  }, [])

  useEffect(() => {
    const t = setTimeout(handleFit, 80)
    return () => clearTimeout(t)
  }, [mode, handleFit])

  return (
    <div className="command-deck flex h-full min-h-0 flex-1 flex-col bg-black">
      <DeckToolbar
        mode={mode}
        onModeChange={handleModeChange}
        onFit={handleFit}
        onReset={handleReset}
      />
      {mode === "command" && (
        <p className="border-b border-red-950/30 bg-[#0a0a0e] px-4 py-1.5 text-center text-xs text-amber-100/50">
          Okuma yönü: soldan sağa — komut önce panele, orkestratöre, alttan uzman ajanlara, sonuç Firestore → Aktif Görevler
        </p>
      )}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            key={mode}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: mode === "command" ? 0.15 : 0.35, maxZoom: 0.95 }}
            minZoom={0.3}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnDrag
            zoomOnScroll
            className="command-deck-flow !bg-black"
          />
        </div>
        <DeckActivitySidebar
          selected={selected}
          allNodes={nodes}
          mode={mode}
          showCables={showCables}
          onToggleCables={() => setShowCables((v) => !v)}
        />
      </div>
    </div>
  )
}

export function CyberTopologyCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}

export default CyberTopologyCanvas
