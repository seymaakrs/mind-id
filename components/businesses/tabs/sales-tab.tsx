"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Flame,
  RefreshCw,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SalesTabProps {
  businessId: string;
}

type CountResp = { success: true; count: number; summary_tr?: string };
type FunnelResp = {
  success: true;
  data: Array<{ asama: string; count: number }>;
  summary_tr?: string;
};
type OutreachStatusResp = {
  success: true;
  sent_today?: number;
  sent_last_hour?: number;
  daily_limit?: number;
  remaining?: number;
  summary_tr?: string;
};
type OutreachHealthResp = {
  success: true;
  active: boolean;
  paused: boolean;
  reason?: string | null;
  configured?: boolean;
};

const STAGE_COLORS: Record<string, string> = {
  Yeni: "#9CA3AF",
  Soguk: "#60A5FA",
  Ilik: "#FBBF24",
  Sicak: "#F97316",
  Teklif: "#A78BFA",
  Sozlesme: "#34D399",
  Kazanildi: "#10B981",
  Kayip: "#EF4444",
  Arsiv: "#6B7280",
};

async function fetchJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`${r.status}: ${detail || r.statusText}`);
  }
  return r.json();
}

export function SalesTab({ businessId: _businessId }: SalesTabProps) {
  // businessId şu an backend tarafında multi-tenant filter olmadığı için
  // sadece UI'da bilgi amaçlı tutuluyor; ileride /sales/* endpoint'leri
  // business_id query param alıp NocoDB'de o işletmeye scoped sayım yapacak.
  const [hotCount, setHotCount] = useState<number | null>(null);
  const [funnel, setFunnel] = useState<FunnelResp["data"] | null>(null);
  const [outreach, setOutreach] = useState<OutreachStatusResp | null>(null);
  const [health, setHealth] = useState<OutreachHealthResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [count, fnl, st, hl] = await Promise.all([
        fetchJSON<CountResp>("/api/sales/leads/count?asama=Sicak"),
        fetchJSON<FunnelResp>("/api/sales/leads/funnel"),
        fetchJSON<OutreachStatusResp>("/api/sales/outreach/status"),
        fetchJSON<OutreachHealthResp>("/api/sales/outreach/health"),
      ]);
      setHotCount(count.count);
      setFunnel(fnl.data || []);
      setOutreach(st);
      setHealth(hl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const funnelTotal = (funnel || []).reduce((a, b) => a + (b.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Satış & CRM</h2>
          <p className="text-sm text-muted-foreground">
            NocoDB CRM canlı verisi — Sales Manager raporları
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-500">Veri yüklenemedi</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                İpucu: <code>SALES_API_TOKEN</code> env'i Vercel'de set
                olmalı ve mind-agent ile aynı değer olmalı.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Üst sıra: 4 metrik kart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sıcak lead */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sıcak Lead</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 text-3xl font-bold">
              {hotCount ?? (loading ? "…" : "—")}
            </div>
          </CardContent>
        </Card>

        {/* Toplam lead (funnel toplamı) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Toplam Lead</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-3xl font-bold">
              {funnel ? funnelTotal : loading ? "…" : "—"}
            </div>
          </CardContent>
        </Card>

        {/* Outreach bugün */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Bugün Gönderilen
              </span>
              <Send className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 text-3xl font-bold">
              {outreach?.sent_today ?? (loading ? "…" : "—")}
            </div>
            {outreach?.daily_limit && (
              <p className="text-xs text-muted-foreground mt-1">
                Limit: {outreach.daily_limit}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Outreach health badge */}
        <Card
          className={
            health?.paused
              ? "border-red-500/40 bg-red-500/5"
              : health?.active
              ? "border-emerald-500/40 bg-emerald-500/5"
              : ""
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Outreach Durumu
              </span>
              {health?.paused ? (
                <PauseCircle className="h-4 w-4 text-red-500" />
              ) : (
                <PlayCircle className="h-4 w-4 text-emerald-500" />
              )}
            </div>
            <div className="mt-2 text-lg font-semibold">
              {!health
                ? loading
                  ? "Yükleniyor…"
                  : "—"
                : health.paused
                ? "Durduruldu"
                : "Aktif"}
            </div>
            {health?.reason && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {health.reason}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel bar */}
      {funnel && funnel.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Funnel (aşamaya göre lead)</h3>
            <div className="space-y-2">
              {funnel.map((row) => {
                const pct = funnelTotal > 0 ? (row.count / funnelTotal) * 100 : 0;
                const color = STAGE_COLORS[row.asama] || "#6B7280";
                return (
                  <div key={row.asama}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{row.asama}</span>
                      <span className="text-muted-foreground">
                        {row.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boş hal */}
      {!loading && !error && !funnel && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Henüz veri yok. Sales API endpoint'i konfigürasyonu kontrol et.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
