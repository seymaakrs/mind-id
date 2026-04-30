"use client"

/**
 * Ekip Hiyerarşi Canvas
 * Komuta Merkezi'nin tamamlayıcısı. Bu görünüm "kim kime bağlı?" sorusuna
 * cevap verir: Patron (Seyma) → 4 repo başkanı → her repo'nun ekibi.
 * Yukarıdan-aşağı (TB) ağaç düzeni.
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
import { X, Crown, Users, User } from "lucide-react"

type RepoKey = "mind-id" | "mind-agent" | "mindid-nocodb" | "customer_agent"
type Rank = "patron" | "baskan" | "uye"

interface TeamNodeData extends Record<string, unknown> {
  title: string
  role: string
  description: string
  rank: Rank
  repo: RepoKey | "root"
  reportsTo?: string
}

const REPO_TINT: Record<RepoKey | "root", string> = {
  root: "bg-indigo-950/80 border-indigo-400/70",
  "mind-id": "bg-sky-950/70 border-sky-500/50",
  "mind-agent": "bg-violet-950/70 border-violet-500/50",
  "mindid-nocodb": "bg-teal-950/70 border-teal-500/50",
  customer_agent: "bg-orange-950/70 border-orange-500/50",
}

const RANK_META: Record<Rank, { Icon: typeof Crown; label: string; color: string }> = {
  patron: { Icon: Crown, label: "Patron", color: "text-amber-300" },
  baskan: { Icon: Users, label: "Repo Başkanı", color: "text-indigo-300" },
  uye: { Icon: User, label: "Ekip Üyesi", color: "text-slate-300" },
}

// Hiyerarşi tablosu — her satır bir kişi/ajan, kime bağlı olduğunu reportsTo ile söyler.
const TEAM: Array<{ id: string } & TeamNodeData> = [
  // Patron
  {
    id: "seyma",
    title: "👑 Seyma",
    role: "Kurucu / Patron",
    description: "Tüm ekosistemin sahibi ve karar vericisi. 4 repo'nun başkanları doğrudan ona rapor verir.",
    rank: "patron",
    repo: "root",
  },

  // Repo başkanları
  { id: "lead-mind-id", title: "🪟 MindID Panel", role: "Salon Şefi (Frontend)", description: "Seyma'nın baktığı pencere. Kullanıcı ile sistem arasındaki tüm temas noktası.", rank: "baskan", repo: "mind-id", reportsTo: "seyma" },
  { id: "lead-mind-agent", title: "🧠 Mind Agent", role: "Mutfak Şefi (Yaratıcı Beyin)", description: "Görsel, video ve pazarlama üretiminden sorumlu ajanların lideri.", rank: "baskan", repo: "mind-agent", reportsTo: "seyma" },
  { id: "lead-nocodb", title: "📚 NocoDB", role: "Depo Sorumlusu (Veri)", description: "CRM ve lead veritabanını tutan, veri defterini yöneten birim.", rank: "baskan", repo: "mindid-nocodb", reportsTo: "seyma" },
  { id: "lead-customer", title: "🎯 Customer Agent", role: "Pazarlama Şefi (Avcılar)", description: "Lead toplama ve dış kanal otomasyonlarının lideri.", rank: "baskan", repo: "customer_agent", reportsTo: "seyma" },

  // mind-id ekibi (sayfalar / modüller)
  { id: "mid-anasayfa", title: "Anasayfa Modülü", role: "Komuta Merkezi UI", description: "Şu an baktığın canvas; ana giriş ekranı.", rank: "uye", repo: "mind-id", reportsTo: "lead-mind-id" },
  { id: "mid-agent-page", title: "Agent Sayfası", role: "Sohbet Arayüzü", description: "Ajanlarla konuşulan, görev verilen panel.", rank: "uye", repo: "mind-id", reportsTo: "lead-mind-id" },
  { id: "mid-tasks", title: "Aktif Görevler", role: "Görev Takipçi", description: "Çalışan ve biten işleri listeler.", rank: "uye", repo: "mind-id", reportsTo: "lead-mind-id" },
  { id: "mid-businesses", title: "İşletmeler", role: "Marka Yöneticisi", description: "Marka ve işletme kayıtlarını yönetir.", rank: "uye", repo: "mind-id", reportsTo: "lead-mind-id" },
  { id: "mid-stats", title: "İstatistikler", role: "Performans Paneli", description: "Sayısal sonuçları gösterir.", rank: "uye", repo: "mind-id", reportsTo: "lead-mind-id" },

  // mind-agent ekibi
  { id: "ma-orch", title: "Orkestratör", role: "Trafik Polisi", description: "İsteği doğru ajana yönlendirir.", rank: "uye", repo: "mind-agent", reportsTo: "lead-mind-agent" },
  { id: "ma-image", title: "Görsel Ajan", role: "Görsel Üretici", description: "Resim üretir (Gemini).", rank: "uye", repo: "mind-agent", reportsTo: "lead-mind-agent" },
  { id: "ma-video", title: "Video Ajan", role: "Video Üretici", description: "Kısa video ve klip hazırlar (Veo, Kling, HeyGen).", rank: "uye", repo: "mind-agent", reportsTo: "lead-mind-agent" },
  { id: "ma-marketing", title: "Pazarlama Ajan", role: "Marka + Reklam", description: "Marka yönetimi ve reklam işleri.", rank: "uye", repo: "mind-agent", reportsTo: "lead-mind-agent" },
  { id: "ma-analysis", title: "Analiz Ajan", role: "Veri Analisti", description: "Sonuçları okuyup rapor çıkarır.", rank: "uye", repo: "mind-agent", reportsTo: "lead-mind-agent" },

  // nocodb ekibi
  { id: "no-leads", title: "Lead Veritabanı", role: "Müşteri Adayı Deposu", description: "Tüm potansiyel müşteri kayıtları.", rank: "uye", repo: "mindid-nocodb", reportsTo: "lead-nocodb" },
  { id: "no-crm", title: "CRM Tabloları", role: "Müşteri Kayıtları", description: "Müşteri ve işletme tabloları.", rank: "uye", repo: "mindid-nocodb", reportsTo: "lead-nocodb" },

  // customer_agent ekibi
  { id: "ca-n8n", title: "n8n Orkestratör", role: "Akış Yöneticisi", description: "Satış ajanlarının iş akışı merkezi.", rank: "uye", repo: "customer_agent", reportsTo: "lead-customer" },
  { id: "ca-meta", title: "Meta Lead Ajan", role: "FB/IG Reklam Takipçisi", description: "Meta reklam leadlerini toplar (pasif).", rank: "uye", repo: "customer_agent", reportsTo: "lead-customer" },
  { id: "ca-linkedin", title: "LinkedIn Ajan", role: "Profesyonel Avcı", description: "LinkedIn üzerinden lead toplar (planlanan).", rank: "uye", repo: "customer_agent", reportsTo: "lead-customer" },
  { id: "ca-clay", title: "Clay Yerel Ajan", role: "Veri Zenginleştirici", description: "Lead bilgisini Clay benzeri kaynaklarla zenginleştirir.", rank: "uye", repo: "customer_agent", reportsTo: "lead-customer" },
  { id: "ca-ig-dm", title: "Instagram DM Ajan", role: "DM Otomasyonu", description: "IG özel mesajlarını otomatik yanıtlar (planlanan).", rank: "uye", repo: "customer_agent", reportsTo: "lead-customer" },
  { id: "ca-sdk", title: "Mind-Agent SDK Köprüsü", role: "Ajan Köprüsü", description: "Satış ajanlarını mind-agent altyapısına bağlar (planlanan).", rank: "uye", repo: "customer_agent", reportsTo: "lead-customer" },
]

function TeamNode({ data, selected }: NodeProps<Node<TeamNodeData>>) {
  const tint = REPO_TINT[data.repo]
  const meta = RANK_META[data.rank]
  const RankIcon = meta.Icon
  const isPatron = data.rank === "patron"
  const isBaskan = data.rank === "baskan"

  return (
    <div
      className={`relative rounded-xl border-2 backdrop-blur-sm shadow-lg ${tint} ${
        selected ? "ring-2 ring-offset-2 ring-offset-background ring-indigo-400/70" : ""
      } ${isPatron ? "px-6 py-4 min-w-[260px]" : isBaskan ? "px-5 py-3 min-w-[220px]" : "px-4 py-2.5 min-w-[200px] max-w-[240px]"}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !border-slate-700" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !border-slate-700" />

      <div className="flex items-start gap-2">
        <RankIcon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-bold leading-tight text-white ${isPatron ? "text-lg" : isBaskan ? "text-base" : "text-sm"}`}>
            {data.title}
          </div>
          <div className="text-[11px] text-slate-300/80 leading-tight mt-0.5">{data.role}</div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { team: TeamNode }

function buildLayout(nodes: Node<TeamNodeData>[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 80, marginx: 20, marginy: 20 })

  nodes.forEach((n) => g.setNode(n.id, { width: 230, height: 80 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - 115, y: pos.y - 40 } }
  })
}

function buildTree() {
  const nodes: Node<TeamNodeData>[] = TEAM.map((t) => ({
    id: t.id,
    type: "team",
    position: { x: 0, y: 0 },
    data: {
      title: t.title,
      role: t.role,
      description: t.description,
      rank: t.rank,
      repo: t.repo,
      reportsTo: t.reportsTo,
    },
  }))

  const edges: Edge[] = TEAM.filter((t) => t.reportsTo).map((t) => ({
    id: `e-${t.reportsTo}-${t.id}`,
    source: t.reportsTo!,
    target: t.id,
    type: "smoothstep",
    style: {
      stroke: t.rank === "baskan" ? "#6366f1" : "#475569",
      strokeWidth: t.rank === "baskan" ? 2 : 1.5,
    },
  }))

  return { nodes: buildLayout(nodes, edges), edges }
}

function DetailDrawer({
  node,
  onClose,
  allNodes,
}: {
  node: Node<TeamNodeData> | null
  onClose: () => void
  allNodes: Node<TeamNodeData>[]
}) {
  if (!node) return null
  const meta = RANK_META[node.data.rank]
  const RankIcon = meta.Icon
  const boss = node.data.reportsTo ? allNodes.find((n) => n.id === node.data.reportsTo) : null
  const subordinates = allNodes.filter((n) => n.data.reportsTo === node.id)

  return (
    <div className="absolute top-0 right-0 h-full w-[360px] bg-card border-l border-border shadow-2xl z-10 overflow-y-auto">
      <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b border-border flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`text-xs uppercase tracking-wider flex items-center gap-1 ${meta.color}`}>
            <RankIcon className="w-3.5 h-3.5" />
            {meta.label}
          </div>
          <h3 className="text-lg font-bold mt-1">{node.data.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{node.data.role}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Açıklama</p>
          <p className="text-sm leading-relaxed">{node.data.description}</p>
        </div>

        {boss && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bağlı olduğu</p>
            <div className="text-sm p-2 rounded bg-muted/40 font-medium">{boss.data.title}</div>
          </div>
        )}

        {subordinates.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Ekibi ({subordinates.length})
            </p>
            <ul className="space-y-1.5">
              {subordinates.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/40">
                  <span className="font-medium">{s.data.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{s.data.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            Repo: <span className="font-mono">{node.data.repo}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function TeamInner() {
  const { nodes: initialNodes, edges } = useMemo(() => buildTree(), [])
  const [selected, setSelected] = useState<Node<TeamNodeData> | null>(null)

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelected(node as Node<TeamNodeData>)
  }, [])

  const summary = useMemo(() => {
    const counts: Record<Rank, number> = { patron: 0, baskan: 0, uye: 0 }
    TEAM.forEach((t) => counts[t.rank]++)
    return counts
  }, [])

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] bg-background rounded-lg border border-border overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-3 bg-card/90 backdrop-blur px-3 py-2 rounded-lg border border-border shadow">
        <span className="text-xs font-semibold">Ekip:</span>
        {(Object.keys(RANK_META) as Rank[]).map((r) => {
          const m = RANK_META[r]
          const Icon = m.Icon
          return (
            <span key={r} className={`flex items-center gap-1 text-xs ${m.color}`}>
              <Icon className="w-3 h-3" />
              {summary[r]} {m.label}
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
            const data = n.data as TeamNodeData
            if (data.repo === "root") return "#6366f1"
            if (data.repo === "mind-id") return "#0ea5e9"
            if (data.repo === "mind-agent") return "#8b5cf6"
            if (data.repo === "mindid-nocodb") return "#14b8a6"
            return "#f97316"
          }}
          maskColor="rgba(15,23,42,0.7)"
        />
      </ReactFlow>

      <DetailDrawer node={selected} onClose={() => setSelected(null)} allNodes={initialNodes} />
    </div>
  )
}

export function TeamHierarchyCanvas() {
  return (
    <ReactFlowProvider>
      <TeamInner />
    </ReactFlowProvider>
  )
}

export default TeamHierarchyCanvas
