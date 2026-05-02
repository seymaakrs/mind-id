"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodesChange,
  applyNodeChanges,
} from "@xyflow/react"
import dagre from "@dagrejs/dagre"
import "@xyflow/react/dist/style.css"
import { X, Plus, Edit2, Trash2, Save, Database, Crown, RotateCcw } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "active" | "building" | "planned" | "passive"
type AgentType = "founder" | "orchestrator" | "agent" | "data" | "workflow" | "integration"

export interface TeamMember {
  id: string
  name: string
  humanRole: string
  agentRole: string
  quote: string
  tools: string[]
  color: string
  repo: "mind-agent" | "customer_agent" | "mindid-nocodb" | "mind-id" | "root"
  reportsTo: string | null
  status: AgentStatus
  type: AgentType
}

interface NodeData extends Record<string, unknown> {
  member: TeamMember
  editMode: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

// ─── Default Team Data ────────────────────────────────────────────────────────

export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: "seyma",
    name: "Şeyma",
    humanRole: "Kurucu & CEO",
    agentRole: "Sistem Sahibi",
    quote: "Brief verir, onaylar",
    tools: [],
    color: "#9d174d",
    repo: "root",
    reportsTo: null,
    status: "active",
    type: "founder",
  },
  {
    id: "olcay",
    name: "Olcay",
    humanRole: "Ajans Müdürü",
    agentRole: "Orchestrator Agent",
    quote: "Brief okur, ekibe dagitir",
    tools: ["Claude 4", "Prompt Router"],
    color: "#4338ca",
    repo: "mind-agent",
    reportsTo: "seyma",
    status: "active",
    type: "orchestrator",
  },
  {
    id: "defne",
    name: "Defne",
    humanRole: "Görsel Tasarimci",
    agentRole: "Image Agent",
    quote: "Cizim stüdyosu",
    tools: ["Gemini 2.5 Flash", "fal.ai"],
    color: "#065f46",
    repo: "mind-agent",
    reportsTo: "olcay",
    status: "active",
    type: "agent",
  },
  {
    id: "toprak",
    name: "Toprak",
    humanRole: "Motion Designer",
    agentRole: "Video Agent",
    quote: "Hareket ve ses üretir",
    tools: ["Veo", "Kling", "HeyGen", "MMAudio"],
    color: "#065f46",
    repo: "mind-agent",
    reportsTo: "olcay",
    status: "active",
    type: "agent",
  },
  {
    id: "selin",
    name: "Selin",
    humanRole: "Sosyal Medya Sorumlusu",
    agentRole: "Marketing Agent",
    quote: "Marka sesi ve reklam",
    tools: ["Late API", "Instagram", "Meta Ads"],
    color: "#1e40af",
    repo: "mind-agent",
    reportsTo: "olcay",
    status: "active",
    type: "agent",
  },
  {
    id: "kaan",
    name: "Kaan",
    humanRole: "Stratejist ve Arastirmaci",
    agentRole: "Analysis Agent",
    quote: "Veri okur, rapor cikarir",
    tools: ["Serper.dev", "SEO", "Web scraping"],
    color: "#92400e",
    repo: "mind-agent",
    reportsTo: "olcay",
    status: "active",
    type: "agent",
  },
  {
    id: "mert",
    name: "Mert",
    humanRole: "Satis Akis Yöneticisi",
    agentRole: "n8n Orchestrator",
    quote: "Satis pipeline yürütür",
    tools: ["n8n", "Webhook", "API Bridge"],
    color: "#6d28d9",
    repo: "customer_agent",
    reportsTo: "seyma",
    status: "building",
    type: "workflow",
  },
  {
    id: "zeynep",
    name: "Zeynep",
    humanRole: "Reklam Takipcisi",
    agentRole: "Meta Lead Agent",
    quote: "Facebook ve IG lead toplar",
    tools: ["Meta Ads API", "Webhook"],
    color: "#374151",
    repo: "customer_agent",
    reportsTo: "mert",
    status: "passive",
    type: "agent",
  },
  {
    id: "emre",
    name: "Emre",
    humanRole: "Profesyonel Ag Avcisi",
    agentRole: "LinkedIn Agent",
    quote: "B2B lead arar",
    tools: ["LinkedIn API"],
    color: "#374151",
    repo: "customer_agent",
    reportsTo: "mert",
    status: "planned",
    type: "agent",
  },
  {
    id: "ayse",
    name: "Ayse",
    humanRole: "Veri Zenginlestirme",
    agentRole: "Clay Local Agent",
    quote: "Müsteri profilini doldurur",
    tools: ["Clay", "Clearbit"],
    color: "#374151",
    repo: "customer_agent",
    reportsTo: "mert",
    status: "planned",
    type: "agent",
  },
  {
    id: "berk",
    name: "Berk",
    humanRole: "Mesaj Otomasyonu",
    agentRole: "Instagram DM Agent",
    quote: "IG DM otomatik yanitlar",
    tools: ["Instagram Graph API"],
    color: "#374151",
    repo: "customer_agent",
    reportsTo: "mert",
    status: "planned",
    type: "agent",
  },
  {
    id: "firebase",
    name: "Firebase",
    humanRole: "Sirket Arsivi",
    agentRole: "Veri Katlani",
    quote: "Her dosya, her gecmis burada",
    tools: ["Firestore", "Auth", "Storage"],
    color: "#b45309",
    repo: "mindid-nocodb",
    reportsTo: null,
    status: "active",
    type: "data",
  },
]

