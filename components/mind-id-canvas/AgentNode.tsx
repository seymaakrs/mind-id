"use client"

import { memo } from "react"
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { PixelGhost } from "../canvas/deck/PixelGhost"
import { BRANCH_LABELS, KIND_COLORS, type AgentGraphNode } from "./data/agentGraph"

export interface AgentNodeData extends AgentGraphNode {
  index: number
}

function stepMeta(data: AgentNodeData): string {
  const hint = data.subtasks[0] ?? BRANCH_LABELS[data.branch]
  const short =
    hint.length > 22 ? `${hint.slice(0, 20)}…` : hint
  return `Adım ${data.index} · ${short}`
}

function AgentNodeComponent({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const color = KIND_COLORS[data.kind]
  const isRunning = data.status === "running"
  const isPlanned = data.kind === "planned"

  return (
    <div
      className={cn(
        "mind-id-agent-node group relative flex w-[148px] flex-col items-center bg-transparent font-mono",
        isPlanned && "opacity-55",
        isRunning && "mind-id-node-running"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="mind-id-flow-handle !top-0"
        style={{ background: color }}
      />

      <div
        className={cn(
          "relative flex flex-col items-center px-1 pt-2",
          selected && "mind-id-node-selected"
        )}
        style={{
          filter: selected ? `drop-shadow(0 0 16px ${color})` : undefined,
        }}
      >
        <span
          className="absolute left-1/2 top-0 z-10 -translate-x-[calc(50%+28px)] rounded border border-amber-400/90 bg-black/90 px-1.5 py-0.5 text-[11px] font-bold leading-none text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.35)]"
          aria-label={`Adım ${data.index}`}
        >
          {data.index}
        </span>

        <PixelGhost
          color={color}
          size="md"
          className={cn("mt-1", isRunning && "mind-id-ghost-pulse")}
        />

        <p className="mt-2 max-w-[140px] text-center text-[15px] font-bold leading-tight tracking-tight text-white">
          {data.label}
        </p>
        <p className="mt-1 max-w-[140px] text-center text-[11px] leading-snug text-white/45">
          {stepMeta(data)}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="mind-id-flow-handle !bottom-0"
        style={{ background: color }}
      />
    </div>
  )
}

export const AgentNode = memo(AgentNodeComponent)
