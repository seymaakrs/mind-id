"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { PixelGhost } from "./PixelGhost"
import { DeckFlowBadge } from "./DeckFlowBadge"
import type { DeckNodeData } from "./types"

function DeckFlowCardNodeComponent({ id, data, selected }: NodeProps<Node<DeckNodeData>>) {
  const isGhost = data.visualKind === "ghost"
  const isOrchestrator = id === "cf-orchestrator"

  return (
    <div
      className={cn(
        "relative w-[260px] rounded-md border-2 bg-[#0a0c12]/95 px-3 py-3 shadow-lg backdrop-blur-sm",
        selected && "ring-2 ring-amber-400/50"
      )}
      style={{
        borderColor: data.branchColor,
        boxShadow: selected
          ? `0 0 24px ${data.branchColor}44`
          : `0 0 12px ${data.branchColor}22`,
      }}
    >
      {data.flowStep != null && <DeckFlowBadge step={data.flowStep} />}

      <div className="flex gap-3">
        <div className="shrink-0 pt-0.5">
          {isGhost ? (
            <PixelGhost color={data.branchColor} size={isOrchestrator ? "md" : "sm"} />
          ) : (
            <span
              className="mt-2 block h-5 w-5 rounded-full border-2"
              style={{
                backgroundColor: data.branchColor,
                borderColor: "rgba(255,255,255,0.35)",
                boxShadow: `0 0 10px ${data.branchColor}`,
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {data.tag && (
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              {data.tag}
            </p>
          )}
          <p className="text-base font-bold leading-tight text-white">{data.title}</p>
          <p className="mt-0.5 text-xs font-medium text-white/70">{data.role}</p>
          {data.agentKey && (
            <p className="mt-1 inline-block rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-pink-200">
              {data.agentKey}
            </p>
          )}
        </div>
      </div>

      <p className="mt-2.5 text-[13px] leading-relaxed text-white/75">{data.description}</p>

      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-white/30 !bg-slate-900" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-white/30 !bg-slate-900" />
      {isOrchestrator && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="dispatch"
          className="!h-2 !w-2 !border-pink-400/60 !bg-pink-950"
        />
      )}
      {!isGhost && (
        <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-pink-400/60 !bg-pink-950" />
      )}
    </div>
  )
}

export const DeckFlowCardNode = memo(DeckFlowCardNodeComponent)
