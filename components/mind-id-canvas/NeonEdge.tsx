"use client"

import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react"

export interface NeonEdgeData {
  color?: string
  label?: string
  main?: boolean
}

function NeonEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const d = data as NeonEdgeData | undefined
  const color = d?.color ?? "#00ff00"
  const [path, lx, ly] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: d?.main ? 3 : 1.5,
          opacity: 0.9,
        }}
        className="mind-id-neon-edge"
      />
      <circle r="3" fill={color}>
        <animateMotion dur="2s" repeatCount="indefinite" path={path} />
      </circle>
      {d?.label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none rounded border border-white/15 bg-black/90 px-2 py-0.5 font-mono text-[10px] text-white/80"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
            }}
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const NeonEdge = memo(NeonEdgeComponent)
