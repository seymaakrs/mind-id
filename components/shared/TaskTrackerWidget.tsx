"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTaskStream } from "@/contexts/TaskStreamContext";
import { useDraggable } from "@/components/shared/useDraggable";
import { TaskCard } from "@/components/shared/TaskCard";

const WIDGET_WIDTH = 320;
const WIDGET_MAX_HEIGHT = 400;
const WIDGET_PADDING = 16;
const MINIMIZED_SIZE = 48;

export function TaskTrackerWidget() {
  const {
    activeTasks,
    isWidgetMinimized,
    setWidgetMinimized,
    setWidgetPosition,
    cancelTask,
    dismissTask,
    clearCompletedTasks,
  } = useTaskStream();

  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [widgetHeight, setWidgetHeight] = useState(MINIMIZED_SIZE);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Measure widget height
  useEffect(() => {
    if (!widgetRef.current || !isClient) return;

    const measureHeight = () => {
      if (widgetRef.current) {
        const height = widgetRef.current.offsetHeight;
        setWidgetHeight(height > 0 ? height : MINIMIZED_SIZE);
      }
    };

    // Initial measurement
    measureHeight();

    // Use ResizeObserver for dynamic height changes
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(widgetRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isClient, isWidgetMinimized, activeTasks.length]);

  // Show/hide widget based on active tasks
  useEffect(() => {
    if (activeTasks.length > 0) {
      setIsVisible(true);
    } else {
      // Hide after a short delay when no tasks
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTasks.length]);

  // Draggable hook with snap-to-corners
  // Use actual measured height for accurate corner positioning
  const effectiveHeight = isWidgetMinimized ? MINIMIZED_SIZE : widgetHeight;

  const { isDragging, dragHandleProps, containerStyle } = useDraggable({
    onPositionChange: setWidgetPosition,
    elementWidth: isWidgetMinimized ? MINIMIZED_SIZE : WIDGET_WIDTH,
    elementHeight: effectiveHeight,
    padding: WIDGET_PADDING,
    snapToCorners: true,
    defaultCorner: "bottom-right",
  });

  // Count active (pending/running) tasks
  const activeCount = activeTasks.filter(
    (t) => t.status === "pending" || t.status === "running"
  ).length;

  // Count completed/failed tasks
  const completedCount = activeTasks.filter(
    (t) => t.status === "completed" || t.status === "failed"
  ).length;

  // Handle cancel
  const handleCancel = useCallback(
    (taskId: string) => {
      cancelTask(taskId);
    },
    [cancelTask]
  );

  // Handle dismiss
  const handleDismiss = useCallback(
    (taskId: string) => {
      dismissTask(taskId);
    },
    [dismissTask]
  );

  // Don't render on server or when not visible
  if (!isClient || (!isVisible && activeTasks.length === 0)) {
    return null;
  }

  // Minimized view
  if (isWidgetMinimized) {
    return (
      <div
        ref={widgetRef}
        className={cn(
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
        style={containerStyle}
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg border-2 relative",
            activeCount > 0
              ? "border-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
              : "border-green-500 bg-green-500/10 hover:bg-green-500/20"
          )}
          onClick={() => setWidgetMinimized(false)}
        >
          {activeCount > 0 ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          ) : (
            <span className="text-sm font-bold text-green-400">
              {activeTasks.length}
            </span>
          )}
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      ref={widgetRef}
      className={cn(
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        isDragging && "cursor-grabbing"
      )}
      style={{
        ...containerStyle,
        width: `${WIDGET_WIDTH}px`,
      }}
    >
      <div className="bg-background border rounded-lg shadow-xl overflow-hidden">
        {/* Header - Draggable */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 border-b bg-muted/30",
            "select-none"
          )}
          {...dragHandleProps}
        >
          <div className="flex items-center gap-2">
            {activeCount > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
            )}
            <span className="text-sm font-medium">
              {activeCount > 0
                ? `Aktif Gorevler (${activeCount})`
                : `Tamamlanan (${completedCount})`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {completedCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={clearCompletedTasks}
                title="Tamamlananlari temizle"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setWidgetMinimized(true)}
              title="Simge durumuna kucult"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Task List */}
        <ScrollArea
          className="p-2"
          style={{ maxHeight: `${WIDGET_MAX_HEIGHT - 48}px` }}
        >
          <div className="space-y-2">
            {activeTasks.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Aktif gorev yok
              </div>
            ) : (
              activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onCancel={() => handleCancel(task.id)}
                  onDismiss={() => handleDismiss(task.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