const STATUS_CONFIG: Record<AgentStatus, { label: string; dot: string; badge: string }> = {
  active: { label: "Aktif", dot: "bg-emerald-400", badge: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" },
  building: { label: "Gelistiriliyor", dot: "bg-amber-400 animate-pulse", badge: "bg-amber-900/40 text-amber-300 border-amber-700/40" },
  planned: { label: "Planlandi", dot: "bg-slate-400", badge: "bg-slate-800/60 text-slate-400 border-slate-600/40" },
  passive: { label: "Pasif", dot: "bg-slate-500", badge: "bg-slate-800/60 text-slate-500 border-slate-600/40" },
}

const REPO_COLORS: Record<string, string> = {
  root: "#6366f1",
  "mind-agent": "#8b5cf6",
  customer_agent: "#f97316",
  "mindid-nocodb": "#14b8a6",
  "mind-id": "#0ea5e9",
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function buildLayout(
  members: TeamMember[],
  editMode: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 120, marginx: 40, marginy: 40 })

  members.forEach((m) => g.setNode(m.id, { width: 190, height: 170 }))
  members.forEach((m) => {
    if (m.reportsTo && members.find((x) => x.id === m.reportsTo)) {
      g.setEdge(m.reportsTo, m.id)
    }
  })

  const dataIds = members.filter((m) => m.type === "data").map((m) => m.id)
  const leafIds = members.filter((m) => m.type !== "data" && m.type !== "founder" && m.reportsTo !== null).map((m) => m.id)
  dataIds.forEach((did) => {
    leafIds.slice(0, 3).forEach((lid) => {
      if (!g.hasEdge(lid, did)) g.setEdge(lid, did)
    })
  })

  dagre.layout(g)

  const nodes: Node<NodeData>[] = members.map((m) => {
    const pos = g.node(m.id)
    return {
      id: m.id,
      type: "teamMember",
      position: pos ? { x: pos.x - 95, y: pos.y - 85 } : { x: 0, y: 0 },
      data: { member: m, editMode, onEdit, onDelete },
    }
  })

  const edges: Edge[] = []

  members.forEach((m) => {
    if (m.reportsTo && members.find((x) => x.id === m.reportsTo)) {
      edges.push({
        id: `e-${m.reportsTo}-${m.id}`,
        source: m.reportsTo,
        target: m.id,
        type: "smoothstep",
        style: { stroke: REPO_COLORS[m.repo] ?? "#6366f1", strokeWidth: 2 },
      })
    }
  })

  const crossEdges: Array<[string, string, string]> = [
    ["selin", "defne", "isbirligi"],
    ["selin", "toprak", "isbirligi"],
    ["mert", "olcay", "SDK koprusu"],
  ]
  crossEdges.forEach(([src, tgt, label]) => {
    if (members.find((m) => m.id === src) && members.find((m) => m.id === tgt)) {
      edges.push({
        id: `collab-${src}-${tgt}`,
        source: src,
        target: tgt,
        type: "straight",
        style: { stroke: "#64748b", strokeWidth: 1.5, strokeDasharray: "5 5", opacity: 0.55 },
        label,
        labelStyle: { fill: "#94a3b8", fontSize: 10 },
      })
    }
  })

  dataIds.forEach((did) => {
    members.filter((m) => m.type !== "data" && m.type !== "founder").forEach((m) => {
      edges.push({
        id: `data-${m.id}-${did}`,
        source: m.id,
        target: did,
        type: "straight",
        style: { stroke: "#475569", strokeWidth: 1, strokeDasharray: "3 6", opacity: 0.25 },
      })
    })
  })

  return { nodes, edges }
}

