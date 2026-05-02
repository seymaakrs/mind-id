"use client"

import { useState, useRef, useCallback, useMemo } from "react"
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

// ─── Data ──────────────────────────────────────────────────────────────────────

export const DEFAULT_TEAM: TeamMember[] = [
  { id: "seyma", name: "Şeyma", humanRole: "Kurucu & CEO", agentRole: "Sistem Sahibi", quote: "Brief verir, onaylar", tools: [], color: "#9d174d", repo: "root", reportsTo: null, status: "active", type: "founder" },
  { id: "olcay", name: "Olcay", humanRole: "Ajans Müdr", agentRole: "Orchestrator Agent", quote: "Brief okur, ekibe dağıtır", tools: ["Claude 4", "Prompt Router"], color: "#4338ca", repo: "mind-agent", reportsTo: "seyma", status: "active", type: "orchestrator" },
  { id: "defne", name: "Defne", humanRole: "Görsel Tasarımcı", agentRole: "Image Agent", quote: "Çizim stüdyosu", tools: ["Gemini 2.5 Flash", "fal.ai"], color: "#065f46", repo: "mind-agent", reportsTo: "olcay", status: "active", type: "agent" },
  { id: "toprak", name: "Toprak", humanRole: "Motion Designer", agentRole: "Video Agent", quote: "Hareket ve ses üretir", tools: ["Veo", "Kling", "HeyGen"], color: "#065f46", repo: "mind-agent", reportsTo: "olcay", status: "active", type: "agent" },
  { id: "selin", name: "Selin", humanRole: "Sosyal Medya Sorumlusu", agentRole: "Marketing Agent", quote: "Marka sesi ve reklam", tools: ["Late API", "Instagram", "Meta Ads"], color: "#1e40af", repo: "mind-agent", reportsTo: "olcay", status: "active", type: "agent" },
  { id: "kaan", name: "Kaan", humanRole: "Stratejist & Araştırmacı", agentRole: "Analysis Agent", quote: "Veri okur, rapor çıkarır", tools: ["Serper.dev", "SEO"], color: "#92400e", repo: "mind-agent", reportsTo: "olcay", status: "active", type: "agent" },
  { id: "mert", name: "Mert", humanRole: "Satış Akış Yöneticisi", agentRole: "n8n Orchestrator", quote: "Satış pipeline yürütür", tools: ["n8n", "Webhook"], color: "#6d28d9", repo: "customer_agent", reportsTo: "seyma", status: "building", type: "workflow" },
  { id: "zeynep", name: "Zeynep", humanRole: "Reklam Takipçisi", agentRole: "Meta Lead Agent", quote: "Facebook & IG lead toplar", tools: ["Meta Ads API"], color: "#be185d", repo: "customer_agent", reportsTo: "mert", status: "passive", type: "agent" },
  { id: "emre", name: "Emre", humanRole: "Profesyonel Ağ Avcısı", agentRole: "LinkedIn Agent", quote: "B2B lead arar", tools: ["LinkedIn API"], color: "#0369a1", repo: "customer_agent", reportsTo: "mert", status: "planned", type: "agent" },
  { id: "ayse", name: "Ayşe", humanRole: "Veri Zenginleştirme", agentRole: "Clay Agent", quote: "Müşteri profilini doldurur", tools: ["Clay", "Clearbit"], color: "#0369a1", repo: "customer_agent", reportsTo: "mert", status: "planned", type: "agent" },
  { id: "berk", name: "Berk", humanRole: "Mesaj Otomasyonu", agentRole: "Instagram DM Agent", quote: "IG DM otomatik yanıtlar", tools: ["Instagram Graph API"], color: "#0369a1", repo: "customer_agent", reportsTo: "mert", status: "planned", type: "agent" },
  { id: "firebase", name: "Firebase", humanRole: "Şirket Arşivi", agentRole: "Veri Katmanı", quote: "Her dosya, her geçmiş burada", tools: ["Firestore", "Auth", "Storage"], color: "#b45309", repo: "mindid-nocodb", reportsTo: null, status: "active", type: "data" },
]

