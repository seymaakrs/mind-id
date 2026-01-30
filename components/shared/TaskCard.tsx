"use client";

import { memo, useMemo } from "react";
import { X, Loader2, CheckCircle2, XCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActiveTask, ProgressMessage } from "@/contexts/TaskStreamContext";

interface TaskCardProps {
  task: ActiveTask;
  onCancel: () => void;
  onDismiss: () => void;
}

// Format relative time in Turkish
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return "az once";
  } else if (diffMin < 60) {
    return `${diffMin} dk once`;
  } else if (diffHour < 24) {
    return `${diffHour} saat once`;
  } else {
    return date.toLocaleDateString("tr-TR");
  }
}

// Format timestamp for progress messages
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

// Truncate text with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// Progress message component
const ProgressMessageItem = memo(function ProgressMessageItem({
  msg,
}: {
  msg: ProgressMessage;
}) {
  return (
    <div className="flex gap-1.5 text-[10px] leading-tight">
      <span className="text-muted-foreground shrink-0">
        [{formatTimestamp(msg.timestamp)}]
      </span>
      <span className="text-muted-foreground/80 truncate">{msg.message}</span>
    </div>
  );
});

export const TaskCard = memo(function TaskCard({
  task,
  onCancel,
  onDismiss,
}: TaskCardProps) {
  const { id, taskDescription, status, progressMessages, response, error, createdAt, businessName } =
    task;

  // Get last 3 progress messages
  const recentProgress = useMemo(() => {
    return progressMessages.slice(-3);
  }, [progressMessages]);

  // Status icon and colors
  const statusConfig = useMemo(() => {
    switch (status) {
      case "pending":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />,
          label: "Baslatiliyor...",
          bgClass: "bg-muted/50",
          borderClass: "border-border",
        };
      case "running":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />,
          label: "Calisiyor",
          bgClass: "bg-blue-500/5",
          borderClass: "border-blue-500/20",
        };
      case "completed":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
          label: "Tamamlandi",
          bgClass: "bg-green-500/5",
          borderClass: "border-green-500/20",
        };
      case "failed":
        return {
          icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
          label: "Basarisiz",
          bgClass: "bg-red-500/5",
          borderClass: "border-red-500/20",
        };
      default:
        return {
          icon: <Square className="h-3.5 w-3.5 text-muted-foreground" />,
          label: "Bilinmiyor",
          bgClass: "bg-muted/50",
          borderClass: "border-border",
        };
    }
  }, [status]);

  const isActive = status === "pending" || status === "running";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all duration-200",
        statusConfig.bgClass,
        statusConfig.borderClass
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {statusConfig.icon}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {truncateText(taskDescription, 40)}
            </p>
            {businessName && (
              <p className="text-[10px] text-muted-foreground truncate">
                {businessName}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={isActive ? onCancel : onDismiss}
          title={isActive ? "Iptal et" : "Kapat"}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Progress messages (only for running) */}
      {status === "running" && recentProgress.length > 0 && (
        <div className="mb-2 space-y-0.5 font-mono bg-background/50 rounded p-1.5 max-h-16 overflow-y-auto">
          {recentProgress.map((msg, i) => (
            <ProgressMessageItem key={`${msg.timestamp}-${i}`} msg={msg} />
          ))}
        </div>
      )}

      {/* Status indicator */}
      {isActive && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                status === "running"
                  ? "bg-blue-500 animate-pulse w-2/3"
                  : "bg-muted-foreground/30 w-1/4"
              )}
            />
          </div>
          <span className="shrink-0">{statusConfig.label}</span>
        </div>
      )}

      {/* Completed result summary */}
      {status === "completed" && response && (
        <div className="text-xs text-muted-foreground">
          <p className="truncate">{truncateText(response, 60)}</p>
          <p className="text-[10px] mt-1">{formatRelativeTime(createdAt)}</p>
        </div>
      )}

      {/* Error message */}
      {status === "failed" && error && (
        <div className="text-xs text-red-400">
          <p className="truncate">{truncateText(error, 60)}</p>
          <p className="text-[10px] mt-1 text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </p>
        </div>
      )}
    </div>
  );
});
