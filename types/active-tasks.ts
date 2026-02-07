// Active Tasks - Top-level Firestore collection for global task monitoring
// Unlike businesses/{id}/tasks, this tracks ALL running tasks across the system

export type ActiveTaskStatus = "running" | "success" | "failed";

export interface ActiveTask {
  id: string; // Firestore document ID
  business_id: string;
  task: string; // Task description
  task_id: string; // Reference to businesses/{business_id}/tasks/{task_id}
  log_id?: string; // Reference to businesses/{business_id}/logs/{log_id}
  status: ActiveTaskStatus;
  started_at: string; // ISO string
  completed_at?: string; // ISO string
  duration_ms?: number;
  error?: string;
  current_step?: string; // Currently executing tool/step name
  last_activity_at: string; // ISO string - updated on each tool execution
  expires_at?: string; // ISO string

  // Resolved client-side
  businessName?: string;
}

// Stuck detection: running + last_activity_at > 5 minutes ago
const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function isTaskStuck(task: ActiveTask): boolean {
  if (task.status !== "running") return false;
  const lastActivity = new Date(task.last_activity_at).getTime();
  const now = Date.now();
  return now - lastActivity > STUCK_THRESHOLD_MS;
}

// Status labels for UI (Turkish)
export const ACTIVE_TASK_STATUS_LABELS: Record<ActiveTaskStatus | "stuck", string> = {
  running: "Çalışıyor",
  stuck: "Takıldı",
  success: "Başarılı",
  failed: "Başarısız",
};
