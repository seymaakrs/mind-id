"use client"

import { X } from "lucide-react"
import type { AgentGraphNode } from "./data/agentGraph"
import { KIND_COLORS } from "./data/agentGraph"

interface DetailDrawerProps {
  node: AgentGraphNode | null
  logs: string[]
  onClose: () => void
}

export function DetailDrawer({ node, logs, onClose }: DetailDrawerProps) {
  if (!node) {
    return (
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-cyan-500/20 bg-black p-4 font-mono text-xs text-white/40">
        <p className="text-cyan-400/80">Bir düğüm seç → kod referansı ve log</p>
      </aside>
    )
  }

  const color = KIND_COLORS[node.kind]

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-cyan-500/20 bg-black font-mono">
      <div className="flex items-start justify-between gap-2 border-b border-cyan-500/15 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color }}>
            {node.kind}
          </p>
          <h2 className="text-base font-bold text-white">{node.label}</h2>
          <p className="text-[11px] text-white/50">{node.className}</p>
        </div>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3 text-[12px]">
        <div>
          <p className="mb-1 text-[10px] uppercase text-cyan-500/70">Açıklama</p>
          <p className="leading-relaxed text-white/75">{node.description}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase text-cyan-500/70">Kod referansı</p>
          <code className="block rounded bg-white/5 p-2 text-[11px] text-green-300">
            {node.codeRef}
          </code>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase text-cyan-500/70">Alt görevler</p>
          <ul className="list-inside list-disc text-white/65">
            {node.subtasks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase text-cyan-500/70">Son loglar</p>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-[10px] text-green-400/90">
            {logs
              .filter((l) => l.includes(node.className) || l.includes(node.id))
              .slice(-8)
              .map((l, i) => (
                <li key={i}>{l}</li>
              ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
