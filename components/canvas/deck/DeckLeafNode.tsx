"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { STATUS_META } from "../topology/data"
import { DeckFlowBadge } from "./DeckFlowBadge"
import type { DeckNodeData } from "./types"

function DeckLeafNodeComponent({ data, selected }: NodeProps<Node<DeckNodeData>>) {
  const status = STATUS_META[data.status]
  const dim = data.status === "hata" ? 20 : data.status === "pasif" ? 18 : 20

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 px-1",
        selected && "deck-leaf-selected"
      )}
      style={
        selected
          ? {
              filter: `drop-shadow(0 0 14px ${data.branchColor}) drop-shadow(0 0 28px ${data.branchColor}99)`,
            }
          : undefined
      }
    >
      {data.flowStep != null && <DeckFlowBadge step={data.flowStep} />}
      <span
        className={cn("block rounded-full border-2", data.status === "devam" && "animate-pulse")}
        style={{
          width: dim,
          height: dim,
          backgroundColor: data.branchColor,
          borderColor: data.status === "hata" ? "#f87171" : "rgba(255,255,255,0.35)",
          boxShadow: selected ? `0 0 18px ${data.branchColor}` : `0 0 8px ${data.branchColor}66`,
        }}
        title={status.label}
      />
      <p className="max-w-[150px] text-center text-sm font-medium leading-snug text-white">
        {data.title}
      </p>
      <p className="max-w-[150px] text-center text-xs leading-tight text-white/55">{data.role}</p>
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="target" position={Position.Left} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-1 !h-1" />
    </div>
  )
}

export const DeckLeafNode = memo(DeckLeafNodeComponent)
