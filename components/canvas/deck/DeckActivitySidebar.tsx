"use client"

import type { Node } from "@xyflow/react"
import { STATUS_META } from "../topology/data"
import type { DeckViewMode } from "./types"
import { COMMAND_FLOW_STEPS, COMMAND_MODE_LEGEND, MAP_LEGEND } from "./command-flow"
import type { DeckNodeData } from "./types"

function findNode(nodes: Node<DeckNodeData>[], id: string) {
  return nodes.find((n) => n.id === id)
}

interface DeckActivitySidebarProps {
  selected: Node<DeckNodeData> | null
  allNodes: Node<DeckNodeData>[]
  mode: DeckViewMode
  showCables: boolean
  onToggleCables: () => void
}

export function DeckActivitySidebar({
  selected,
  allNodes,
  mode,
  showCables,
  onToggleCables,
}: DeckActivitySidebarProps) {
  const isCommand = mode === "command"
  const collaborators =
    selected?.data.collaboratesWith
      .map((id) => findNode(allNodes, id))
      .filter(Boolean) ?? []

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-red-900/40 bg-[#0c0c10] font-mono text-[13px] leading-relaxed">
      <div className="border-b border-red-900/30 px-4 py-2.5 text-xs uppercase tracking-widest text-amber-200/90">
        {isCommand ? "Komut akışı" : "Ekosistem"}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!selected && isCommand && (
          <div className="space-y-3 rounded border border-amber-900/30 bg-amber-950/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              Portalda gerçek sıra
            </p>
            <ol className="space-y-2.5">
              {COMMAND_FLOW_STEPS.map((s) => (
                <li key={s.step} className="text-white/80">
                  <span className="text-amber-400">{s.step}. </span>
                  <span className="font-semibold text-white">{s.who}</span>
                  <span className="text-white/65"> — {s.action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="space-y-1.5 text-xs text-white/50">
          {(isCommand ? COMMAND_MODE_LEGEND : MAP_LEGEND.map((l) => l.label)).map((line) => (
            <p key={line}>• {line}</p>
          ))}
        </div>

        {!isCommand && (
          <button
            type="button"
            onClick={onToggleCables}
            className="w-full rounded border border-slate-700 px-3 py-2 text-left text-xs text-white/80 hover:border-cyan-600/50 hover:bg-white/5"
          >
            {showCables ? "✓ Bağlantı kabloları açık" : "○ Bağlantı kabloları kapalı"}
          </button>
        )}

        {selected ? (
          <div className="space-y-3 border-t border-slate-800 pt-3">
            {selected.data.flowStep != null && (
              <p className="text-xs text-amber-400">Adım {selected.data.flowStep}</p>
            )}
            <div>
              <p className="text-amber-300">▸ {selected.data.title}</p>
              <p className="mt-1 text-sm text-white/55">{selected.data.role}</p>
              <p className="mt-2 text-sm text-white/75">{selected.data.description}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-cyan-400/80">durum</p>
              <p className={`text-sm ${STATUS_META[selected.data.status].color}`}>
                {STATUS_META[selected.data.status].label}
              </p>
            </div>
            {selected.data.parentId && (
              <div>
                <p className="mb-1 text-xs text-cyan-400/80">
                  {isCommand ? "önceki adım" : "üstünde"}
                </p>
                <p className="text-sm text-white/85">
                  {findNode(allNodes, selected.data.parentId)?.data.title ?? selected.data.parentId}
                </p>
              </div>
            )}
            {!isCommand && collaborators.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-cyan-400/80">
                  kablo ile bağlı ({collaborators.length})
                </p>
                <ul className="space-y-1">
                  {collaborators.map((n) => (
                    <li key={n!.id} className="flex gap-2 text-sm text-white/80">
                      <span className="text-sky-400">↔</span>
                      <span>{n!.data.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/35">
            {isCommand
              ? "Haritada bir adıma tıkla — komut hattında nerede olduğunu gör"
              : "Bir düğüme tıkla → detay"}
          </p>
        )}
      </div>
    </aside>
  )
}
