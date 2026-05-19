"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { PixelGhost } from "./PixelGhost"
import { DeckFlowBadge } from "./DeckFlowBadge"
import type { DeckNodeData } from "./types"

function DeckGhostNodeComponent({ data, selected }: NodeProps<Node<DeckNodeData>>) {
  const isRoot = data.type === "root"
  const isOrchestrator = data.flowStep === 4

  return (
    <div className={cn("relative flex flex-col items-center", selected && "deck-node-selected")}>
      {data.flowStep != null && <DeckFlowBadge step={data.flowStep} />}
      <div className="pixel-ghost-wrap">
        <PixelGhost color={data.branchColor} size={isRoot || isOrchestrator ? "lg" : "md"} />
      </div>
      <p
        className={cn(
          "mt-2 max-w-[160px] text-center font-sans leading-snug text-white",
          isRoot ? "text-base font-bold" : "text-sm font-semibold"
        )}
      >
        {data.title}
      </p>
      {!isRoot && (
        <p className="mt-1 max-w-[160px] text-center text-xs leading-tight text-white/55">
          {data.role}
        </p>
      )}
      <Handle type="target" position={Position.Left} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" id="bottom" />
    </div>
  )
}

export const DeckGhostNode = memo(DeckGhostNodeComponent)