const STATUS_CONFIG: Record<AgentStatus, { label: string; dot: string; badge: string }> = {
  active:   { label: "Aktif",          dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" },
  building: { label: "Geliştiriliyor", dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700" },
  planned:  { label: "Planlandı",      dot: "bg-slate-300",   badge: "bg-slate-100 text-slate-500" },
  passive:  { label: "Pasif",           dot: "bg-slate-300",   badge: "bg-slate-100 text-slate-400" },
}

const REPO_COLORS: Record<string, string> = {
  root:           "#6366f1",
  "mind-agent":   "#8b5cf6",
  customer_agent: "#f97316",
  "mindid-nocodb":"#14b8a6",
  "mind-id":      "#0ea5e9",
}

// ─── Layout (pure JS tree algorithm — no dagre) ───────────────────────────────

const NW = 175  // node width
const NH = 162  // node height
const HG = 36   // horizontal gap between siblings
const VG = 90   // vertical gap between levels

function treeLayout(members: TeamMember[]): Record<string, { x: number; y: number }> {
  const children: Record<string, string[]> = {}
  members.filter(m => m.type !== "data").forEach(m => {
    if (m.reportsTo && members.find(x => x.id === m.reportsTo)) {
      children[m.reportsTo] = [...(children[m.reportsTo] ?? []), m.id]
    }
  })

  const roots = members.filter(
    m => m.type !== "data" && (!m.reportsTo || !members.find(x => x.id === m.reportsTo))
  )

  function sw(id: string): number {
    const ch = children[id] ?? []
    if (!ch.length) return NW
    return Math.max(NW, ch.reduce((s, c, i) => s + sw(c) + (i ? HG : 0), 0))
  }

  const pos: Record<string, { x: number; y: number }> = {}

  function place(id: string, left: number, y: number) {
    const w = sw(id)
    pos[id] = { x: left + w / 2 - NW / 2, y }
    const ch = children[id] ?? []
    let cl = left
    ch.forEach(cid => { place(cid, cl, y + NH + VG); cl += sw(cid) + HG })
  }

  let left = 0
  roots.forEach(r => { place(r.id, left, 0); left += sw(r.id) + HG * 2 })

  const maxY = Object.values(pos).reduce((m, p) => Math.max(m, p.y), 0)
  const totalW = left - HG * 2
  const datas = members.filter(m => m.type === "data")
  datas.forEach((m, i) => {
    const dw = datas.length * NW + (datas.length - 1) * HG
    pos[m.id] = { x: Math.max(0, (totalW - dw) / 2) + i * (NW + HG), y: maxY + NH + VG * 2 }
  })

  return pos
}

// ─── Person Avatar ────────────────────────────────────────────────────────────

function PersonAvatar({ color, size = 50 }: { color: string; size?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      <div style={{ width: size * 0.42, height: size * 0.42, background: color, borderRadius: "50%", border: "2.5px solid white", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }} />
      <div style={{ width: size * 0.72, height: size * 0.46, background: color, border: "2.5px solid white", borderBottom: "none", borderRadius: `${size * 0.36}px ${size * 0.36}px 0 0`, marginTop: 2, boxShadow: "0 1px 4px rgba(0,0,0,.10)" }} />
    </div>
  )
}

// ─── Node Card ───────────────────────────────────────────────────────────────

function NodeCard({
  member: m, editMode, onEdit, onDelete,
}: {
  member: TeamMember
  editMode: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const status = STATUS_CONFIG[m.status]
  const isData   = m.type === "data"
  const isFounder = m.type === "founder"

  return (
    <div
      className="rounded-2xl bg-white shadow-md flex flex-col items-center pt-3 pb-2.5 px-2 select-none relative"
      style={{ borderTop: `3px solid ${m.color}`, width: NW, cursor: editMode ? "grab" : "default" }}
    >
      {editMode && (
        <div className="absolute -top-2.5 -right-2 flex gap-1 z-10">
          <button className="w-5 h-5 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center shadow-sm transition-colors" onClick={e => { e.stopPropagation(); onEdit(m.id) }}>
            <Edit2 className="w-2.5 h-2.5 text-white" />
          </button>
          {m.id !== "seyma" && (
            <button className="w-5 h-5 bg-rose-500 hover:bg-rose-400 rounded-full flex items-center justify-center shadow-sm transition-colors" onClick={e => { e.stopPropagation(); onDelete(m.id) }}>
              <Trash2 className="w-2.5 h-2.5 text-white" />
            </button>
          )}
        </div>
      )}

      <div className="relative">
        {isData ? (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: m.color }}>
            <Database className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div className="relative">
            <PersonAvatar color={m.color} size={isFounder ? 54 : 46} />
            {isFounder && <Crown className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-500" />}
          </div>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${status.dot}`} />
      </div>

      <div className="text-center mt-2 w-full px-1">
        <div className="font-bold text-[13px] text-slate-800 leading-tight truncate">{m.name}</div>
        <div className="text-[11px] text-slate-500 mt-0.5 leading-tight truncate">{m.humanRole}</div>
        <div className="text-[10px] text-slate-400 leading-tight truncate">({m.agentRole})</div>
        {m.quote && <div className="text-[9.5px] text-slate-400 italic mt-0.5 leading-tight truncate">{m.quote}</div>}
      </div>

      {m.tools.length > 0 && (
        <div className="mt-1.5 w-full px-1.5 py-1 rounded-lg text-[9.5px] text-center leading-snug" style={{ background: m.color + "14", color: m.color }}>
          {m.tools.slice(0, 3).join(" · ")}
        </div>
      )}

      <div className={`mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold ${status.badge}`}>{status.label}</div>
      <div className="mt-0.5 text-[9px] font-mono opacity-50 truncate" style={{ color: REPO_COLORS[m.repo] ?? "#6366f1" }}>{m.repo}</div>
    </div>
  )
}

// ─── Edit Modal ────────────────────────────────────────────────────────────

type MemberFormData = Omit<TeamMember, "id">

const EMPTY_MEMBER: MemberFormData = {
  name: "", humanRole: "", agentRole: "", quote: "", tools: [],
  color: "#6366f1", repo: "mind-agent", reportsTo: null, status: "planned", type: "agent",
}

function MemberModal({
  title, initial, allMembers, onSave, onClose,
}: {
  title: string
  initial: MemberFormData
  allMembers: TeamMember[]
  onSave: (data: MemberFormData) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<MemberFormData>(initial)
  const [toolsStr, setToolsStr] = useState(initial.tools.join(", "))

  function setField(k: keyof MemberFormData, v: MemberFormData[keyof MemberFormData]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const cls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
  const lbl = "block text-[11px] text-slate-400 mb-1 uppercase tracking-wide font-medium"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>İsim *</label><input className={cls} value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Defne" /></div>
            <div><label className={lbl}>Renk</label><div className="flex items-center gap-2"><input type="color" value={form.color} onChange={e => setField("color", e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5" /><span className="text-xs text-slate-400 font-mono">{form.color}</span></div></div>
          </div>
          <div><label className={lbl}>İnsan Rolü</label><input className={cls} value={form.humanRole} onChange={e => setField("humanRole", e.target.value)} placeholder="Görsel Tasarımcı" /></div>
          <div><label className={lbl}>Ajan Rolü</label><input className={cls} value={form.agentRole} onChange={e => setField("agentRole", e.target.value)} placeholder="Image Agent" /></div>
          <div><label className={lbl}>Motto</label><input className={cls} value={form.quote} onChange={e => setField("quote", e.target.value)} placeholder="Kısa bir motto..." /></div>
          <div><label className={lbl}>Araçlar (virgülle ayır)</label><input className={cls} value={toolsStr} onChange={e => setToolsStr(e.target.value)} placeholder="Gemini, fal.ai" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Repo</label>
              <select className={cls} value={form.repo} onChange={e => setField("repo", e.target.value as TeamMember["repo"])}>
                <option value="mind-agent">mind-agent</option>
                <option value="customer_agent">customer_agent</option>
                <option value="mindid-nocodb">mindid-nocodb</option>
                <option value="mind-id">mind-id</option>
                <option value="root">root</option>
              </select>
            </div>
            <div><label className={lbl}>Tür</label>
              <select className={cls} value={form.type} onChange={e => setField("type", e.target.value as AgentType)}>
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
            <div><label className={lbl}>Raporladığı</label>
              <select className={cls} value={form.reportsTo ?? ""} onChange={e => setField("reportsTo", e.target.value || null)}>
                <option value="">— Bağımsız —</option>
                {allMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Durum</label>
              <select className={cls} value={form.status} onChange={e => setField("status", e.target.value as AgentStatus)}>
                <option value="active">Aktif</option>
                <option value="building">Geliştiriliyor</option>
                <option value="planned">Planlandı</option>
                <option value="passive">Pasif</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 text-slate-600">İptal</button>
          <button
            onClick={() => { if (!form.name.trim()) return; onSave({ ...form, tools: toolsStr.split(",").map(t => t.trim()).filter(Boolean) }) }}
            className="flex-1 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-white/95 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1 shadow-md select-none">
      <div className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] mb-1.5">Durum</div>
      {(Object.entries(STATUS_CONFIG) as [AgentStatus, typeof STATUS_CONFIG[AgentStatus]][]).map(([, cfg]) => (
        <div key={cfg.label} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
          <span className="text-slate-500">{cfg.label}</span>
        </div>
      ))}
      <div className="border-t border-slate-100 pt-1.5 mt-1.5 font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Repo</div>
      {Object.entries(REPO_COLORS).map(([repo, color]) => (
        <div key={repo} className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-sm shrink-0" style={{ background: color }} />
          <span className="text-slate-400 font-mono">{repo}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Canvas ─────────────────────────────────────────────────────────────

const LS_KEY = "team-hierarchy-v2"

export function TeamHierarchyCanvas() {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    if (typeof window === "undefined") return DEFAULT_TEAM
    try { const s = localStorage.getItem(LS_KEY); return s ? (JSON.parse(s) as TeamMember[]) : DEFAULT_TEAM } catch { return DEFAULT_TEAM }
  })
  const [editMode, setEditMode]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number }>>({})
  const [pan, setPan]             = useState({ x: 60, y: 50 })
  const [scale, setScale]         = useState(0.85)

  const layout    = useMemo(() => treeLayout(members), [members])
  const positions = useMemo(() => ({ ...layout, ...overrides }), [layout, overrides])

  const canvasSize = useMemo(() => {
    const vals = Object.values(positions)
    if (!vals.length) return { w: 800, h: 600 }
    return { w: Math.max(...vals.map(p => p.x + NW)) + 80, h: Math.max(...vals.map(p => p.y + NH)) + 80 }
  }, [positions])

  // Refs so pointer handlers never have stale closures
  const scaleRef    = useRef(scale);    scaleRef.current    = scale
  const panRef      = useRef(pan);      panRef.current      = pan
  const posRef      = useRef(positions);posRef.current      = positions
  const editRef     = useRef(editMode); editRef.current     = editMode

  type DragState =
    | { kind: "drag"; id: string; ox: number; oy: number; mx: number; my: number }
    | { kind: "pan";  sx: number; sy: number; spx: number; spy: number }

  const activeRef = useRef<DragState | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return
    const nodeEl = (e.target as HTMLElement).closest("[data-node-id]") as HTMLElement | null
    if (nodeEl && editRef.current) {
      const id  = nodeEl.dataset.nodeId ?? ""
      const pos = posRef.current[id] ?? { x: 0, y: 0 }
      activeRef.current = { kind: "drag", id, ox: pos.x, oy: pos.y, mx: e.clientX, my: e.clientY }
    } else if (!nodeEl) {
      activeRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, spx: panRef.current.x, spy: panRef.current.y }
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const a = activeRef.current
    if (!a) return
    if (a.kind === "drag") {
      const dx = (e.clientX - a.mx) / scaleRef.current
      const dy = (e.clientY - a.my) / scaleRef.current
      setOverrides(prev => ({ ...prev, [a.id]: { x: a.ox + dx, y: a.oy + dy } }))
    } else {
      setPan({ x: a.spx + e.clientX - a.sx, y: a.spy + e.clientY - a.sy })
    }
  }, [])

  const handlePointerUp = useCallback(() => { activeRef.current = null }, [])

  // SVG edges
  const connections = useMemo(() => {
    type Edge = { id: string; from: string; to: string; color: string; dashed: boolean; label?: string }
    const edges: Edge[] = []
    members.forEach(m => {
      if (m.reportsTo && members.find(x => x.id === m.reportsTo))
        edges.push({ id: `h-${m.reportsTo}-${m.id}`, from: m.reportsTo, to: m.id, color: REPO_COLORS[m.repo] ?? "#6366f1", dashed: false })
    })
    const cross: [string, string, string][] = [
      ["selin", "defne",  "ışbirliği"],
      ["selin", "toprak", "ışbirliği"],
      ["mert",  "olcay",  "SDK köprüsü"],
    ]
    cross.forEach(([a, b, lbl]) => {
      if (members.find(m => m.id === a) && members.find(m => m.id === b))
        edges.push({ id: `x-${a}-${b}`, from: a, to: b, color: "#94a3b8", dashed: true, label: lbl })
    })
    return edges
  }, [members])

  function bezier(from: string, to: string, side: boolean): string {
    const fp = positions[from], tp = positions[to]
    if (!fp || !tp) return ""
    if (side) {
      const x1 = fp.x + NW / 2, y1 = fp.y + NH / 2
      const x2 = tp.x + NW / 2, y2 = tp.y + NH / 2
      const mx = (x1 + x2) / 2
      return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
    }
    const x1 = fp.x + NW / 2, y1 = fp.y + NH
    const x2 = tp.x + NW / 2, y2 = tp.y
    const cy = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${cy} ${x2} ${cy} ${x2} ${y2}`
  }

  const activeCount = members.filter(m => m.status === "active").length
  const buildCount  = members.filter(m => m.status === "building" || m.status === "planned").length
  const editingMember = members.find(m => m.id === editingId)

  function handleSave() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(members)); setSaveFlash(true); setTimeout(() => setSaveFlash(false), 2000) } catch { /* ignore */ }
  }

  function handleReset() {
    if (typeof window !== "undefined" && !window.confirm("Ekip düzenini sıfırlamak istiyor musunuz?")) return
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    setMembers(DEFAULT_TEAM)
    setOverrides({})
  }

  return (
    <div
      className="relative w-full h-[calc(100vh-7rem)] rounded-xl border border-slate-200 overflow-hidden"
      style={{ background: "linear-gradient(150deg,#f8fafc 0%,#eef2f8 100%)" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Top control bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm select-none">
        <span className="text-sm font-bold text-slate-700">Slowdays AI Ekibi</span>
        <span className="text-slate-300 text-xs">·</span>
        <span className="text-xs text-emerald-500 font-medium">{activeCount} aktif</span>
        <span className="text-slate-300 text-xs">·</span>
        <span className="text-xs text-amber-500 font-medium">{buildCount} geliştiriliyor</span>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <button onClick={() => setEditMode(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${editMode ? "bg-violet-100 text-violet-700" : "hover:bg-slate-100 text-slate-500"}`}>
          <Edit2 className="w-3.5 h-3.5" />{editMode ? "Düzenleniyor" : "Düzenle"}
        </button>
        {editMode && (
          <>
            <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
              <Plus className="w-3.5 h-3.5" />Üye Ekle
            </button>
            <button onClick={handleSave} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${saveFlash ? "bg-emerald-500 text-white border-emerald-400" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              <Save className="w-3.5 h-3.5" />{saveFlash ? "Kaydedildi!" : "Kaydet"}
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />Sıfırla
            </button>
          </>
        )}
      </div>

      <div className="absolute top-[3.5rem] left-1/2 -translate-x-1/2 z-20 text-[11px] text-slate-400 italic whitespace-nowrap select-none">
        Eğer her agent bir insan olsaydı — bağlantılarıyla birlikte
      </div>

      {editMode && (
        <div className="absolute top-[5.25rem] left-1/2 -translate-x-1/2 z-20 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5 whitespace-nowrap select-none">
          Sürükle · Düzenle · Sil · Kaydet
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 select-none">
        <button onClick={() => setScale(s => Math.min(2, +(s + 0.1).toFixed(1)))} className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 font-bold text-base transition-colors">+</button>
        <button onClick={() => setScale(s => Math.max(0.2, +(s - 0.1).toFixed(1)))} className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 font-bold text-base transition-colors">−</button>
        <button onClick={() => { setPan({ x: 60, y: 50 }); setScale(0.85) }} className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-400 hover:bg-slate-50 text-xs transition-colors" title="Fit">⊙</button>
      </div>

      {/* Pan + zoom container */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin: "0 0", width: canvasSize.w, height: canvasSize.h }}>

          {/* SVG edge layer */}
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }} width={canvasSize.w} height={canvasSize.h}>
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0,7 2.5,0 5" fill="#cbd5e1" opacity="0.8" />
              </marker>
            </defs>
            {connections.map(edge => {
              const d = bezier(edge.from, edge.to, edge.dashed)
              if (!d) return null
              const fp = positions[edge.from], tp = positions[edge.to]
              return (
                <g key={edge.id}>
                  <path d={d} stroke={edge.color} strokeWidth={edge.dashed ? 1.5 : 2} fill="none"
                    strokeDasharray={edge.dashed ? "6 4" : undefined}
                    opacity={edge.dashed ? 0.5 : 0.85}
                    markerEnd={edge.dashed ? undefined : "url(#arr)"}
                  />
                  {edge.label && fp && tp && (
                    <text x={(fp.x + tp.x) / 2 + NW / 2} y={(fp.y + tp.y) / 2 + NH / 2} textAnchor="middle" fontSize="9" fill="#94a3b8" dy="-4">{edge.label}</text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Node layer */}
          {members.map(m => {
            const pos = positions[m.id]
            if (!pos) return null
            return (
              <div key={m.id} data-node-id={m.id} style={{ position: "absolute", left: pos.x, top: pos.y, width: NW, zIndex: 1 }}>
                <NodeCard member={m} editMode={editMode} onEdit={id => setEditingId(id)} onDelete={id => setMembers(prev => prev.filter(x => x.id !== id))} />
              </div>
            )
          })}
        </div>
      </div>

      <Legend />

      {editingId && editingMember && (
        <MemberModal
          title={`Düzenle: ${editingMember.name}`}
          initial={editingMember}
          allMembers={members.filter(m => m.id !== editingId)}
          onSave={data => { setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...data } : m)); setEditingId(null) }}
          onClose={() => setEditingId(null)}
        />
      )}
      {addingNew && (
        <MemberModal
          title="Yeni Ekip Üyesi"
          initial={EMPTY_MEMBER}
          allMembers={members}
          onSave={data => { setMembers(prev => [...prev, { id: `member-${Date.now()}`, ...data }]); setAddingNew(false) }}
          onClose={() => setAddingNew(false)}
        />
      )}
    </div>
  )
}

export default TeamHierarchyCanvas