// ─── Person Avatar ────────────────────────────────────────────────────────────

function PersonAvatar({ color, size = 52 }: { color: string; size?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      <div className="rounded-full border-2 border-white/20" style={{ width: size * 0.42, height: size * 0.42, background: color }} />
      <div className="rounded-t-full border-2 border-b-0 border-white/20" style={{ width: size * 0.72, height: size * 0.46, background: color, marginTop: 2 }} />
    </div>
  )
}

// ─── Team Member Node — module level (same pattern as existing canvas) ────────

function TeamMemberNode({ data }: NodeProps<Node<NodeData>>) {
  const { member: m, editMode, onEdit, onDelete } = data
  const status = STATUS_CONFIG[m.status]
  const isData = m.type === "data"
  const isFounder = m.type === "founder"

  return (
    <div className={`relative flex flex-col items-center select-none ${isFounder ? "scale-110" : ""}`} style={{ width: 190 }}>
      <Handle type="target" position={Position.Top} className="!bg-slate-600 !border-slate-800 !w-2 !h-2 !opacity-60" />

      <div className="relative mb-1.5">
        {isData ? (
          <div className="w-14 h-14 rounded-xl border-2 border-white/20 flex items-center justify-center shadow" style={{ background: m.color }}>
            <Database className="w-7 h-7 text-white/90" />
          </div>
        ) : isFounder ? (
          <div className="relative">
            <PersonAvatar color={m.color} size={54} />
            <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400" />
          </div>
        ) : (
          <PersonAvatar color={m.color} size={54} />
        )}

        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${status.dot}`} />

        {editMode && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button className="w-5 h-5 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow" onClick={(e) => { e.stopPropagation(); onEdit(m.id) }} title="Duzenle">
              <Edit2 className="w-2.5 h-2.5 text-white" />
            </button>
            {m.id !== "seyma" && (
              <button className="w-5 h-5 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center shadow" onClick={(e) => { e.stopPropagation(); onDelete(m.id) }} title="Sil">
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="text-center px-1.5">
        <div className="font-bold text-sm text-white leading-tight">{m.name}</div>
        <div className="text-[11px] text-slate-300 leading-snug mt-0.5">{m.humanRole}</div>
        <div className="text-[10px] text-slate-500 leading-snug">({m.agentRole})</div>
        {m.quote && <div className="text-[10px] text-slate-500 italic mt-0.5">{m.quote}</div>}
      </div>

      {m.tools.length > 0 && (
        <div className="mt-1.5 px-2 py-1 rounded-lg border text-[10px] text-center max-w-[175px]" style={{ background: `${m.color}15`, borderColor: `${m.color}30`, color: "#94a3b8" }}>
          {m.tools.join(" · ")}
        </div>
      )}

      <div className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wide ${status.badge}`}>{status.label}</div>
      <div className="mt-0.5 text-[9px] font-mono opacity-40" style={{ color: REPO_COLORS[m.repo] ?? "#6366f1" }}>{m.repo}</div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !border-slate-800 !w-2 !h-2 !opacity-60" />
    </div>
  )
}

const nodeTypes = { teamMember: TeamMemberNode }

// ─── Edit / Add Modal ─────────────────────────────────────────────────────────

type MemberFormData = Omit<TeamMember, "id">

const EMPTY_MEMBER: MemberFormData = {
  name: "", humanRole: "", agentRole: "", quote: "", tools: [],
  color: "#6366f1", repo: "mind-agent", reportsTo: "olcay", status: "planned", type: "agent",
}

