"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ToolNodeData } from "../lib/state-to-graph";
import { cn } from "@/lib/utils";
import {
  Cog,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getAgentStyle } from "../lib/agent-styles";

function ToolNodeComponent({ data }: NodeProps) {
  const { tool, parentAgentName } = data as unknown as ToolNodeData;

  // Use parent agent's icon for sub-agent calls
  const isSubAgent = tool.isAgentCall;
  const ToolIcon = isSubAgent
    ? getAgentStyle(tool.tool.replace("_tool", "")).icon
    : Cog;

  const iconColor = isSubAgent
    ? getAgentStyle(tool.tool.replace("_tool", "")).color
    : undefined;

  // Format display name
  const displayName = formatToolName(tool.tool);

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card shadow-md overflow-hidden",
        "transition-all duration-300",
        tool.status === "executing" && "border-orange-400/50",
        tool.status === "completed" && "border-green-400/50",
        tool.status === "error" && "border-red-400/50 animate-shake"
      )}
      style={{ width: 160, height: 60 }}
    >
      <div className="p-2 flex items-center gap-2 h-full">
        {/* Icon */}
        <div className="shrink-0">
          {tool.status === "executing" ? (
            <Loader2 size={16} className="text-orange-400 animate-spin" />
          ) : tool.status === "completed" ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : tool.status === "error" ? (
            <AlertCircle size={16} className="text-red-400" />
          ) : (
            <ToolIcon size={16} style={iconColor ? { color: iconColor } : undefined} className={!iconColor ? "text-muted-foreground" : ""} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {displayName}
          </p>
          {tool.durationMs != null && (
            <p className="text-[10px] text-muted-foreground">
              {formatDuration(tool.durationMs)}
            </p>
          )}
          {tool.error && (
            <p className="text-[10px] text-red-400 truncate">
              {tool.error.messageTr}
            </p>
          )}
        </div>
      </div>

      {/* Tooltip on hover - output preview */}
      {tool.outputPreview && (
        <div className="absolute left-0 right-0 bottom-full mb-1 hidden group-hover:block z-50">
          <div className="bg-popover border rounded-md p-2 text-[10px] text-popover-foreground shadow-lg max-w-[300px]">
            <p className="line-clamp-4 break-words">{tool.outputPreview}</p>
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-1.5 !h-1.5" />
    </div>
  );
}

function formatToolName(tool: string): string {
  return tool
    .replace(/_tool$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const ToolNode = memo(ToolNodeComponent);
