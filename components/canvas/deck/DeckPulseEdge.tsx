"use client"

import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react"
import type { DeckEdgeData } from "./types"

function DeckPulseEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const edgeData = data as DeckEdgeData | undefined
  const color = edgeData?.branchColor ?? "#94a3b8"
  const animated = edgeData?.kind !== "collaboration" && edgeData?.animated !== false
  const label = edgeData?.label

  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: 2.5,
          opacity: 0.9,
        }}
      />
      {animated && (
        <>
          <circle r="4" fill={color}>
            <animateMotion dur="2.2s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="2.5" fill="#fff" opacity="0.95">
            <animateMotion dur="2.2s" begin="0.55s" repeatCount="indefinite" path={path} />
          </circle>
        </>
      )}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none max-w-[140px] rounded border border-white/10 bg-black/85 px-2 py-1 text-center text-[11px] font-medium leading-tight text-white/90"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const DeckPulseEdge = memo(DeckPulseEdgeComponent)
