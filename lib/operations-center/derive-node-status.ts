import type { AgentStatus } from "@/components/mind-id-canvas/data/agentGraph"
import type { ActiveTask } from "@/types/active-tasks"
import { isTaskStuck } from "@/types/active-tasks"
import type { AgentError } from "@/types/firebase"
import type { ServerStatus } from "@/hooks/useServerHealth"
import type { ActiveTask as StreamTask } from "@/contexts/TaskStreamContext"
import type { SalesOperationsResponse } from "@/types/sales-operations"
import { deriveSalesNodeStatuses } from "@/lib/operations-center/derive-sales-node-status"

/** Maps mind-agent step / error agent ids to canvas node ids */
const AGENT_KEY_TO_NODE: Record<string, string> = {
  orchestrator: "orchestrator",
  orchestrator_agent: "orchestrator",
  image_agent: "image_agent",
  video_agent: "video_agent",
  marketing_agent: "marketing_agent",
  analysis_agent: "analysis_agent",
  meta_agent: "sales-mind-agent-bridge",
}

function matchAgentNodeId(agentOrStep: string): string | null {
  const lower = agentOrStep.toLowerCase().replace(/\s+/g, "_")
  for (const [key, nodeId] of Object.entries(AGENT_KEY_TO_NODE)) {
    if (lower.includes(key)) return nodeId
  }
  return null
}

export interface DeriveNodeStatusInput {
  activeTasks: ActiveTask[]
  errors: AgentError[]
  serverHealth: ServerStatus
  streamTasks: StreamTask[]
  sales?: SalesOperationsResponse | null
}

export function deriveNodeStatuses({
  activeTasks,
  errors,
  serverHealth,
  streamTasks,
  sales,
}: DeriveNodeStatusInput): Record<string, AgentStatus> {
  const states: Record<string, AgentStatus> = {}

  const runningGlobal = activeTasks.filter(
    (t) => t.status === "running" && !isTaskStuck(t)
  )
  const stuckGlobal = activeTasks.filter((t) => isTaskStuck(t))
  const failedGlobal = activeTasks.filter((t) => t.status === "failed")
  const successGlobal = activeTasks.filter((t) => t.status === "success")

  const streamRunning = streamTasks.filter(
    (t) => t.status === "running" || t.status === "pending"
  )

  const agentDown =
    serverHealth === "disconnected" || serverHealth === "error"

  // —— mind-agent pipeline ——
  if (agentDown) {
    states["api-agent-task"] = "blocked"
    states["orchestrator"] = "blocked"
  } else if (serverHealth === "connected") {
    if (runningGlobal.length > 0 || streamRunning.length > 0) {
      states["api-agent-task"] = "running"
      states["orchestrator"] = "running"
    } else if (successGlobal.length > 0) {
      states["api-agent-task"] = "completed"
      states["orchestrator"] = "completed"
    } else {
      states["api-agent-task"] = "idle"
      states["orchestrator"] = "idle"
    }
  } else {
    states["api-agent-task"] = "waiting"
    states["orchestrator"] = "waiting"
  }

  for (const task of runningGlobal) {
    const nodeId = task.current_step
      ? matchAgentNodeId(task.current_step)
      : null
    if (nodeId) states[nodeId] = "running"
  }

  for (const task of stuckGlobal) {
    const nodeId = task.current_step
      ? matchAgentNodeId(task.current_step)
      : "orchestrator"
    states[nodeId] = "blocked"
  }

  for (const task of failedGlobal) {
    const nodeId = task.current_step
      ? matchAgentNodeId(task.current_step)
      : "orchestrator"
    if (nodeId && states[nodeId] !== "running") states[nodeId] = "blocked"
  }

  for (const err of errors) {
    const nodeId = matchAgentNodeId(err.agent)
    if (nodeId) states[nodeId] = "blocked"
  }

  // —— mind-id surfaces ——
  if (streamRunning.length > 0) {
    states["panel-agent"] = "running"
  } else if (streamTasks.some((t) => t.status === "completed")) {
    states["panel-agent"] = "completed"
  } else if (streamTasks.some((t) => t.status === "failed")) {
    states["panel-agent"] = "blocked"
  } else {
    states["panel-agent"] = "idle"
  }

  if (stuckGlobal.length > 0) {
    states["active-tasks"] = "blocked"
    states["firestore"] = "blocked"
  } else if (runningGlobal.length > 0) {
    states["active-tasks"] = "running"
    states["firestore"] = "running"
  } else if (successGlobal.length > 0) {
    states["active-tasks"] = "completed"
    states["firestore"] = "completed"
  } else if (failedGlobal.length > 0) {
    states["active-tasks"] = "blocked"
    states["firestore"] = "blocked"
  } else {
    states["active-tasks"] = "idle"
    states["firestore"] = "idle"
  }

  states["portal-mind-id"] =
    runningGlobal.length > 0 ||
    stuckGlobal.length > 0 ||
    errors.length > 0 ||
    streamRunning.length > 0
      ? "running"
      : "idle"

  states["user"] = "idle"

  const salesStates = deriveSalesNodeStatuses(sales)
  for (const [id, status] of Object.entries(salesStates)) {
    states[id] = status
  }

  if (errors.some((e) => matchAgentNodeId(e.agent) === "sales-mind-agent-bridge")) {
    states["sales-mind-agent-bridge"] = "blocked"
  } else if (agentDown) {
    states["sales-mind-agent-bridge"] = "blocked"
  } else if (runningGlobal.length > 0) {
    states["sales-mind-agent-bridge"] = "running"
  } else if (!states["sales-mind-agent-bridge"]) {
    states["sales-mind-agent-bridge"] = "idle"
  }

  return states
}
