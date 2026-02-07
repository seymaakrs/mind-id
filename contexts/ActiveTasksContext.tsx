"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { subscribeToActiveTasks } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import type { ActiveTask } from "@/types/active-tasks";
import { isTaskStuck } from "@/types/active-tasks";

interface ActiveTasksContextType {
  tasks: ActiveTask[];
  loading: boolean;
  runningCount: number;
  stuckCount: number;
  failedCount: number;
  successCount: number;
}

const ActiveTasksContext = createContext<ActiveTasksContextType | undefined>(undefined);

export function ActiveTasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessNames, setBusinessNames] = useState<Map<string, string>>(new Map());
  const seenTaskIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  // Fetch business names once for resolution
  const fetchBusinessNames = useCallback(async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "businesses"));
      const names = new Map<string, string>();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        names.set(doc.id, data.name || doc.id);
      });
      setBusinessNames(names);
    } catch (error) {
      console.error("Error fetching business names:", error);
    }
  }, []);

  useEffect(() => {
    if (!db || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribeTasks: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
      }

      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Fetch business names for resolution
      fetchBusinessNames();

      // Subscribe to active tasks
      unsubscribeTasks = subscribeToActiveTasks(
        (newTasks) => {
          // Show toast for new running tasks (not on initial load)
          if (!isInitialLoad.current) {
            const existingIds = seenTaskIds.current;
            newTasks.forEach((task) => {
              if (!existingIds.has(task.id) && task.status === "running") {
                toast.info(`Yeni gorev basladi: ${task.task.slice(0, 60)}`, {
                  duration: 3000,
                  id: `active-task-${task.id}`,
                });
              }
            });
          }

          // Check for stuck tasks
          if (!isInitialLoad.current) {
            newTasks.forEach((task) => {
              if (isTaskStuck(task) && !seenTaskIds.current.has(`stuck-${task.id}`)) {
                seenTaskIds.current.add(`stuck-${task.id}`);
                toast.warning(`Gorev takıldı: ${task.task.slice(0, 60)}`, {
                  duration: 8000,
                  id: `stuck-task-${task.id}`,
                });
              }
            });
          }

          // Update seen IDs
          newTasks.forEach((task) => seenTaskIds.current.add(task.id));

          setTasks(newTasks);
          setLoading(false);
          isInitialLoad.current = false;
        },
        () => {
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
    };
  }, [fetchBusinessNames]);

  // Resolve business names onto tasks
  const resolvedTasks = useMemo(() => {
    if (businessNames.size === 0) return tasks;
    return tasks.map((task) => ({
      ...task,
      businessName: businessNames.get(task.business_id) || task.business_id,
    }));
  }, [tasks, businessNames]);

  const runningCount = useMemo(
    () => resolvedTasks.filter((t) => t.status === "running" && !isTaskStuck(t)).length,
    [resolvedTasks]
  );
  const stuckCount = useMemo(
    () => resolvedTasks.filter((t) => isTaskStuck(t)).length,
    [resolvedTasks]
  );
  const failedCount = useMemo(
    () => resolvedTasks.filter((t) => t.status === "failed").length,
    [resolvedTasks]
  );
  const successCount = useMemo(
    () => resolvedTasks.filter((t) => t.status === "success").length,
    [resolvedTasks]
  );

  return (
    <ActiveTasksContext.Provider
      value={{
        tasks: resolvedTasks,
        loading,
        runningCount,
        stuckCount,
        failedCount,
        successCount,
      }}
    >
      {children}
    </ActiveTasksContext.Provider>
  );
}

export function useActiveTasks() {
  const context = useContext(ActiveTasksContext);
  if (context === undefined) {
    throw new Error("useActiveTasks must be used within an ActiveTasksProvider");
  }
  return context;
}
