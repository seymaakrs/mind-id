"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { KIND_COLORS, type AgentGraphNode, type AgentStatus } from "./data/agentGraph"
import { PixelGhost } from "../canvas/deck/PixelGhost"

export interface AgentNodeData extends AgentGraphNode {
  index: number
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  waiting: "BEKLİYOR",
  running: "ÇALIŞIYOR",
  completed: "TAMAM",
  blocked: "BLOKE",
  idle: "HAZIR",
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    waiting: "text-amber-400 border-amber-500/50",
    running: "text-green-400 border-green-500/50 animate-pulse",
    completed: "text-cyan-400 border-cyan-500/50",
    blocked: "text-red-400 border-red-500/50",
    idle: "text-slate-400 border-slate-500/50",
  }
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider",
        colors[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function AgentNodeComponent({ data, selected }: NodeProps<Node<AgentNodeData>>) {
  const color = KIND_COLORS[data.kind]
  const isExpert = data.kind === "expert" || data.kind === "sales"
  const isUser = data.kind === "user"
  const isOrch = data.kind === "orchestrator"
  const isWorkflow = data.kind === "workflow"
  const isApi = data.kind === "api"
  const isDb = data.kind === "database"
  const isPlanned = data.kind === "planned"
  const isPortal = data.kind === "portal"

  return (
    <div
      className={cn(
        "mind-id-agent-node relative min-w-[200px] max-w-[240px] font-mono",
        selected && "mind-id-node-selected",
        data.status === "running" && "mind-id-node-running",
        isPlanned && "opacity-70"
      )}
      style={{
        filter: selected ? `drop-shadow(0 0 14px ${color})` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0" />
      <div
        className={cn(
          "rounded border-2 bg-black/90 p-2.5",
          isApi && "rounded-sm",
          isDb && "rounded-full px-4",
          isWorkflow && "border-dashed"
        )}
        style={{ borderColor: color, boxShadow: `0 0 12px ${color}33` }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold" style={{ color }}>
            [{data.index}]
          </span>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex gap-2">
          <div className="shrink-0">
            {isUser || isExpert ? (
              <PixelGhost color={color} size="sm" />
            ) : isOrch || isWorkflow ? (
              <span
                className="mt-1 block h-8 w-8 rounded-full border-2"
                style={{ borderColor: color, backgroundColor: `${color}44` }}
              />
            ) : isApi ? (
              <span
                className="mt-1 block h-7 w-10 border-2"
                style={{ borderColor: color, backgroundColor: `${color}22` }}
              />
            ) : isDb ? (
              <span
                className="mt-1 block h-8 w-6 rounded-t-full border-2 border-b-0"
                style={{ borderColor: color }}
              />
            ) : isPortal ? (
              <span
                className="mt-1 block h-7 w-7 rotate-45 border-2"
                style={{ borderColor: color, backgroundColor: `${color}33` }}
              />
            ) : (
              <span
                className="mt-1 block h-6 w-6 rounded border"
                style={{ borderColor: color }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-white">{data.label}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/50">{data.className}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wide text-white/35">{data.repo}</p>
          </div>
        </div>
        {data.subtasks.length > 0 && (
          <ul className="mt-2 space-y-0.5 border-t border-white/10 pt-1.5">
            {data.subtasks.slice(0, 3).map((t) => (
              <li key={t} className="text-[10px] text-white/55">
                · {t}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0" />
    </div>
  )
}

export const AgentNode = memo(AgentNodeComponent)
