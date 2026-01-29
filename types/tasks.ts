import { Timestamp } from "firebase/firestore";

// Task status types
export type TaskStatus = "pending" | "running" | "completed" | "failed";

// Task type (same as JobType for consistency)
export type TaskType = "immediate" | "planned" | "routine";

// Task interface - represents a single execution of any job type
export interface Task {
  id: string;
  businessId: string;
  type: TaskType;
  task: string; // The task content/description
  jobId?: string; // Reference to source job (for planned/routine)
  status: TaskStatus;
  createdBy?: string; // Display name of the user who created the task
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  result?: string;
  error?: string;
  extras?: Record<string, unknown>;
}

// Data for creating a new task (without id and auto-generated fields)
export interface CreateTaskData {
  businessId: string;
  type: TaskType;
  task: string;
  jobId?: string;
  createdBy?: string; // Display name of the user who created the task
  extras?: Record<string, unknown>;
}

// Status labels for UI (Turkish)
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Bekliyor",
  running: "Çalışıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
};
