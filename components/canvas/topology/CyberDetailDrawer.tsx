"use client"

import { X } from "lucide-react"
import type { Node } from "@xyflow/react"
import { REPO_META, ROOT_META, STATUS_META } from "./data"
import type { RepoKey, TopologyNodeData } from "./types"

interface CyberDetailDrawerProps {
  node: Node<TopologyNodeData> | null
  onClose: () => void
  allNodes: Node<TopologyNodeData>[]
}

export function CyberDetailDrawer({ node, onClose, allNodes }: CyberDetailDrawerProps) {
  if (!node) return null

  const status = STATUS_META[node.data.status]
  const StatusIcon = status.Icon
  const repoLabel =
    node.data.repo === "root"
      ? ROOT_META.label
      : REPO_META[node.data.repo as RepoKey]?.label

  const collaborators = allNodes.filter((n) => node.data.collaboratesWith.includes(n.id))

  return (
    <div className="absolute top-0 right-0 z-20 flex h-full w-[380px] flex-col border-l border-cyan-500/20 bg-[#050a12]/95 font-mono shadow-[-8px_0_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-cyan-500/15 bg-[#050a12]/95 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70">{repoLabel}</p>
          <h3 className="mt-1 text-base font-bold tracking-wide text-white">{node.data.title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{node.data.role}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-700 p-1.5 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className={`flex items-center gap-2 text-xs ${status.color}`}>
          <StatusIcon
            className={`h-4 w-4 ${node.data.status === "devam" ? "animate-spin" : ""}`}
          />
          <span className="font-semibold tracking-wider">{status.label}</span>
        </div>

        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Açıklama</p>
          <p className="text-sm leading-relaxed text-slate-300">{node.data.description}</p>
        </div>

        {collaborators.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
              Bağlantılar ({collaborators.length})
            </p>
            <ul className="space-y-1.5">
              {collaborators.map((c) => {
                const cs = STATUS_META[c.data.status]
                const CsIcon = cs.Icon
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 rounded border border-slate-800/80 bg-slate-900/40 p-2 text-xs"
                  >
                    <CsIcon className={`h-3.5 w-3.5 shrink-0 ${cs.color}`} />
                    <span className="font-medium text-slate-200">{c.data.title}</span>
                    <span className="ml-auto truncate text-[10px] text-slate-500">{c.data.role}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500">
          <span className="text-cyan-600/80">type</span>=<span className="text-slate-400">{node.data.type}</span>
          {" · "}
          <span className="text-cyan-600/80">repo</span>=<span className="text-slate-400">{node.data.repo}</span>
        </div>
      </div>
    </div>
  )
}
