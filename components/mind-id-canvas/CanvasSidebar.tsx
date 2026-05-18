"use client"

import { cn } from "@/lib/utils"
import {
  AGENT_GRAPH_NODES,
  KIND_COLORS,
  type AgentGraphNode,
  type AgentStatus,
} from "./data/agentGraph"

interface CanvasSidebarProps {
  nodes: AgentGraphNode[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function countByStatus(nodes: AgentGraphNode[], status: AgentStatus) {
  return nodes.filter((n) => n.status === status).length
}

export function CanvasSidebar({ nodes, selectedId, onSelect }: CanvasSidebarProps) {
  const running = countByStatus(nodes, "running")
  const waiting = countByStatus(nodes, "waiting")

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-green-500/20 bg-black font-mono text-[11px]">
      <div className="border-b border-green-500/20 p-3">
        <p className="text-xs font-bold tracking-widest text-green-400">MINDID CANVAS</p>
        <p className="mt-1 text-[10px] text-white/40">v0.1 · agent graph</p>
      </div>

      <div className="border-b border-green-500/15 p-3 text-[10px] text-white/60">
        <p>
          <span className="text-green-400">{running}</span> çalışıyor ·{" "}
          <span className="text-amber-400">{waiting}</span> bekliyor
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="mb-2 px-1 text-[9px] uppercase tracking-wider text-white/35">Ajanlar</p>
        <ul className="space-y-1">
          {nodes.map((n, i) => {
            const color = KIND_COLORS[n.kind]
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onSelect(n.id)}
                  className={cn(
                    "w-full rounded border px-2 py-1.5 text-left transition-colors",
                    selectedId === n.id
                      ? "border-green-400/60 bg-green-950/40"
                      : "border-transparent hover:bg-white/5"
                  )}
                >
                  <span className="font-bold" style={{ color }}>
                    [{i + 1}]
                  </span>{" "}
                  <span className="text-white/85">{n.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="border-t border-green-500/15 p-2 text-[9px] text-white/35">
        <p>● Sarı = kullanıcı</p>
        <p>● Turuncu = orkestratör</p>
        <p>● Magenta = uzman ajan</p>
        <p>● Yeşil = API · Cyan = DB</p>
      </div>
    </aside>
  )
}
