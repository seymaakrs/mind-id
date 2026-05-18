"use client"

import { memo } from "react"
import type { NodeProps } from "@xyflow/react"
import type { DeckFlowLabelData } from "./types"

function DeckFlowLabelNodeComponent({ data }: NodeProps) {
  const d = data as DeckFlowLabelData
  return (
    <div className="pointer-events-none w-[540px] rounded border border-pink-500/25 bg-pink-950/20 px-4 py-3 text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-pink-200">{d.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-white/60">{d.subtitle}</p>
    </div>
  )
}

export const DeckFlowLabelNode = memo(DeckFlowLabelNodeComponent)
