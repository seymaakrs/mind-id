"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bot, Building2, FolderOpen, ChevronRight, Clock,
  CheckCircle2, XCircle, Loader2, Plus, Repeat,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useBusinesses } from "@/hooks"
import { db } from "@/lib/firebase/config"
import {
  collection, query, orderBy, limit, getDocs,
  where, getCountFromServer,
} from "firebase/firestore"
import type { Task } from "@/types/tasks"
import type { Business } from "@/types/firebase"

type MainMenuType = "instagram" | "blog" | "agent" | "isletmeler" | "istatistikler" | "settings"
type SubMenuType = "icerik-uret" | "blog-paylas" | "isletme-listele" | "isletme-ekle" | "isletme-dashboard"

interface WelcomeDashboardProps {
  onNavigate: (menu: MainMenuType, subMenu?: SubMenuType | null) => void
  onBusinessDashboard: (businessId: string) => void
  onStartWithAgent: (businessId: string, task: string) => void
}

// ─── Business card ───────────────────────────────────────────────────────────

interface BusinessStats {
  lastTask: Task | null
  scheduledJobsCount: number
}

async function fetchBusinessStats(businessId: string): Promise<BusinessStats> {
  if (!db) return { lastTask: null, scheduledJobsCount: 0 }

  const [tasksSnap, jobsSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "businesses", businessId, "tasks"),
        orderBy("createdAt", "desc"),
        limit(1)
      )
    ),
    getCountFromServer(
      query(collection(db, "businesses", businessId, "jobs"), where("type", "!=", "immediate"))
    ),
  ])

  const lastTask = tasksSnap.empty
    ? null
    : ({ id: tasksSnap.docs[0].id, ...tasksSnap.docs[0].data() } as Task)

  return { lastTask, scheduledJobsCount: jobsSnap.data().count }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Az önce"
  if (mins < 60) return `${mins} dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} sa önce`
  return `${Math.floor(hours / 24)} gün önce`
}

function TaskStatusBadge({ status }: { status: Task["status"] }) {
  if (status === "completed")
    return <span className="flex items-center gap-1 text-[10px] text-green-500"><CheckCircle2 className="w-3 h-3" />Tamamlandı</span>
  if (status === "failed")
    return <span className="flex items-center gap-1 text-[10px] text-destructive"><XCircle className="w-3 h-3" />Başarısız</span>
  if (status === "running")
    return <span className="flex items-center gap-1 text-[10px] text-yellow-500"><Loader2 className="w-3 h-3 animate-spin" />Çalışıyor</span>
  return <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />Bekliyor</span>
}

function BusinessCard({
  business, stats, loadingStats, onDashboard, onAgent,
}: {
  business: Business
  stats: BusinessStats | null
  loadingStats: boolean
  onDashboard: () => void
  onAgent: () => void
}) {
  const lastTaskDate = stats?.lastTask?.createdAt
    ? (() => {
        const ts = stats.lastTask!.createdAt
        return "toDate" in ts ? ts.toDate() : new Date(ts as unknown as number)
      })()
    : null

  return (
    <Card className="flex flex-col gap-0 overflow-hidden hover:border-border/80 transition-colors">
      <button
        type="button"
        onClick={onDashboard}
        className="flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors group"
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {business.logo
            ? <img src={business.logo} alt="" className="w-full h-full object-contain" />
            : <Building2 className="w-5 h-5 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{business.name}</p>
          {loadingStats ? (
            <div className="h-3 w-24 bg-muted animate-pulse rounded mt-1" />
          ) : stats?.lastTask ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">Son görev:</span>
              <TaskStatusBadge status={stats.lastTask.status} />
              {lastTaskDate && (
                <span className="text-[10px] text-muted-foreground">{timeAgo(lastTaskDate)}</span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-0.5">Henüz görev yok</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 transition-colors" />
      </button>

      {!loadingStats && stats?.lastTask?.task && (
        <div className="px-4 pb-2">
          <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
            "{stats.lastTask.task}"
          </p>
        </div>
      )}

      <div className="border-t border-border mx-4" />

      <div className="flex items-center justify-between px-4 py-2.5 gap-2">
        <div>
          {!loadingStats && stats !== null && stats.scheduledJobsCount > 0 ? (
            <Badge variant="secondary" className="text-[10px] h-5 gap-1">
              <Repeat className="w-3 h-3" />
              {stats.scheduledJobsCount} zamanlanmış
            </Badge>
          ) : !loadingStats ? (
            <span className="text-[10px] text-muted-foreground">Zamanlanmış görev yok</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onAgent() }}
          >
            <Bot className="w-3.5 h-3.5" />
            Agent
          </Button>
          <Button
            variant="outline" size="sm" className="h-7 px-2 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); onDashboard() }}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Aç
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function WelcomeDashboard({ onNavigate, onBusinessDashboard, onStartWithAgent }: WelcomeDashboardProps) {
  const { user } = useAuth()
  const { businesses, loading: loadingBusinesses } = useBusinesses()
  const [statsMap, setStatsMap] = useState<Record<string, BusinessStats>>({})
  const [loadingStats, setLoadingStats] = useState(false)

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Kullanıcı"

  const loadStats = useCallback(async (list: Business[]) => {
    if (list.length === 0) return
    setLoadingStats(true)
    const results = await Promise.all(
      list.map(async (b) => {
        const stats = await fetchBusinessStats(b.id).catch(() => ({ lastTask: null, scheduledJobsCount: 0 }))
        return [b.id, stats] as const
      })
    )
    setStatsMap(Object.fromEntries(results))
    setLoadingStats(false)
  }, [])

  useEffect(() => {
    if (!loadingBusinesses && businesses.length > 0) loadStats(businesses)
  }, [loadingBusinesses, businesses, loadStats])

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hoş geldin, {displayName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {businesses.length > 0
              ? `${businesses.length} işletme yönetiyorsun`
              : "Başlamak için bir işletme ekle"}
          </p>
        </div>
        <Button
          variant="outline" size="sm" className="gap-1.5 hidden sm:flex"
          onClick={() => onNavigate("isletmeler", "isletme-ekle")}
        >
          <Plus className="w-3.5 h-3.5" />
          İşletme Ekle
        </Button>
      </div>

      {/* Business Grid */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">İşletmeler</p>
      </div>

      {loadingBusinesses ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="p-4 h-36 animate-pulse bg-muted/30" />)}
        </div>
      ) : businesses.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="font-semibold mb-1">Henüz işletme yok</h3>
          <p className="text-sm text-muted-foreground mb-4">Her şey bir işletme profiliyle başlar.</p>
          <Button onClick={() => onNavigate("isletmeler", "isletme-ekle")} className="gap-2">
            <Plus className="w-4 h-4" />
            İşletme Ekle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              stats={statsMap[business.id] ?? null}
              loadingStats={loadingStats && !statsMap[business.id]}
              onDashboard={() => onBusinessDashboard(business.id)}
              onAgent={() => onStartWithAgent(business.id, "")}
            />
          ))}
        </div>
      )}
    </div>
  )
}
