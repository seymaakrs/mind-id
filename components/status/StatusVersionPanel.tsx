"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, CheckCircle2, Circle, GitBranch, GitPullRequest, RefreshCw } from "lucide-react"

const VERSIONS_URL =
  "https://raw.githubusercontent.com/seymaakrs/mind-agent/claude/vibrant-brahmagupta-m8eqI/docs/versions.json"

const REPOS = ["seymaakrs/mind-id", "seymaakrs/mind-agent", "seymaakrs/customer_agent"] as const

type AgentEntry = {
  code: string
  name: string
  repo: string
  branch: string
  commit?: string
  merge_commit?: string
  files_changed?: number
  tests_added?: number
  status: string
  summary?: string
}

type Session = {
  id: string
  date: string
  title: string
  branch: string
  head_commit: string
  tests?: { passed: number; failed: number; new_added: number; note?: string }
  agents: AgentEntry[]
}

type DeployStep = { step: number; task: string; done: boolean }

type VersionsDoc = {
  current_branch: string
  latest_session: string
  sessions: Session[]
  deploy_checklist: DeployStep[]
}

type ActiveSession = {
  id: string
  user?: string
  agent_code?: string
  repo?: string
  branch?: string
  task?: string
  status?: string
  updated_at?: { seconds: number } | string
}

type OpenPR = {
  repo: string
  number: number
  title: string
  user: string
  url: string
  draft: boolean
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase()
  if (s === "merged" || s === "completed" || s === "done") return "default"
  if (s === "running" || s === "in_progress" || s === "open") return "secondary"
  if (s === "failed" || s === "error" || s === "blocked") return "destructive"
  return "outline"
}

export function StatusVersionPanel() {
  const [versions, setVersions] = useState<VersionsDoc | null>(null)
  const [versionsErr, setVersionsErr] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveSession[]>([])
  const [prs, setPrs] = useState<OpenPR[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setVersionsErr(null)
    fetch(VERSIONS_URL, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j) => !cancelled && setVersions(j))
      .catch((e) => !cancelled && setVersionsErr(String(e)))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, "active_sessions"), orderBy("updated_at", "desc"), limit(20))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setActive(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActiveSession, "id">) })))
      },
      () => setActive([]),
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all(
      REPOS.map((repo) =>
        fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=20`)
          .then((r) => (r.ok ? r.json() : []))
          .then((arr: Array<{ number: number; title: string; user: { login: string }; html_url: string; draft: boolean }>) =>
            arr.map((pr) => ({
              repo,
              number: pr.number,
              title: pr.title,
              user: pr.user?.login ?? "?",
              url: pr.html_url,
              draft: pr.draft,
            })),
          )
          .catch(() => [] as OpenPR[]),
      ),
    ).then((lists) => {
      if (!cancelled) setPrs(lists.flat())
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const latest = versions?.sessions?.[0]
  const checklist = versions?.deploy_checklist ?? []
  const doneCount = checklist.filter((s) => s.done).length
  const total = checklist.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Durum / Versiyon</h2>
          <p className="text-sm text-muted-foreground">Son oturum, ajan tablosu, deploy ilerleyişi ve açık PR&apos;lar.</p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border hover:bg-accent"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" /> Son Oturum
          </CardTitle>
          <CardDescription>
            {versionsErr ? `versions.json okunamadı: ${versionsErr}` : "mind-agent docs/versions.json"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latest ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tarih</div>
                <div className="font-mono">{latest.date}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground">Branch</div>
                <div className="font-mono break-all">{latest.branch}</div>
              </div>
              <div>
                <div className="text-muted-foreground">HEAD commit</div>
                <div className="font-mono">{latest.head_commit}</div>
              </div>
              <div className="md:col-span-4">
                <div className="text-muted-foreground">Başlık</div>
                <div>{latest.title}</div>
              </div>
              {latest.tests && (
                <div className="md:col-span-4 text-xs text-muted-foreground">
                  Test: {latest.tests.passed} geçti, {latest.tests.failed} kaldı, +{latest.tests.new_added} yeni
                  {latest.tests.note ? ` — ${latest.tests.note}` : ""}
                </div>
              )}
            </div>
          ) : !versionsErr ? (
            <div className="text-sm text-muted-foreground">Yükleniyor…</div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajanlar (A / B / C / D)</CardTitle>
          <CardDescription>Bu oturumda kim ne yaptı, test sayısı, durum</CardDescription>
        </CardHeader>
        <CardContent>
          {latest?.agents?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>İsim</TableHead>
                  <TableHead>Repo / Branch</TableHead>
                  <TableHead>Commit</TableHead>
                  <TableHead className="text-right">Dosya</TableHead>
                  <TableHead className="text-right">Test</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.agents.map((a) => (
                  <TableRow key={a.code}>
                    <TableCell className="font-mono">{a.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{a.name}</div>
                      {a.summary && <div className="text-xs text-muted-foreground">{a.summary}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div>{a.repo}</div>
                      <div className="text-muted-foreground">{a.branch}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.commit ?? "—"}</TableCell>
                    <TableCell className="text-right">{a.files_changed ?? "—"}</TableCell>
                    <TableCell className="text-right">{a.tests_added ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">Ajan verisi yok.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" /> Canlı: Şu anda kim ne yapıyor
          </CardTitle>
          <CardDescription>Firestore · active_sessions ({active.length} kayıt)</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="text-sm text-muted-foreground">Şu an aktif oturum yok.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ajan</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Repo / Branch</TableHead>
                  <TableHead>Görev</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.agent_code ?? "—"}</TableCell>
                    <TableCell>{s.user ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div>{s.repo ?? "—"}</div>
                      <div className="text-muted-foreground">{s.branch ?? ""}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{s.task ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status ?? "")}>{s.status ?? "idle"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deploy Checklist</CardTitle>
          <CardDescription>
            {doneCount} / {total} adım tamam ({pct}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-2 rounded-full bg-secondary mb-4 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="space-y-2">
            {checklist.map((s) => (
              <li key={s.step} className="flex items-start gap-3 text-sm">
                {s.done ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <span className="font-mono text-muted-foreground w-6">{s.step}.</span>
                <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.task}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" /> Açık PR&apos;lar
          </CardTitle>
          <CardDescription>3 repo · GitHub API · {prs.length} açık</CardDescription>
        </CardHeader>
        <CardContent>
          {prs.length === 0 ? (
            <div className="text-sm text-muted-foreground">Açık PR yok.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repo</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Yazan</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prs.map((pr) => (
                  <TableRow key={`${pr.repo}-${pr.number}`}>
                    <TableCell className="font-mono text-xs">{pr.repo.split("/")[1]}</TableCell>
                    <TableCell className="font-mono">
                      <a href={pr.url} target="_blank" rel="noreferrer" className="hover:underline">
                        #{pr.number}
                      </a>
                    </TableCell>
                    <TableCell>{pr.title}</TableCell>
                    <TableCell className="text-xs">{pr.user}</TableCell>
                    <TableCell>
                      <Badge variant={pr.draft ? "outline" : "secondary"}>{pr.draft ? "draft" : "open"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StatusVersionPanel
