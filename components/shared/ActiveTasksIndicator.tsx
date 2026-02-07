"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { useActiveTasks } from "@/contexts/ActiveTasksContext";
import { isTaskStuck } from "@/types/active-tasks";
import type { ActiveTask } from "@/types/active-tasks";
import { cn } from "@/lib/utils";

function formatElapsed(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}s ${minutes % 60}dk`;
  if (minutes > 0) return `${minutes}dk ${seconds % 60}sn`;
  return `${seconds}sn`;
}

function TaskStatusIcon({ task }: { task: ActiveTask }) {
  const stuck = isTaskStuck(task);

  if (stuck) {
    return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
  }

  switch (task.status) {
    case "running":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(formatElapsed(startedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <span className="text-[10px] text-muted-foreground font-mono">{elapsed}</span>;
}

function TaskItem({ task }: { task: ActiveTask }) {
  const stuck = isTaskStuck(task);

  return (
    <div
      className={cn(
        "p-3 border-b last:border-b-0 transition-colors",
        stuck && "bg-red-500/5"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          <TaskStatusIcon task={task} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {task.businessName && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {task.businessName}
              </Badge>
            )}
            {stuck && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Takıldı
              </Badge>
            )}
            {task.status === "running" && !stuck && (
              <ElapsedTimer startedAt={task.started_at} />
            )}
          </div>
          <p className="text-sm truncate">{task.task}</p>
          {task.current_step && task.status === "running" && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {task.current_step}
            </p>
          )}
          {task.error && (
            <p className="text-xs text-red-400 truncate mt-0.5">{task.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActiveTasksIndicatorProps {
  onNavigate?: () => void;
}

export function ActiveTasksIndicator({ onNavigate }: ActiveTasksIndicatorProps) {
  const { tasks, loading, runningCount, stuckCount } = useActiveTasks();
  const [open, setOpen] = useState(false);

  const totalActive = runningCount + stuckCount;
  const hasStuck = stuckCount > 0;

  // Sort: stuck first, then running, then others
  const sortedTasks = [...tasks].sort((a, b) => {
    const aStuck = isTaskStuck(a);
    const bStuck = isTaskStuck(b);
    if (aStuck && !bStuck) return -1;
    if (!aStuck && bStuck) return 1;
    if (a.status === "running" && b.status !== "running") return -1;
    if (a.status !== "running" && b.status === "running") return 1;
    return 0;
  });

  const displayTasks = sortedTasks.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            hasStuck && "text-red-500 hover:text-red-500"
          )}
        >
          <Activity className="w-5 h-5" />
          {totalActive > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                hasStuck
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-blue-500 text-white"
              )}
            >
              {totalActive > 99 ? "99+" : totalActive}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold">Aktif Gorevler</span>
          </div>
          <div className="flex items-center gap-1.5">
            {runningCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {runningCount} calisiyor
              </Badge>
            )}
            {stuckCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stuckCount} takıldı
              </Badge>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Aktif gorev bulunmuyor</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            {displayTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ScrollArea>
        )}

        {tasks.length > 0 && onNavigate && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                onNavigate();
                setOpen(false);
              }}
            >
              Tum Gorevleri Gor ({tasks.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
