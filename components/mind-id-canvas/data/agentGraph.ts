/**
 * MindID + mind-agent ekosistemi — kod analizi ve CLAUDE.md / API rotalarından türetilmiş graf.
 * Canlı durum mock timer ile güncellenir (ileride Firestore bağlanabilir).
 */

export type AgentKind =
  | "user"
  | "orchestrator"
  | "expert"
  | "api"
  | "database"
  | "panel"
  | "task"

export type AgentStatus = "waiting" | "running" | "completed" | "blocked" | "idle"

export interface AgentGraphNode {
  id: string
  kind: AgentKind
  label: string
  className: string
  subtasks: string[]
  status: AgentStatus
  description: string
  codeRef: string
}

export interface AgentGraphEdge {
  id: string
  source: string
  target: string
  label?: string
  main?: boolean
}

export const AGENT_GRAPH_NODES: AgentGraphNode[] = [
  {
    id: "user",
    kind: "user",
    label: "Kullanıcı (Seyma)",
    className: "UserSession",
    subtasks: ["Görev metni", "Referans ekleme"],
    status: "idle",
    description: "Agent sayfasında görev yazar; medya/rapor referansı ekleyebilir.",
    codeRef: "components/agent/agent-gorev.tsx",
  },
  {
    id: "panel-agent",
    kind: "panel",
    label: "Agent Sayfası",
    className: "AgentGorevComponent",
    subtasks: ["Form", "Gönder", "Referans kuyruğu"],
    status: "idle",
    description: "MindID panel arayüzü; isteği API'ye iletir.",
    codeRef: "components/agent/agent-gorev.tsx · hooks/useAgentTask.ts",
  },
  {
    id: "api-agent-task",
    kind: "api",
    label: "/api/agent-task",
    className: "AgentTaskRoute",
    subtasks: ["Auth", "Firestore task", "mind-agent proxy"],
    status: "waiting",
    description: "Next.js proxy → mind-agent POST /task; görev kaydı Firestore'da açılır.",
    codeRef: "app/api/agent-task/route.ts",
  },
  {
    id: "orchestrator",
    kind: "orchestrator",
    label: "Orkestratör",
    className: "orchestrator_agent",
    subtasks: ["Görev analizi", "Ajan seçimi", "Dağıtım"],
    status: "waiting",
    description: "mind-agent trafik polisi; uzman ajanlara iş dağıtır.",
    codeRef: "mind-agent (harici repo) · types/workflow.ts",
  },
  {
    id: "image_agent",
    kind: "expert",
    label: "Görsel Ajan",
    className: "image_agent",
    subtasks: ["Gemini görsel", "Prompt", "URL çıktı"],
    status: "idle",
    description: "Görsel üretim uzmanı.",
    codeRef: "mind-agent/agents/image",
  },
  {
    id: "video_agent",
    kind: "expert",
    label: "Video Ajan",
    className: "video_agent",
    subtasks: ["Veo", "Kling", "HeyGen"],
    status: "idle",
    description: "Video üretim uzmanı.",
    codeRef: "mind-agent/agents/video",
  },
  {
    id: "marketing_agent",
    kind: "expert",
    label: "Pazarlama Ajan",
    className: "marketing_agent",
    subtasks: ["Marka sesi", "Reklam metni", "Kampanya"],
    status: "idle",
    description: "Marka + reklam işleri.",
    codeRef: "mind-agent/agents/marketing",
  },
  {
    id: "analysis_agent",
    kind: "expert",
    label: "Analiz Ajan",
    className: "analysis_agent",
    subtasks: ["Rapor", "Metrik", "Yorum"],
    status: "idle",
    description: "Performans analizi ve rapor.",
    codeRef: "mind-agent/agents/analysis",
  },
  {
    id: "firestore",
    kind: "database",
    label: "Firestore",
    className: "businesses/{id}/tasks",
    subtasks: ["pending", "running", "completed", "failed"],
    status: "waiting",
    description: "Görev durumu ve sonuç metni.",
    codeRef: "lib/firebase/firestore.ts · types/tasks.ts",
  },
  {
    id: "active-tasks",
    kind: "task",
    label: "Aktif Görevler",
    className: "ActiveTasksPanel",
    subtasks: ["Liste", "Canlı güncelleme", "Widget"],
    status: "idle",
    description: "Tüm görevlerin izlendiği panel.",
    codeRef: "components/active-tasks/active-tasks-panel.tsx · contexts/ActiveTasksContext.tsx",
  },
]

export const AGENT_GRAPH_EDGES: AgentGraphEdge[] = [
  { id: "e1", source: "user", target: "panel-agent", label: "görev yazar", main: true },
  { id: "e2", source: "panel-agent", target: "api-agent-task", label: "POST", main: true },
  { id: "e3", source: "api-agent-task", target: "orchestrator", label: "/task", main: true },
  { id: "e4", source: "orchestrator", target: "image_agent", label: "dağıtır", main: false },
  { id: "e5", source: "orchestrator", target: "video_agent", label: "dağıtır", main: false },
  { id: "e6", source: "orchestrator", target: "marketing_agent", label: "dağıtır", main: false },
  { id: "e7", source: "orchestrator", target: "analysis_agent", label: "dağıtır", main: false },
  { id: "e8", source: "image_agent", target: "firestore", label: "sonuç", main: false },
  { id: "e9", source: "video_agent", target: "firestore", label: "sonuç", main: false },
  { id: "e10", source: "marketing_agent", target: "firestore", label: "sonuç", main: false },
  { id: "e11", source: "analysis_agent", target: "firestore", label: "sonuç", main: false },
  { id: "e12", source: "orchestrator", target: "firestore", label: "durum", main: true },
  { id: "e13", source: "firestore", target: "active-tasks", label: "izle", main: true },
]

export const KIND_COLORS: Record<AgentKind, string> = {
  user: "#FFFF00",
  orchestrator: "#FF8C00",
  expert: "#FF00FF",
  api: "#00FF00",
  database: "#00FFFF",
  panel: "#FB923C",
  task: "#FFFFFF",
}
