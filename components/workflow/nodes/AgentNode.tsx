"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Image from "next/image";
import type { AgentNodeData } from "../lib/state-to-graph";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";

const statusConfig = {
  idle: {
    icon: Clock,
    className: "text-muted-foreground",
    animation: "",
    label: "Baslatildi",
  },
  thinking: {
    icon: Brain,
    className: "text-yellow-400",
    animation: "animate-pulse",
    label: "Dusunuyor",
  },
  decided: {
    icon: Brain,
    className: "text-blue-400",
    animation: "",
    label: "Karar verdi",
  },
  executing: {
    icon: Loader2,
    className: "text-orange-400",
    animation: "animate-spin",
    label: "Calisiyor",
  },
  waiting: {
    icon: Clock,
    className: "text-muted-foreground",
    animation: "",
    label: "Bekliyor",
  },
  completed: {
    icon: CheckCircle2,
    className: "text-green-400",
    animation: "",
    label: "Tamamlandi",
  },
  error: {
    icon: AlertCircle,
    className: "text-red-400",
    animation: "animate-shake",
    label: "Hata",
  },
};

function AgentNodeComponent({ data }: NodeProps) {
  const { agent, style } = data as unknown as AgentNodeData;
  const status = statusConfig[agent.status] ?? statusConfig.idle;
  const StatusIcon = status.icon;
  const AgentIcon = style.icon;

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 bg-card shadow-lg overflow-hidden",
        "transition-all duration-300",
        agent.status === "thinking" && "shadow-yellow-400/20 shadow-xl",
        agent.status === "completed" && "shadow-green-400/10",
        agent.status === "error" && "shadow-red-400/20 animate-shake"
      )}
      style={{
        width: 220,
        height: 130,
        borderColor: style.borderColor,
      }}
    >
      {/* Top color stripe */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: style.color }}
      />

      {/* Content */}
      <div className="p-3 flex gap-3 h-[calc(100%-6px)]">
        {/* Avatar or Icon */}
        <div className="shrink-0 flex items-start pt-0.5">
          {style.avatar ? (
            <div
              className={cn(
                "w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center",
                agent.status === "thinking" && "animate-pulse"
              )}
            >
              <Image
                src={style.avatar}
                alt={style.label}
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: style.bgColor }}
            >
              <AgentIcon
                size={28}
                style={{ color: style.color }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Name */}
          <span className="text-sm font-semibold text-foreground truncate leading-tight">
            {style.label}
          </span>

          {/* Model badge */}
          {agent.model && (
            <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit truncate max-w-full">
              {agent.model.replace("model: ", "")}
            </span>
          )}

          {/* Last reasoning text */}
          {agent.llmMessages.length > 0 && (
            <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2 mt-auto">
              {agent.llmMessages[agent.llmMessages.length - 1]}
            </p>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          "absolute bottom-2 right-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted",
          status.className
        )}
      >
        <StatusIcon size={12} className={status.animation} />
        <span>{status.label}</span>
      </div>

      {/* Thinking glow ring */}
      {agent.status === "thinking" && (
        <div
          className="absolute inset-0 rounded-xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 20px ${style.color}`,
            opacity: 0.3,
          }}
        />
      )}

      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