function MemberModal({ title, initial, allMembers, onSave, onClose }: {
  title: string
  initial: MemberFormData
  allMembers: TeamMember[]
  onSave: (data: MemberFormData) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<MemberFormData>(initial)
  const [toolsStr, setToolsStr] = useState(initial.tools.join(", "))

  function setField(k: keyof MemberFormData, v: MemberFormData[keyof MemberFormData]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  const cls = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
  const lbl = "block text-[11px] text-muted-foreground mb-1 uppercase tracking-wide font-medium"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Isim *</label>
              <input className={cls} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Defne" />
            </div>
            <div>
              <label className={lbl}>Renk</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setField("color", e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border border-border bg-muted p-0.5" />
                <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
              </div>
            </div>
          </div>
          <div><label className={lbl}>Insan Rolü</label><input className={cls} value={form.humanRole} onChange={(e) => setField("humanRole", e.target.value)} placeholder="Görsel Tasarimci" /></div>
          <div><label className={lbl}>Ajan Rolü</label><input className={cls} value={form.agentRole} onChange={(e) => setField("agentRole", e.target.value)} placeholder="Image Agent" /></div>
          <div><label className={lbl}>Motto</label><input className={cls} value={form.quote} onChange={(e) => setField("quote", e.target.value)} placeholder="Kisa bir motto..." /></div>
          <div><label className={lbl}>Araclar (virgülle ayir)</label><input className={cls} value={toolsStr} onChange={(e) => setToolsStr(e.target.value)} placeholder="Gemini, fal.ai" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Repo</label>
              <select className={cls} value={form.repo} onChange={(e) => setField("repo", e.target.value as TeamMember["repo"])}>
                <option value="mind-agent">mind-agent</option>
                <option value="customer_agent">customer_agent</option>
                <option value="mindid-nocodb">mindid-nocodb</option>
                <option value="mind-id">mind-id</option>
                <option value="root">root</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Tür</label>
              <select className={cls} value={form.type} onChange={(e) => setField("type", e.target.value as AgentType)}>
                <option value="agent">agent</option>
                <option value="orchestrator">orchestrator</option>
                <option value="workflow">workflow</option>
                <option value="data">data</option>
                <option value="integration">integration</option>
                <option value="founder">founder</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Raporladigi</label>
              <select className={cls} value={form.reportsTo ?? ""} onChange={(e) => setField("reportsTo", e.target.value || null)}>
                <option value="">— Bagimsiz —</option>
                {allMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Durum</label>
              <select className={cls} value={form.status} onChange={(e) => setField("status", e.target.value as AgentStatus)}>
                <option value="active">Aktif</option>
                <option value="building">Gelistiriliyor</option>
                <option value="planned">Planlandi</option>
                <option value="passive">Pasif</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-border sticky bottom-0 bg-card">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Iptal</button>
          <button
            onClick={() => { if (!form.name.trim()) return; onSave({ ...form, tools: toolsStr.split(",").map((t) => t.trim()).filter(Boolean) }) }}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 z-10 bg-card/90 backdrop-blur border border-border rounded-xl p-3 text-[11px] space-y-1.5 shadow-lg">
      <div className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1">Durum</div>
      {(Object.entries(STATUS_CONFIG) as [AgentStatus, (typeof STATUS_CONFIG)[AgentStatus]][]).map(([, cfg]) => (
        <div key={cfg.label} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
          <span className="text-muted-foreground">{cfg.label}</span>
        </div>
      ))}
      <div className="border-t border-border pt-1.5 mt-0.5 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Repo</div>
      {Object.entries(REPO_COLORS).map(([repo, color]) => (
        <div key={repo} className="flex items-center gap-2">
          <span className="w-2.5 h-2 rounded-sm shrink-0" style={{ background: color }} />
          <span className="text-muted-foreground font-mono">{repo}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Canvas Inner ─────────────────────────────────────────────────────────────

const LS_KEY = "team-hierarchy-members-v1"

function TeamCanvasInner() {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    if (typeof window === "undefined") return DEFAULT_TEAM
    try {
      const saved = localStorage.getItem(LS_KEY)
      return saved ? (JSON.parse(saved) as TeamMember[]) : DEFAULT_TEAM
    } catch {
      return DEFAULT_TEAM
    }
  })
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})

  const handleEdit = useCallback((id: string) => setEditingId(id), [])
  const handleDelete = useCallback((id: string) => setMembers((prev) => prev.filter((m) => m.id !== id)), [])

  const { nodes: layoutNodes, edges } = useMemo(
    () => buildLayout(members, editMode, handleEdit, handleDelete),
    [members, editMode, handleEdit, handleDelete]
  )

  // Apply saved position overrides
  const nodes: Node<NodeData>[] = useMemo(
    () => layoutNodes.map((n) => nodePositions[n.id] ? { ...n, position: nodePositions[n.id] } : n),
    [layoutNodes, nodePositions]
  )

  const onNodesChange: OnNodesChange<Node<NodeData>> = useCallback((changes) => {
    if (!editMode) return
    setNodePositions((prev) => {
      const next = { ...prev }
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          next[change.id] = change.position
        }
      })
      return next
    })
  }, [editMode])

  const editingMember = members.find((m) => m.id === editingId)
  const activeCount = members.filter((m) => m.status === "active").length
  const buildingCount = members.filter((m) => m.status === "building" || m.status === "planned").length

  function handleSaveEdit(data: MemberFormData) {
    if (!editingId) return
    setMembers((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...data } : m)))
    setEditingId(null)
  }

  function handleAddMember(data: MemberFormData) {
    setMembers((prev) => [...prev, { id: `member-${Date.now()}`, ...data }])
    setAddingNew(false)
  }

  function handleSaveToStorage() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(members))
      setSaveFlash(true)
      setTimeout(() => setSaveFlash(false), 2000)
    } catch {
      // localStorage unavailable
    }
  }

  function handleReset() {
    if (typeof window !== "undefined" && !window.confirm("Ekip düzenini sifirlamak istiyor musunuz?")) return
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    setMembers(DEFAULT_TEAM)
    setNodePositions({})
  }

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] bg-background rounded-lg border border-border overflow-hidden">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-xl px-3 py-2 shadow-lg">
        <span className="text-sm font-bold text-foreground">Slowdays AI Ekibi</span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-xs text-emerald-400 font-medium">{activeCount} aktif</span>
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-xs text-amber-400 font-medium">{buildingCount} gelistiriliyor</span>
        <div className="w-px h-4 bg-border mx-1" />
        <button onClick={() => setEditMode((v) => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${editMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          <Edit2 className="w-3.5 h-3.5" />{editMode ? "Düzenleniyor" : "Düzenle"}
        </button>
        {editMode && (
          <>
            <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/60 border border-emerald-700/40 transition-colors">
              <Plus className="w-3.5 h-3.5" />Üye Ekle
            </button>
            <button onClick={handleSaveToStorage} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${saveFlash ? "bg-emerald-600 text-white border-emerald-500" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}>
              <Save className="w-3.5 h-3.5" />{saveFlash ? "Kaydedildi!" : "Kaydet"}
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border hover:bg-rose-900/40 hover:text-rose-300 hover:border-rose-700/40 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />Sifirla
            </button>
          </>
        )}
      </div>

      <div className="absolute top-[3.25rem] left-1/2 -translate-x-1/2 z-10 text-[11px] text-muted-foreground italic whitespace-nowrap">
        Eger her agent bir insan olsaydi — baglantilariyla birlikte
      </div>

      {editMode && (
        <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-10 text-[10px] text-amber-400/80 bg-amber-900/20 border border-amber-700/30 rounded-full px-3 py-0.5 whitespace-nowrap">
          Düzenleme modu: Sürükle · Düzenle · Sil · Kaydet
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        nodesDraggable={editMode}
        nodesConnectable={false}
        elementsSelectable={editMode}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.12}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="#1e293b" />
        <Controls className="!bg-card !border-border" />
      </ReactFlow>

      <Legend />

      {editingId && editingMember && (
        <MemberModal title={`Düzenle: ${editingMember.name}`} initial={editingMember} allMembers={members.filter((m) => m.id !== editingId)} onSave={handleSaveEdit} onClose={() => setEditingId(null)} />
      )}
      {addingNew && (
        <MemberModal title="Yeni Ekip Üyesi" initial={EMPTY_MEMBER} allMembers={members} onSave={handleAddMember} onClose={() => setAddingNew(false)} />
      )}
    </div>
  )
}

export function TeamHierarchyCanvas() {
  return (
    <ReactFlowProvider>
      <TeamCanvasInner />
    </ReactFlowProvider>
  )
}

export default TeamHierarchyCanvas
