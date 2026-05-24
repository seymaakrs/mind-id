"use client"

import { memo } from "react"
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { CyberEdgeData } from "./types"

function CyberEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = data as CyberEdgeData | undefined
  const isCollab = edgeData?.kind === "collaboration"

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })

  const stroke = isCollab ? "rgba(56,189,248,0.35)" : "rgba(129,140,248,0.7)"
  const width = isCollab ? 1 : 2

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke,
        strokeWidth: width,
        strokeDasharray: isCollab ? "5 6" : "8 4",
      }}
      className={cn(!isCollab && "cyber-topology-edge")}
    />
  )
}

export const CyberEdge = memo(CyberEdgeComponent)
