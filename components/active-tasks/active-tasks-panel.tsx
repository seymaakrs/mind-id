"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useActiveTasks } from "@/contexts/ActiveTasksContext";
import { isTaskStuck, ACTIVE_TASK_STATUS_LABELS } from "@/types/active-tasks";
import type { ActiveTask, ActiveTaskStatus } from "@/types/active-tasks";
import { cn } from "@/lib/utils";

type FilterType = "all" | "running" | "stuck" | "success" | "failed";

function formatElapsed(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}s ${minutes % 60}dk ${seconds % 60}sn`;
  if (minutes > 0) return `${minutes}dk ${seconds % 60}sn`;
  return `${seconds}sn`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}s ${minutes % 60}dk`;
  if (minutes > 0) return `${minutes}dk ${seconds % 60}sn`;
  return `${seconds}sn`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LiveElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(formatElapsed(startedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <span className="font-mono text-sm">{elapsed}</span>;
}

function StatusBadge({ task }: { task: ActiveTask }) {
  const stuck = isTaskStuck(task);

  if (stuck) {
    return (
      <Badge variant="destructive" className="animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Takıldı
      </Badge>
    );
  }

  switch (task.status) {
    case "running":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {ACTIVE_TASK_STATUS_LABELS.running}
        </Badge>
      );
    case "success":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {ACTIVE_TASK_STATUS_LABELS.success}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {ACTIVE_TASK_STATUS_LABELS.failed}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{task.status}</Badge>;
  }
}

function TaskCard({ task }: { task: ActiveTask }) {
  const stuck = isTaskStuck(task);

  return (
    <Card
      className={cn(
        "transition-all",
        stuck && "border-red-500/50 shadow-red-500/10 shadow-md",
        task.status === "running" && !stuck && "border-blue-500/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge task={task} />
              {task.businessName && (
                <Badge variant="outline" className="text-xs">
                  {task.businessName}
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium mt-2">{task.task}</p>
          </div>
        </div>

        {/* Current step */}
        {task.current_step && task.status === "running" && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
            <Activity className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.current_step}</span>
          </div>
        )}

        {/* Error message */}
        {task.error && (
          <div className="flex items-start gap-2 mb-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1.5">
            <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="break-words">{task.error}</span>
          </div>
        )}

        {/* Task metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(task.started_at)}</span>
          </div>

          {task.status === "running" && (
            <div className="flex items-center gap-1 text-blue-400">
              <RefreshCw className="w-3 h-3" />
              <LiveElapsedTimer startedAt={task.started_at} />
            </div>
          )}

          {task.duration_ms != null && task.status !== "running" && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Sure: {formatDuration(task.duration_ms)}</span>
            </div>
          )}

          {task.log_id && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[120px]">Log: {task.log_id}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: "all", label: "Tumu" },
  { id: "running", label: "Calisiyor" },
  { id: "stuck", label: "Takilan" },
  { id: "success", label: "Basarili" },
  { id: "failed", label: "Basarisiz" },
];

export function ActiveTasksPanel() {
  const { tasks, loading, runningCount, stuckCount, successCount, failedCount } = useActiveTasks();
  const [filter, setFilter] = useState<FilterType>("all");

  const getFilteredTasks = useCallback(() => {
    switch (filter) {
      case "running":
        return tasks.filter((t) => t.status === "running" && !isTaskStuck(t));
      case "stuck":
        return tasks.filter((t) => isTaskStuck(t));
      case "success":
        return tasks.filter((t) => t.status === "success");
      case "failed":
        return tasks.filter((t) => t.status === "failed");
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const filteredTasks = getFilteredTasks();

  // Sort: stuck first, then running, then failed, then success
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priority = (t: ActiveTask) => {
      if (isTaskStuck(t)) return 0;
      if (t.status === "running") return 1;
      if (t.status === "failed") return 2;
      return 3;
    };
    return priority(a) - priority(b);
  });

  const filterCounts: Record<FilterType, number> = {
    all: tasks.length,
    running: runningCount,
    stuck: stuckCount,
    success: successCount,
    failed: failedCount,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Aktif Gorevler
          </h2>
          <p className="text-muted-foreground mt-1">
            Tum ajanların gercek zamanli gorev durumu
          </p>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {runningCount} calisiyor
            </Badge>
          )}
          {stuckCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {stuckCount} takıldı
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              {failedCount} basarisiz
            </Badge>
          )}
          {successCount > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {successCount} basarili
            </Badge>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={filter === tab.id ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "text-xs",
              filter === tab.id && "shadow-sm"
            )}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
            {filterCounts[tab.id] > 0 && (
              <span className="ml-1.5 text-[10px] bg-background/50 rounded-full px-1.5 py-0.5">
                {filterCounts[tab.id]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Activity className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {filter === "all" ? "Aktif gorev bulunmuyor" : `${FILTER_TABS.find(t => t.id === filter)?.label} gorev yok`}
            </p>
            <p className="text-sm mt-1">
              Gorevler baslatildiginda burada gercek zamanli olarak gorunecek
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
