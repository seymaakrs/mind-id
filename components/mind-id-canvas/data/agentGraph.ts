/**
 * Mind ekosistemi — mind-id + mind-agent + customer_agent + NocoDB
 * Dikey soy ağacı (üstten alta): Seyma → Portal → iki dal → yapraklar
 * Durumlar anasayfada Firestore active_tasks, errors ve health-check ile türetilir.
 */

export type AgentKind =
  | "user"
  | "portal"
  | "panel"
  | "api"
  | "orchestrator"
  | "expert"
  | "workflow"
  | "sales"
  | "bridge"
  | "database"
  | "task"
  | "planned"

export type AgentBranch = "root" | "content" | "sales" | "shared"

export type AgentRepo = "mind-id" | "mind-agent" | "customer_agent" | "mindid-nocodb"

export type AgentStatus = "waiting" | "running" | "completed" | "blocked" | "idle"

export interface AgentGraphNode {
  id: string
  kind: AgentKind
  branch: AgentBranch
  repo: AgentRepo
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
    branch: "root",
    repo: "mind-id",
    label: "Seyma",
    className: "UserSession",
    subtasks: ["Komuta merkezi", "Görev & satış"],
    status: "idle",
    description: "Tüm sistemin kökü — içerik görevleri ve satış lead kontrolü buradan başlar.",
    codeRef: "mind-id · giriş / komuta merkezi",
  },
  {
    id: "portal-mind-id",
    kind: "portal",
    branch: "root",
    repo: "mind-id",
    label: "Mind Portal",
    className: "MindIDPanel",
    subtasks: ["Sidebar", "Canvas", "Agent", "Satış"],
    status: "running",
    description: "Next.js admin paneli — 4 repo ekosisteminin tek yüzü.",
    codeRef: "app/page.tsx · app/komuta-merkezi-v2",
  },
  // —— İçerik / üretim dalı ——
  {
    id: "panel-agent",
    kind: "panel",
    branch: "content",
    repo: "mind-id",
    label: "Agent Sayfası",
    className: "AgentGorevComponent",
    subtasks: ["Görev metni", "Referans", "Gönder"],
    status: "idle",
    description: "İçerik ve üretim görevleri; medya/rapor referansı eklenebilir.",
    codeRef: "components/agent/agent-gorev.tsx",
  },
  {
    id: "api-agent-task",
    kind: "api",
    branch: "content",
    repo: "mind-id",
    label: "/api/agent-task",
    className: "AgentTaskRoute",
    subtasks: ["Auth", "Firestore task", "Proxy"],
    status: "waiting",
    description: "Panel → mind-agent POST /task; görev kaydı Firestore'da açılır.",
    codeRef: "app/api/agent-task/route.ts",
  },
  {
    id: "orchestrator",
    kind: "orchestrator",
    branch: "content",
    repo: "mind-agent",
    label: "İçerik Orkestratörü",
    className: "orchestrator_agent",
    subtasks: ["Analiz", "Ajan seçimi", "Dağıtım"],
    status: "waiting",
    description: "mind-agent trafik polisi — görsel, video, pazarlama, analiz uzmanlarına iş verir.",
    codeRef: "mind-agent · orchestrator",
  },
  {
    id: "image_agent",
    kind: "expert",
    branch: "content",
    repo: "mind-agent",
    label: "Görsel Ajan",
    className: "image_agent",
    subtasks: ["Gemini", "Prompt", "URL"],
    status: "idle",
    description: "Görsel üretim uzmanı.",
    codeRef: "mind-agent/agents/image",
  },
  {
    id: "video_agent",
    kind: "expert",
    branch: "content",
    repo: "mind-agent",
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
    branch: "content",
    repo: "mind-agent",
    label: "Pazarlama Ajan",
    className: "marketing_agent",
    subtasks: ["Marka sesi", "Reklam", "Kampanya"],
    status: "idle",
    description: "Marka ve reklam metni işleri.",
    codeRef: "mind-agent/agents/marketing",
  },
  {
    id: "analysis_agent",
    kind: "expert",
    branch: "content",
    repo: "mind-agent",
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
    branch: "content",
    repo: "mind-id",
    label: "Firestore Görevler",
    className: "businesses/{id}/tasks",
    subtasks: ["pending", "running", "completed", "failed"],
    status: "waiting",
    description: "Üretim görevlerinin durumu ve sonuç metni.",
    codeRef: "lib/firebase/firestore.ts",
  },
  {
    id: "active-tasks",
    kind: "task",
    branch: "content",
    repo: "mind-id",
    label: "Aktif Görevler",
    className: "ActiveTasksPanel",
    subtasks: ["Liste", "Canlı", "Widget"],
    status: "idle",
    description: "Tüm içerik görevlerinin izlendiği panel.",
    codeRef: "components/active-tasks/active-tasks-panel.tsx",
  },
  // —— Satış dalı (customer_agent + portal) ——
  {
    id: "sales-panel",
    kind: "panel",
    branch: "sales",
    repo: "mind-id",
    label: "Satış Kontrol",
    className: "SalesDashboard",
    subtasks: ["Lead listesi", "Sıcak lead", "mind-agent tetik"],
    status: "idle",
    description: "Portal içinde satış ekibini izleme — NocoDB lead'leri ve n8n akışları buradan yönetilir.",
    codeRef: "mind-id · /satis (entegrasyon)",
  },
  {
    id: "n8n-sales-hub",
    kind: "workflow",
    branch: "sales",
    repo: "customer_agent",
    label: "n8n Satış Merkezi",
    className: "n8nCloudOrchestrator",
    subtasks: ["Webhook", "Skor", "NocoDB yaz"],
    status: "running",
    description: "customer_agent satış workflow'larının merkezi — mindidai.app.n8n.cloud.",
    codeRef: "customer_agent/n8n/workflows/",
  },
  {
    id: "sales-lead-toplama",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "Lead Toplama",
    className: "LeadToplamaAgent",
    subtasks: ["Webhook", "Skor", "NocoDB"],
    status: "running",
    description: "Generic webhook — herhangi bir kaynaktan lead alır (ACTIVE).",
    codeRef: "n8n · lead-toplama-agent.json",
  },
  {
    id: "sales-meta-lead",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "Meta Lead Ads",
    className: "MetaLeadAdsAgent",
    subtasks: ["FB Lead Form", "Sıcak lead", "Mail Seyma"],
    status: "blocked",
    description: "Facebook/Instagram reklam formundan lead (Slowdays) — App Review / PAUSED dönemleri.",
    codeRef: "n8n · meta-lead-ads-agent.json",
  },
  {
    id: "sales-takip",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "Takip Ajanı",
    className: "TakipAgent",
    subtasks: ["Takip mesajı", "Zamanlama"],
    status: "running",
    description: "Lead takip otomasyonu (ACTIVE).",
    codeRef: "n8n · takip-agent.json",
  },
  {
    id: "sales-itiraz",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "İtiraz Ajanı",
    className: "ItirazAgent",
    subtasks: ["İtiraz yanıtı", "Şablon"],
    status: "running",
    description: "Müşteri itirazlarına otomatik yanıt (ACTIVE).",
    codeRef: "n8n · itiraz-agent.json",
  },
  {
    id: "sales-upsell",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "Upsell Ajanı",
    className: "UpsellAgent",
    subtasks: ["Ek satış", "Teklif"],
    status: "running",
    description: "Mevcut müşteriye upsell (ACTIVE).",
    codeRef: "n8n · upsell-agent.json",
  },
  {
    id: "sales-referans",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "Referans Ajanı",
    className: "ReferansAgent",
    subtasks: ["Referans iste", "Ödül"],
    status: "running",
    description: "Referans programı akışı (ACTIVE).",
    codeRef: "n8n · referans-agent.json",
  },
  {
    id: "sales-mail",
    kind: "sales",
    branch: "sales",
    repo: "customer_agent",
    label: "Mail Otomasyonu",
    className: "MusteriMailOtomasyonu",
    subtasks: ["Kişiselleştir", "Gmail", "Çoklu alıcı"],
    status: "running",
    description: "Claude Trigger webhook — kişiselleştirilmiş toplu mail (ACTIVE).",
    codeRef: "n8n · musteri-mail-otomasyonu.json",
  },
  {
    id: "sales-linkedin",
    kind: "planned",
    branch: "sales",
    repo: "customer_agent",
    label: "LinkedIn Ajan",
    className: "LinkedInAgent",
    subtasks: ["Outreach", "Planlanıyor"],
    status: "blocked",
    description: "LinkedIn avcılığı — henüz ayrı workflow yok (master mimaride hedef).",
    codeRef: "customer_agent · AGENT-MIMARISI-MASTER.md",
  },
  {
    id: "sales-clay",
    kind: "planned",
    branch: "sales",
    repo: "customer_agent",
    label: "Clay Yerel",
    className: "ClayLocalAgent",
    subtasks: ["Veri zenginleştirme", "Planlanıyor"],
    status: "blocked",
    description: "Yerel işletme araması + Clay benzeri zenginleştirme — kurulmadı.",
    codeRef: "customer_agent · eksik workflow",
  },
  {
    id: "sales-igdm",
    kind: "planned",
    branch: "sales",
    repo: "customer_agent",
    label: "Instagram DM",
    className: "InstagramDMAgent",
    subtasks: ["DM bot", "Planlanıyor"],
    status: "blocked",
    description: "Instagram özel mesaj otomasyonu — henüz yok.",
    codeRef: "customer_agent · eksik workflow",
  },
  {
    id: "sales-mind-agent-bridge",
    kind: "bridge",
    branch: "sales",
    repo: "mind-agent",
    label: "Satış Köprüsü",
    className: "meta_agent · upsert_lead",
    subtasks: ["/task", "Leadler", "Etkileşimler"],
    status: "running",
    description: "n8n'den mind-agent'a geçiş — meta_agent NocoDB'ye yazar (production).",
    codeRef: "mind-agent/src/agents/sales/",
  },
  {
    id: "nocodb-leads",
    kind: "database",
    branch: "shared",
    repo: "mindid-nocodb",
    label: "NocoDB Leadler",
    className: "Leadler · Etkileşimler",
    subtasks: ["CRM", "Sıcak lead", "Bildirim"],
    status: "waiting",
    description: "Satış CRM deposu — tüm satış ajanları buraya yazar; portal okur.",
    codeRef: "mindid-nocodb · customer_agent/docs/NOCODB-SCHEMA-V2.md",
  },
]

