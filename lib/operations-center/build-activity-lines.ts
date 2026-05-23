import type { ActiveTask } from "@/types/active-tasks"
import { isTaskStuck, ACTIVE_TASK_STATUS_LABELS } from "@/types/active-tasks"
import type { AgentError } from "@/types/firebase"
import type { ActiveTask as StreamTask } from "@/contexts/TaskStreamContext"
import type { ServerStatus } from "@/hooks/useServerHealth"
import type { SalesOperationsResponse } from "@/types/sales-operations"

function ts(): string {
  return new Date().toLocaleTimeString("tr-TR")
}

function line(message: string): string {
  return `[${ts()}] ${message}`
}

export interface BuildActivityLinesInput {
  activeTasks: ActiveTask[]
  errors: AgentError[]
  streamTasks: StreamTask[]
  serverHealth: ServerStatus
  serverMessage: string | null
  sales?: SalesOperationsResponse | null
}

export function buildActivityLines({
  activeTasks,
  errors,
  streamTasks,
  serverHealth,
  serverMessage,
  sales,
}: BuildActivityLinesInput): string[] {
  const lines: string[] = []

  if (serverHealth === "connected") {
    lines.push(line("mind-agent bağlantısı: çevrimiçi"))
  } else if (serverHealth === "disconnected" || serverHealth === "error") {
    lines.push(
      line(
        `mind-agent bağlantısı: kapalı${serverMessage ? ` — ${serverMessage}` : ""}`
      )
    )
  }

  const sortedTasks = [...activeTasks].sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )

  for (const task of sortedTasks.slice(0, 12)) {
    const stuck = isTaskStuck(task)
    const statusLabel = stuck
      ? ACTIVE_TASK_STATUS_LABELS.stuck
      : ACTIVE_TASK_STATUS_LABELS[task.status]
    const biz = task.businessName ? ` [${task.businessName}]` : ""
    lines.push(
      line(`${statusLabel}${biz}: ${task.task.slice(0, 80)}`)
    )
    if (task.current_step && task.status === "running") {
      lines.push(line(`  → adım: ${task.current_step}`))
    }
    if (task.error) {
      lines.push(line(`  → hata: ${task.error.slice(0, 120)}`))
    }
  }

  for (const err of errors.slice(0, 5)) {
    lines.push(
      line(
        `Sistem hatası (${err.severity}) · ${err.agent}: ${err.error_message.slice(0, 100)}`
      )
    )
  }

  if (sales?.leads) {
    if (sales.leads.hotCount > 0) {
      lines.push(line(`Sıcak lead: ${sales.leads.hotCount} kayıt`))
    }
    if (sales.leads.newLast24h > 0) {
      lines.push(line(`Son 24s yeni lead: ${sales.leads.newLast24h}`))
    }
  }

  for (const ev of sales?.events ?? []) {
    lines.push(line(ev.message))
  }

  for (const wf of sales?.workflows ?? []) {
    if (wf.lastExecutionStatus === "error" && wf.lastExecutionAt) {
      lines.push(
        line(`n8n hata · ${wf.n8nName} · ${wf.lastExecutionAt}`)
      )
    }
  }

  for (const st of streamTasks) {
    const last = st.progressMessages[st.progressMessages.length - 1]
    if (last) {
      lines.push(
        line(
          `Oturum ${st.status}: ${last.message.slice(0, 100)}`
        )
      )
    } else if (st.currentProgress) {
      lines.push(line(`Oturum: ${st.currentProgress.slice(0, 100)}`))
    }
  }

  return lines.slice(-50)
}
