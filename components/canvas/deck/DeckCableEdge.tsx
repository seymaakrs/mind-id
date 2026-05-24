"use client"

import { memo } from "react"
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react"
import type { DeckEdgeData } from "./types"

/** Bağlantılı bileşenler arası ince “kablo” (kesik çizgi) */
function DeckCableEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={path}
      className="deck-cable-edge"
      style={{
        stroke: "rgba(148, 163, 184, 0.55)",
        strokeWidth: 1.5,
        strokeDasharray: "6 5",
      }}
    />
  )
}

export const DeckCableEdge = memo(DeckCableEdgeComponent)
