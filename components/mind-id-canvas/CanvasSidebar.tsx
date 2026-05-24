"use client"

import { cn } from "@/lib/utils"
import {
  BRANCH_LABELS,
  KIND_COLORS,
  type AgentBranch,
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

const BRANCH_ORDER: AgentBranch[] = ["root", "content", "sales", "shared"]

export function CanvasSidebar({ nodes, selectedId, onSelect }: CanvasSidebarProps) {
  const running = countByStatus(nodes, "running")
  const waiting = countByStatus(nodes, "waiting")
  const blocked = countByStatus(nodes, "blocked")

  return (
    <aside className="flex w-[200px] shrink-0 flex-col border-r border-green-500/20 bg-black font-mono text-[11px]">
      <div className="border-b border-green-500/20 p-3">
        <p className="text-xs font-bold tracking-widest text-green-400">MINDID CANVAS</p>
        <p className="mt-1 text-[10px] text-white/40">v0.3 · kutusuz hayalet</p>
      </div>

      <div className="border-b border-green-500/15 p-3 text-[10px] text-white/60">
        <p>
          <span className="text-green-400">{running}</span> çalışıyor ·{" "}
          <span className="text-amber-400">{waiting}</span> bekliyor ·{" "}
          <span className="text-red-400">{blocked}</span> bloke
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {BRANCH_ORDER.map((branch) => {
          const branchNodes = nodes.filter((n) => n.branch === branch)
          if (branchNodes.length === 0) return null
          return (
            <div key={branch} className="mb-3">
              <p className="mb-1.5 px-1 text-[9px] uppercase tracking-wider text-fuchsia-400/80">
                {BRANCH_LABELS[branch]}
              </p>
              <ul className="space-y-1">
                {branchNodes.map((n) => {
                  const color = KIND_COLORS[n.kind]
                  const globalIndex = nodes.findIndex((x) => x.id === n.id) + 1
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
                          [{globalIndex}]
                        </span>{" "}
                        <span className="text-white/85">{n.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="border-t border-green-500/15 p-2 text-[9px] text-white/35">
        <p>↓ Üstten alta · kutusuz</p>
        <p>● Sarı numara = adım</p>
        <p>● Mor hayalet = satış</p>
        <p>● Soluk = planlanan</p>
      </div>
    </aside>
  )
}
