"use client"

import { useEffect, useState } from "react"
import { Loader2, AlertTriangle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ActiveTask } from "@/types/active-tasks"
import { isTaskStuck } from "@/types/active-tasks"
import { cn } from "@/lib/utils"

function formatElapsed(startedAt: string): string {
  const diffMs = Date.now() - new Date(startedAt).getTime()
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes > 0) return `${minutes}dk`
  return `${seconds}sn`
}

function Elapsed({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(formatElapsed(startedAt))
  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(startedAt)), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return <span className="font-mono text-[10px] text-muted-foreground">{elapsed}</span>
}

export function ActiveTaskCompactRow({ task }: { task: ActiveTask }) {
  const stuck = isTaskStuck(task)

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/40 px-2.5 py-2",
        stuck && "border-red-500/40 bg-red-500/5"
      )}
    >
      <div className="flex items-start gap-2">
        {stuck ? (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500 animate-pulse" />
        ) : task.status === "running" ? (
          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-blue-400" />
        ) : (
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1">
            {task.businessName && (
              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                {task.businessName}
              </Badge>
            )}
            {task.status === "running" && !stuck && (
              <Elapsed startedAt={task.started_at} />
            )}
          </div>
          <p className="line-clamp-2 text-[11px] leading-snug">{task.task}</p>
          {task.current_step && task.status === "running" && (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {task.current_step}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
