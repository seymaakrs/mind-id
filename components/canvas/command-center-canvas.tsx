"use client"

/**
 * Komuta Merkezi Canvas
 * 4 repo'nun (mind-id, mind-agent, mindid-nocodb, customer_agent) birleşik
 * zihin haritası. Her düğüm bir bileşeni temsil eder; tıklayınca yan
 * panelde detayı açılır. Renkler durum (calisir/devam/hata/pasif)
 * bilgisini taşır.
 */

import { useCallback, useMemo, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react"
import dagre from "@dagrejs/dagre"
import "@xyflow/react/dist/style.css"
import { X, CircleDot, AlertTriangle, Pause, Loader2 } from "lucide-react"

// ─── Veri ────────────────────────────────────────────────────────────────────

type RepoKey = "mind-id" | "mind-agent" | "mindid-nocodb" | "customer_agent"
type StatusKey = "calisir" | "devam" | "hata" | "pasif"
type NodeType = "page" | "agent" | "data" | "integration" | "workflow" | "hub" | "root"

interface CanvasNodeData extends Record<string, unknown> {
  title: string
  role: string
  description: string
  type: NodeType
  status: StatusKey
  repo: RepoKey | "root"
  collaboratesWith: string[]
}

const REPO_META: Record<RepoKey, { label: string; sub: string; emoji: string }> = {
  "mind-id": { label: "MindID Panel", sub: "Salon (Kullanıcı Yüzü)", emoji: "🪟" },
  "mind-agent": { label: "Mind Agent", sub: "Mutfak (Yaratıcı Beyin)", emoji: "🧠" },
  "mindid-nocodb": { label: "NocoDB", sub: "Depo (Veri Defteri)", emoji: "📚" },
  "customer_agent": { label: "Customer Agent", sub: "Pazarlama Ekibi (Avcılar)", emoji: "🎯" },
}

const STATUS_META: Record<StatusKey, { label: string; color: string; ring: string; Icon: typeof CircleDot }> = {
  calisir: { label: "Çalışıyor", color: "text-emerald-400", ring: "ring-emerald-500/60", Icon: CircleDot },
  devam: { label: "Devam Ediyor", color: "text-amber-400", ring: "ring-amber-500/60", Icon: Loader2 },
  hata: { label: "Hata / Eksik", color: "text-rose-400", ring: "ring-rose-500/70", Icon: AlertTriangle },
  pasif: { label: "Pasif", color: "text-slate-400", ring: "ring-slate-500/50", Icon: Pause },
}

const REPO_TINT: Record<RepoKey | "root", string> = {
  "root": "bg-indigo-950/80 border-indigo-400/60",
  "mind-id": "bg-sky-950/70 border-sky-500/40",
  "mind-agent": "bg-violet-950/70 border-violet-500/40",
  "mindid-nocodb": "bg-teal-950/70 border-teal-500/40",
  "customer_agent": "bg-orange-950/70 border-orange-500/40",
}

// Düğüm verisi (Veri Çıkarıcı alt-agent çıktısı)
const RAW_NODES: Array<Omit<CanvasNodeData, "type"> & { id: string; type: NodeType }> = [
  // mind-id sayfaları
  { id: "mindid-anasayfa", repo: "mind-id", title: "Anasayfa", role: "Komuta Merkezi", description: "Şu anda baktığın canvas ekranı; tüm sistemin ana krokisi.", type: "page", status: "calisir", collaboratesWith: ["mindid-agent", "mindid-aktif-gorevler", "mindid-istatistikler"] },
  { id: "mindid-agent", repo: "mind-id", title: "Agent Sayfası", role: "Yapay Zeka Asistan Paneli", description: "Ajanlarla sohbet edip onlara iş veren ana sayfa.", type: "page", status: "calisir", collaboratesWith: ["mindagent-orchestrator", "mindid-aktif-gorevler"] },
  { id: "mindid-aktif-gorevler", repo: "mind-id", title: "Aktif Görevler", role: "Görev Takip Ekranı", description: "Şu an çalışan ve biten işlerin listelendiği yer.", type: "page", status: "calisir", collaboratesWith: ["mindid-agent", "mindagent-orchestrator"] },
  { id: "mindid-isletmeler", repo: "mind-id", title: "İşletmeler", role: "Marka ve İşletme Yönetimi", description: "Markalarını ve işletme bilgilerini yönettiğin sayfa.", type: "page", status: "calisir", collaboratesWith: ["nocodb-crm-tables", "mindagent-marketing"] },
  { id: "mindid-istatistikler", repo: "mind-id", title: "İstatistikler", role: "Performans Paneli", description: "Ajanların ve işlerin sayısal sonuçlarını gösteren panel.", type: "page", status: "calisir", collaboratesWith: ["mindid-aktif-gorevler", "nocodb-lead-database"] },
  { id: "mindid-ayarlar", repo: "mind-id", title: "Ayarlar", role: "Hesap ve Sistem Ayarları", description: "Profil, bildirim ve bağlantı ayarlarının yapıldığı sayfa.", type: "page", status: "calisir", collaboratesWith: [] },

  // mind-agent ajanları
  { id: "mindagent-orchestrator", repo: "mind-agent", title: "Orkestratör Ajan", role: "Görev Dağıtıcı (Trafik Polisi)", description: "Gelen isteği anlayıp doğru ajana yönlendiren beyin.", type: "agent", status: "calisir", collaboratesWith: ["mindagent-image", "mindagent-video", "mindagent-marketing", "mindagent-analysis", "mindid-agent"] },
  { id: "mindagent-image", repo: "mind-agent", title: "Görsel Ajan", role: "Görsel Üretim Uzmanı", description: "İstenilen konuda resim ve görsel üreten ajan (Gemini).", type: "agent", status: "calisir", collaboratesWith: ["mindagent-orchestrator", "mindagent-marketing"] },
  { id: "mindagent-video", repo: "mind-agent", title: "Video Ajan", role: "Video Üretim Uzmanı", description: "Kısa video ve reklam klipleri hazırlar (Veo, Kling, HeyGen).", type: "agent", status: "calisir", collaboratesWith: ["mindagent-orchestrator", "mindagent-marketing"] },
  { id: "mindagent-marketing", repo: "mind-agent", title: "Pazarlama Ajan", role: "Dijital Pazarlama Uzmanı (Marka + Reklam)", description: "Marka yönetimi ve reklam işlerini birlikte yürüten ajan.", type: "agent", status: "calisir", collaboratesWith: ["mindagent-orchestrator", "mindagent-image", "mindagent-video", "mindagent-analysis", "mindid-isletmeler", "customer-n8n-orchestrator"] },
  { id: "mindagent-analysis", repo: "mind-agent", title: "Analiz Ajan", role: "Veri ve Performans Analisti", description: "Sonuçları okuyup yorumlayan ve rapor çıkaran ajan.", type: "agent", status: "calisir", collaboratesWith: ["mindagent-orchestrator", "mindagent-marketing", "nocodb-lead-database"] },

  // nocodb veri
  { id: "nocodb-lead-database", repo: "mindid-nocodb", title: "Müşteri Adayı Veritabanı", role: "Lead Deposu", description: "Tüm potansiyel müşteri bilgilerinin tutulduğu veritabanı.", type: "data", status: "calisir", collaboratesWith: ["nocodb-crm-tables", "customer-n8n-orchestrator", "mindid-istatistikler"] },
  { id: "nocodb-crm-tables", repo: "mindid-nocodb", title: "CRM Tabloları", role: "Müşteri İlişkileri Kayıtları", description: "Müşteri ve işletme kayıtlarının tutulduğu tablolar.", type: "data", status: "calisir", collaboratesWith: ["nocodb-lead-database", "mindid-isletmeler"] },

  // customer_agent satış ajanları
  { id: "customer-meta-lead", repo: "customer_agent", title: "Meta Lead Ajan", role: "Facebook & Instagram Reklam Takipçisi", description: "Meta reklamlarından gelen müşteri adaylarını toplar (şu an pasif).", type: "agent", status: "pasif", collaboratesWith: ["customer-n8n-orchestrator", "nocodb-lead-database"] },
  { id: "customer-linkedin", repo: "customer_agent", title: "LinkedIn Ajan", role: "Profesyonel Ağ Avcısı", description: "LinkedIn üzerinden potansiyel müşterilere ulaşır (henüz yapılmadı).", type: "agent", status: "hata", collaboratesWith: ["customer-n8n-orchestrator", "nocodb-lead-database"] },
  { id: "customer-clay-local", repo: "customer_agent", title: "Clay Yerel Ajan", role: "Veri Zenginleştirme Uzmanı", description: "Müşteri bilgilerini Clay benzeri kaynaklarla zenginleştirir (yapılacak).", type: "agent", status: "hata", collaboratesWith: ["customer-n8n-orchestrator", "nocodb-lead-database"] },
  { id: "customer-instagram-dm", repo: "customer_agent", title: "Instagram DM Ajan", role: "Mesaj Otomasyonu", description: "Instagram özel mesajlarını otomatik yanıtlar (yapılacak).", type: "agent", status: "hata", collaboratesWith: ["customer-n8n-orchestrator", "nocodb-lead-database"] },
  { id: "customer-n8n-orchestrator", repo: "customer_agent", title: "n8n Orkestratör", role: "Satış Akış Yöneticisi", description: "Tüm satış ajanlarının iş akışını n8n ile yöneten merkez.", type: "workflow", status: "devam", collaboratesWith: ["customer-meta-lead", "customer-linkedin", "customer-clay-local", "customer-instagram-dm", "customer-mindagent-sdk", "nocodb-lead-database"] },
  { id: "customer-mindagent-sdk", repo: "customer_agent", title: "Mind-Agent SDK Köprüsü", role: "Ajan Köprüsü (Planlanan)", description: "Satış ajanlarını mind-agent altyapısına bağlayacak entegrasyon.", type: "integration", status: "devam", collaboratesWith: ["customer-n8n-orchestrator", "mindagent-orchestrator", "mindagent-marketing"] },
]

// ─── Custom Node ─────────────────────────────────────────────────────────────

function CanvasNode({ data, selected }: NodeProps<Node<CanvasNodeData>>) {
  const status = STATUS_META[data.status]
  const tint = REPO_TINT[data.repo]
  const isHub = data.type === "hub" || data.type === "root"
  const StatusIcon = status.Icon

  return (
    <div
      className={`relative rounded-xl border-2 backdrop-blur-sm shadow-lg ${tint} ${
        selected ? `ring-2 ring-offset-2 ring-offset-background ${status.ring}` : ""
      } ${isHub ? "px-5 py-3 min-w-[220px]" : "px-4 py-3 min-w-[200px] max-w-[260px]"}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !border-slate-700" />
      <Handle type="source" position={Position.Right} className="!bg-slate-500 !border-slate-700" />

      <div className="flex items-start gap-2">
        <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${status.color} ${data.status === "devam" ? "animate-spin" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-bold leading-tight ${isHub ? "text-base" : "text-sm"} text-white`}>
            {data.title}
          </div>
          <div className="text-[11px] text-slate-300/80 leading-tight mt-0.5">
            {data.role}
          </div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { canvas: CanvasNode }

// ─── Layout ──────────────────────────────────────────────────────────────────

function buildLayout(nodes: Node<CanvasNodeData>[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", nodesep: 30, ranksep: 90, marginx: 20, marginy: 20 })

  nodes.forEach((n) => g.setNode(n.id, { width: 240, height: 80 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - 120, y: pos.y - 40 } }
  })
}

function buildGraph() {
  const nodes: Node<CanvasNodeData>[] = []
  const edges: Edge[] = []

  // Root
  nodes.push({
    id: "root",
    type: "canvas",
    position: { x: 0, y: 0 },
    data: {
      title: "🎯 MindID Komuta Merkezi",
      role: "4 repo / 19 bileşen",
      description: "Tüm ekosistemin tek noktadan yönetildiği yer.",
      type: "root",
      status: "calisir",
      repo: "root",
      collaboratesWith: [],
    },
  })

  // Hub'lar (her repo için)
  ;(Object.keys(REPO_META) as RepoKey[]).forEach((repo) => {
    const meta = REPO_META[repo]
    nodes.push({
      id: `hub-${repo}`,
      type: "canvas",
      position: { x: 0, y: 0 },
      data: {
        title: `${meta.emoji} ${meta.label}`,
        role: meta.sub,
        description: `${meta.label} reposu — ${meta.sub}.`,
        type: "hub",
        status: "calisir",
        repo,
        collaboratesWith: [],
      },
    })
    edges.push({
      id: `e-root-${repo}`,
      source: "root",
      target: `hub-${repo}`,
      type: "smoothstep",
      style: { stroke: "#6366f1", strokeWidth: 2 },
      animated: false,
    })
  })

  // Alt düğümler
  RAW_NODES.forEach((raw) => {
    nodes.push({
      id: raw.id,
      type: "canvas",
      position: { x: 0, y: 0 },
      data: {
        title: raw.title,
        role: raw.role,
        description: raw.description,
        type: raw.type,
        status: raw.status,
        repo: raw.repo,
        collaboratesWith: raw.collaboratesWith,
      },
    })
    edges.push({
      id: `e-hub-${raw.id}`,
      source: `hub-${raw.repo}`,
      target: raw.id,
      type: "smoothstep",
      style: { stroke: "#475569", strokeWidth: 1.5 },
    })
  })

  // İşbirliği kenarları (kesik çizgi)
  RAW_NODES.forEach((raw) => {
    raw.collaboratesWith.forEach((targetId) => {
      const edgeId = `c-${raw.id}-${targetId}`
      const reverse = `c-${targetId}-${raw.id}`
      if (edges.some((e) => e.id === edgeId || e.id === reverse)) return
      edges.push({
        id: edgeId,
        source: raw.id,
        target: targetId,
        type: "straight",
        style: { stroke: "#64748b", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 },
      })
    })
  })

  return { nodes: buildLayout(nodes, edges.filter((e) => !e.id.startsWith("c-"))), edges }
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

function DetailDrawer({
  node,
  onClose,
  allNodes,
}: {
  node: Node<CanvasNodeData> | null
  onClose: () => void
  allNodes: Node<CanvasNodeData>[]
}) {
  if (!node) return null
  const status = STATUS_META[node.data.status]
  const StatusIcon = status.Icon
  const collaborators = allNodes.filter((n) => node.data.collaboratesWith.includes(n.id))

  return (
    <div className="absolute top-0 right-0 h-full w-[360px] bg-card border-l border-border shadow-2xl z-10 overflow-y-auto">
      <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b border-border flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {node.data.repo === "root" ? "Komuta Merkezi" : REPO_META[node.data.repo as RepoKey]?.label}
          </div>
          <h3 className="text-lg font-bold mt-1">{node.data.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{node.data.role}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className={`flex items-center gap-2 text-sm ${status.color}`}>
          <StatusIcon className={`w-4 h-4 ${node.data.status === "devam" ? "animate-spin" : ""}`} />
          <span className="font-medium">{status.label}</span>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Açıklama</p>
          <p className="text-sm leading-relaxed">{node.data.description}</p>
        </div>

        {collaborators.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Birlikte çalıştıkları ({collaborators.length})
            </p>
            <ul className="space-y-1.5">
              {collaborators.map((c) => {
                const cs = STATUS_META[c.data.status]
                const CsIcon = cs.Icon
                return (
                  <li key={c.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/40">
                    <CsIcon className={`w-3.5 h-3.5 ${cs.color}`} />
                    <span className="font-medium">{c.data.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{c.data.role}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            Tip: <span className="font-mono">{node.data.type}</span> • Repo:{" "}
            <span className="font-mono">{node.data.repo}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

function CanvasInner() {
  const { nodes: initialNodes, edges } = useMemo(() => buildGraph(), [])
  const [selectedNode, setSelectedNode] = useState<Node<CanvasNodeData> | null>(null)

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedNode(node as Node<CanvasNodeData>)
  }, [])

  // Özet sayım (üst rozet)
  const summary = useMemo(() => {
    const counts: Record<StatusKey, number> = { calisir: 0, devam: 0, hata: 0, pasif: 0 }
    RAW_NODES.forEach((n) => counts[n.status]++)
    return counts
  }, [])

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] bg-background rounded-lg border border-border overflow-hidden">
      {/* Üst özet */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-card/90 backdrop-blur px-3 py-2 rounded-lg border border-border shadow">
        <span className="text-xs font-semibold mr-2">Durum:</span>
        {(Object.keys(STATUS_META) as StatusKey[]).map((s) => {
          const meta = STATUS_META[s]
          const Icon = meta.Icon
          return (
            <span key={s} className={`flex items-center gap-1 text-xs ${meta.color}`}>
              <Icon className="w-3 h-3" />
              {summary[s]}
            </span>
          )
        })}
      </div>

      <ReactFlow
        nodes={initialNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#1e293b" />
        <Controls className="!bg-card !border-border" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(n) => {
            const data = n.data as CanvasNodeData
            const repo = data.repo
            if (repo === "root") return "#6366f1"
            if (repo === "mind-id") return "#0ea5e9"
            if (repo === "mind-agent") return "#8b5cf6"
            if (repo === "mindid-nocodb") return "#14b8a6"
            return "#f97316"
          }}
          maskColor="rgba(15,23,42,0.7)"
        />
      </ReactFlow>

      <DetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        allNodes={initialNodes}
      />
    </div>
  )
}

export function CommandCenterCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}

export default CommandCenterCanvas
