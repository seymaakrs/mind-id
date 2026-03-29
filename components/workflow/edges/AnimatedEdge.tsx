"use client";

import { memo } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

interface AnimatedEdgeData {
  status?: "executing" | "completed" | "error";
  label?: string;
  isSubAgentEdge?: boolean;
  isSequential?: boolean;
  [key: string]: unknown;
}

function AnimatedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as AnimatedEdgeData | undefined;
  const status = edgeData?.status ?? "executing";
  const label = edgeData?.label;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const strokeColor =
    status === "completed"
      ? "oklch(0.723 0.219 149.579 / 0.6)"
      : status === "error"
        ? "oklch(0.637 0.237 25.331 / 0.6)"
        : "oklch(0.556 0 0 / 0.4)";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: edgeData?.isSubAgentEdge ? 2.5 : 1.5,
          strokeDasharray: status === "executing" ? "6,4" : undefined,
        }}
        className={cn(
          status === "executing" && "workflow-edge-animated"
        )}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute text-[9px] text-muted-foreground bg-card/90 px-1.5 py-0.5 rounded border border-border/50 max-w-[120px] truncate pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
