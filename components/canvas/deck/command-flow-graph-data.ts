import type { StatusKey } from "../topology/types"

export interface CommandFlowNodeDef {
  id: string
  title: string
  role: string
  description: string
  step: number
  color: string
  visual: "ghost" | "leaf"
  status: StatusKey
  agentKey?: string
  tag?: string
}

export const COMMAND_FLOW_MAIN: CommandFlowNodeDef[] = [
  {
    id: "cf-user",
    step: 1,
    title: "Sen (Seyma)",
    role: "Komutu başlatan",
    tag: "MindID kullanıcısı",
    description:
      "Agent sayfasında görev metnini yazarsın. İstersen medya, rapor veya geçmiş görev referansı eklersin.",
    color: "#facc15",
    visual: "ghost",
    status: "calisir",
  },
  {
    id: "cf-agent-page",
    step: 2,
    title: "Agent Sayfası",
    role: "MindID Panel · arayüz",
    tag: "mind-id",
    description:
      "Gönder’e basınca panel isteği hazırlar: işletme, görev metni, referanslar. Sonra API katmanına iletir.",
    color: "#fb923c",
    visual: "ghost",
    status: "calisir",
  },
  {
    id: "cf-api",
    step: 3,
    title: "/api/agent-task",
    role: "Sunucu köprüsü",
    tag: "Next.js API",
    description:
      "Proxy görevi: mind-agent /task endpoint’ine POST. Aynı anda Firestore’da businesses/{id}/tasks altında görev kaydı açılır.",
    color: "#fdba74",
    visual: "leaf",
    status: "calisir",
  },
  {
    id: "cf-orchestrator",
    step: 4,
    title: "Orkestratör Ajan",
    role: "mind-agent · trafik polisi",
    tag: "orchestrator",
    description:
      "Firestore’daki görevi okur. Görevi anlar; Görsel, Video, Pazarlama veya Analiz ajanından birine — gerekirse birkaçına — işi dağıtır.",
    color: "#f472b6",
    visual: "ghost",
    status: "calisir",
  },
  {
    id: "cf-firestore",
    step: 6,
    title: "Firestore",
    role: "Görev defteri + sonuç",
    tag: "mind-id veritabanı",
    description:
      "Durum: pending → running → completed / failed. Sonuç metni, hata mesajı ve zaman damgaları burada tutulur.",
    color: "#4ade80",
    visual: "ghost",
    status: "calisir",
  },
  {
    id: "cf-active-tasks",
    step: 7,
    title: "Aktif Görevler",
    role: "MindID Panel · izleme",
    tag: "mind-id",
    description:
      "Tüm işletmelerdeki çalışan ve biten görevleri listeler. Agent sohbetinde de aynı görevin sonucunu görürsün.",
    color: "#fb923c",
    visual: "ghost",
    status: "calisir",
  },
]

export const COMMAND_FLOW_AGENTS: CommandFlowNodeDef[] = [
  {
    id: "cf-image",
    step: 5,
    title: "Görsel Ajan",
    role: "Uzman ajan · üretim",
    agentKey: "image_agent",
    tag: "Gemini görsel",
    description: "Orkestratörden gelen görsel işlerini yapar: prompt, üretim, çıktı URL.",
    color: "#f472b6",
    visual: "leaf",
    status: "calisir",
  },
  {
    id: "cf-video",
    step: 5,
    title: "Video Ajan",
    role: "Uzman ajan · üretim",
    agentKey: "video_agent",
    tag: "Veo · Kling · HeyGen",
    description: "Kısa video, reklam klibi ve avatar tabanlı videolar üretir.",
    color: "#e879f9",
    visual: "leaf",
    status: "calisir",
  },
  {
    id: "cf-marketing",
    step: 5,
    title: "Pazarlama Ajan",
    role: "Uzman ajan · marka + reklam",
    agentKey: "marketing_agent",
    tag: "marka & kampanya",
    description: "Marka sesi, reklam metni, kampanya fikirleri; görsel/video ile birlikte çalışabilir.",
    color: "#f9a8d4",
    visual: "leaf",
    status: "calisir",
  },
  {
    id: "cf-analysis",
    step: 5,
    title: "Analiz Ajan",
    role: "Uzman ajan · rapor",
    agentKey: "analysis_agent",
    tag: "performans",
    description: "Metrikleri okur, rapor ve yorum üretir; NocoDB / istatistik verisiyle ilişkilidir.",
    color: "#fbcfe8",
    visual: "leaf",
    status: "calisir",
  },
]

export const AGENTS_ZONE_LABEL = {
  id: "cf-agents-zone",
  title: "↓ Uzman ajanlar (mind-agent)",
  subtitle:
    "Orkestratör görevi okuduktan sonra aşağıdakilerden birine veya birkaçına yönlendirir. Her biri işi yapıp sonucu Firestore’a yazar.",
}