/** Dikey soy ağacı — sadece parent→child (döngüsüz) */
export const AGENT_GRAPH_EDGES: AgentGraphEdge[] = [
  { id: "e-root-1", source: "user", target: "portal-mind-id", label: "yönetir", main: true },
  { id: "e-root-2", source: "portal-mind-id", target: "panel-agent", label: "içerik", main: true },
  { id: "e-root-3", source: "portal-mind-id", target: "sales-panel", label: "satış", main: true },
  { id: "e-c1", source: "panel-agent", target: "api-agent-task", label: "POST", main: true },
  { id: "e-c2", source: "api-agent-task", target: "orchestrator", label: "/task", main: true },
  { id: "e-c3", source: "orchestrator", target: "image_agent", main: false },
  { id: "e-c4", source: "orchestrator", target: "video_agent", main: false },
  { id: "e-c5", source: "orchestrator", target: "marketing_agent", main: false },
  { id: "e-c6", source: "orchestrator", target: "analysis_agent", main: false },
  { id: "e-c7", source: "orchestrator", target: "firestore", label: "durum", main: true },
  { id: "e-c8", source: "image_agent", target: "firestore", label: "sonuç", main: false },
  { id: "e-c9", source: "video_agent", target: "firestore", main: false },
  { id: "e-c10", source: "marketing_agent", target: "firestore", main: false },
  { id: "e-c11", source: "analysis_agent", target: "firestore", main: false },
  { id: "e-c12", source: "firestore", target: "active-tasks", label: "izle", main: true },
  { id: "e-s1", source: "sales-panel", target: "n8n-sales-hub", label: "tetikle", main: true },
  { id: "e-s2", source: "n8n-sales-hub", target: "sales-lead-toplama", main: false },
  { id: "e-s3", source: "n8n-sales-hub", target: "sales-meta-lead", main: false },
  { id: "e-s4", source: "n8n-sales-hub", target: "sales-takip", main: false },
  { id: "e-s5", source: "n8n-sales-hub", target: "sales-itiraz", main: false },
  { id: "e-s6", source: "n8n-sales-hub", target: "sales-upsell", main: false },
  { id: "e-s7", source: "n8n-sales-hub", target: "sales-referans", main: false },
  { id: "e-s8", source: "n8n-sales-hub", target: "sales-mail", main: false },
  { id: "e-s9", source: "n8n-sales-hub", target: "sales-linkedin", main: false },
  { id: "e-s10", source: "n8n-sales-hub", target: "sales-clay", main: false },
  { id: "e-s11", source: "n8n-sales-hub", target: "sales-igdm", main: false },
  { id: "e-s12", source: "n8n-sales-hub", target: "sales-mind-agent-bridge", label: "SDK", main: true },
  { id: "e-s13", source: "sales-lead-toplama", target: "nocodb-leads", main: false },
  { id: "e-s14", source: "sales-meta-lead", target: "nocodb-leads", main: false },
  { id: "e-s15", source: "sales-takip", target: "nocodb-leads", main: false },
  { id: "e-s16", source: "sales-itiraz", target: "nocodb-leads", main: false },
  { id: "e-s17", source: "sales-upsell", target: "nocodb-leads", main: false },
  { id: "e-s18", source: "sales-referans", target: "nocodb-leads", main: false },
  { id: "e-s19", source: "sales-mail", target: "nocodb-leads", main: false },
  { id: "e-s20", source: "sales-mind-agent-bridge", target: "nocodb-leads", label: "upsert", main: true },
]

export const BRANCH_LABELS: Record<AgentBranch, string> = {
  root: "Kök",
  content: "İçerik üretimi",
  sales: "Satış (customer_agent)",
  shared: "Paylaşılan",
}

export const REPO_LABELS: Record<AgentRepo, string> = {
  "mind-id": "mind-id",
  "mind-agent": "mind-agent",
  customer_agent: "customer_agent",
  "mindid-nocodb": "NocoDB",
}

export const KIND_COLORS: Record<AgentKind, string> = {
  user: "#FFFF00",
  portal: "#FBBF24",
  panel: "#FB923C",
  api: "#00FF00",
  orchestrator: "#FF8C00",
  expert: "#FF00FF",
  workflow: "#F472B6",
  sales: "#E879F9",
  bridge: "#A78BFA",
  database: "#00FFFF",
  task: "#FFFFFF",
  planned: "#64748B",
}
