"use client"

import { Activity, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActiveTask } from "@/types/active-tasks"
import { ActiveTaskCompactRow } from "./ActiveTaskCompactRow"

interface OpsActiveTasksRailProps {
  tasks: ActiveTask[]
  loading: boolean
  onViewAll: () => void
}

export function OpsActiveTasksRail({
  tasks,
  loading,
  onViewAll,
}: OpsActiveTasksRailProps) {
  if (loading) {
    return (
      <aside className="hidden w-[260px] shrink-0 flex-col border-l border-border/60 bg-background/95 lg:flex">
        <div className="flex flex-1 items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </aside>
    )
  }

  if (tasks.length === 0) return null

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-l border-border/60 bg-background/95 lg:flex">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Aktif süreçler</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-0.5 px-2 text-[10px]"
          onClick={onViewAll}
        >
          Tümü
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {tasks.map((task) => (
            <ActiveTaskCompactRow key={task.id} task={task} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}
