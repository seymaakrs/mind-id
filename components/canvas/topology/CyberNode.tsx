"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { REPO_META, ROOT_META, STATUS_META } from "./data"
import type { RepoKey, TopologyNodeData } from "./types"

function repoAccent(repo: RepoKey | "root") {
  if (repo === "root") return ROOT_META
  return REPO_META[repo]
}

function CyberNodeComponent({ data, selected }: NodeProps<Node<TopologyNodeData>>) {
  const accent = repoAccent(data.repo)
  const status = STATUS_META[data.status]
  const StatusIcon = status.Icon
  const isHub = data.type === "hub" || data.type === "root"

  return (
    <div
      className={cn(
        "relative font-mono select-none",
        isHub ? "min-w-[240px]" : "min-w-[220px] max-w-[260px]"
      )}
    >
      <div
        className={cn(
          "relative rounded-sm border bg-[#060b14]/95 backdrop-blur-md transition-shadow duration-300",
          selected && "ring-1 ring-offset-1 ring-offset-[#020617]",
          isHub ? "px-4 py-3.5" : "px-3.5 py-3"
        )}
        style={{
          borderColor: accent.border,
          boxShadow: selected
            ? `0 0 24px ${accent.glow}, inset 0 0 20px ${accent.glow}`
            : `0 0 12px ${accent.glow.replace("0.35", "0.15")}`,
          ...(selected ? { ringColor: accent.accent } : {}),
        }}
      >
        <span
          className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l"
          style={{ borderColor: accent.accent }}
        />
        <span
          className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r"
          style={{ borderColor: accent.accent }}
        />
        <span
          className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l"
          style={{ borderColor: accent.accent }}
        />
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r"
          style={{ borderColor: accent.accent }}
        />

        <div className="flex items-start gap-2.5 pr-1">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: status.led,
                boxShadow: `0 0 8px ${status.led}`,
              }}
            />
            <StatusIcon
              className={cn(
                "w-3.5 h-3.5",
                status.color,
                data.status === "devam" && "animate-spin"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "font-semibold tracking-wide text-white leading-tight",
                isHub ? "text-sm" : "text-xs"
              )}
            >
              {data.title}
            </div>
            <div
              className="text-[10px] uppercase tracking-wider mt-0.5 truncate"
              style={{ color: accent.accent }}
            >
              {data.role}
            </div>
            {!isHub && (
              <div className="text-[9px] text-slate-500 mt-1 uppercase">
                {data.type} · {data.repo}
              </div>
            )}
          </div>
        </div>

        {data.status === "calisir" && isHub && (
          <div
            className="absolute inset-0 rounded-sm pointer-events-none cyber-node-pulse"
            style={{ boxShadow: `inset 0 0 30px ${accent.glow}` }}
          />
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !border !bg-[#0f172a]"
        style={{ borderColor: accent.accent }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border !bg-[#0f172a]"
        style={{ borderColor: accent.accent }}
      />
    </div>
  )
}

export const CyberNode = memo(CyberNodeComponent)
