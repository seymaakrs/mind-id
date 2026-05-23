"use client"

import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AgentGraphNode } from "./data/agentGraph"
import { BRANCH_LABELS, KIND_COLORS, REPO_LABELS } from "./data/agentGraph"
import type { OpsNavigateTarget } from "@/hooks/useOperationsCenter"

const NAV_LABELS: Record<OpsNavigateTarget, string> = {
  agent: "Agent paneline git",
  "aktif-gorevler": "Aktif görevlere git",
  istatistikler: "İstatistiklere git",
  isletmeler: "İşletmelere git",
  settings: "Ayarlara git",
}

interface DetailDrawerProps {
  node: AgentGraphNode | null
  logs: string[]
  navigateTarget?: OpsNavigateTarget | null
  onNavigate?: () => void
  onClose: () => void
}

export function DetailDrawer({
  node,
  logs,
  navigateTarget,
  onNavigate,
  onClose,
}: DetailDrawerProps) {
  if (!node) {
    return (
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-cyan-500/20 bg-black p-4 font-mono text-xs text-white/40">
        <p className="text-cyan-400/80">Bir düğüm seç → detay ve canlı log</p>
      </aside>
    )
  }

  const color = KIND_COLORS[node.kind]
  const relatedLogs = logs
    .filter(
      (l) =>
        l.toLowerCase().includes(node.className.toLowerCase()) ||
        l.toLowerCase().includes(node.id.replace(/-/g, "_"))
    )
    .slice(-8)

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-cyan-500/20 bg-black font-mono">
      <div className="flex items-start justify-between gap-2 border-b border-cyan-500/15 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color }}>
            {node.kind}
          </p>
          <h2 className="text-base font-bold text-white">{node.label}</h2>
          <p className="text-[11px] text-white/50">{node.className}</p>
          <p className="mt-1 text-[10px] text-white/40">
            {BRANCH_LABELS[node.branch]} · {REPO_LABELS[node.repo]}
          </p>
          <p className="mt-1 text-[10px] capitalize text-white/60">
            Durum: {node.status}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3 text-[12px]">
        {navigateTarget && onNavigate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full gap-1.5 border-cyan-500/30 text-[11px] text-cyan-300 hover:bg-cyan-500/10"
            onClick={onNavigate}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {NAV_LABELS[navigateTarget]}
          </Button>
        )}
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
        {relatedLogs.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] uppercase text-cyan-500/70">İlgili loglar</p>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-[10px] text-green-400/90">
              {relatedLogs.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}
