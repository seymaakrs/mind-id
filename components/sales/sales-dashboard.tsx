"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, Users, Search } from "lucide-react";
import { useApiRequest } from "@/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Lead = Record<string, unknown>;
type LeadsResponse = { list: Lead[]; pageInfo: unknown };

// NocoDB iç/teknik alanları gizle
const HIDDEN = new Set(["ncRecordId", "ncRecordHash"]);

function val(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function statusColor(s: string): string {
  const x = s.toLowerCase();
  if (/(kazan|won|müşteri|musteri|closed.?won)/.test(x)) return "text-green-500";
  if (/(takip|follow|beklemede|progress)/.test(x)) return "text-yellow-500";
  if (/(kayıp|kayip|lost|iptal|red)/.test(x)) return "text-red-500";
  if (/(yeni|new|açık|acik)/.test(x)) return "text-blue-500";
  return "text-foreground";
}

export function SalesDashboard() {
  const { data, loading, error, execute } = useApiRequest<LeadsResponse>();
  const [q, setQ] = useState("");

  const load = () => execute("/api/nocodb-leads");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leads = useMemo(() => data?.list ?? [], [data]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    leads.slice(0, 20).forEach((r) =>
      Object.keys(r).forEach((k) => {
        if (!HIDDEN.has(k)) keys.add(k);
      })
    );
    return Array.from(keys).slice(0, 9);
  }, [leads]);

  const filtered = useMemo(() => {
    if (!q.trim()) return leads;
    const needle = q.toLowerCase();
    return leads.filter((r) =>
      Object.values(r).some((v) => val(v).toLowerCase().includes(needle))
    );
  }, [leads, q]);

  const statusKey = columns.find((c) => /durum|status|stage/i.test(c));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Satış — Lead'ler</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          NocoDB'deki müşteri adayları (salt görüntüleme). Renkler: 🟢 kazanıldı ·
          🟡 takipte · 🔴 kayıp · 🔵 yeni.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Lead ara (ad, telefon, kanal...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Yenile
        </Button>
        {!loading && !error && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {leads.length} kayıt
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <p className="text-muted-foreground">Kayıt bulunamadı.</p>
      )}

      {!loading && !error && leads.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-left font-medium whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={i}
                  className="border-t border-border hover:bg-muted/30"
                >
                  {columns.map((c) => {
                    const text = val(r[c]);
                    const isStatus = c === statusKey;
                    return (
                      <td
                        key={c}
                        className={`px-3 py-2 align-top max-w-[260px] truncate ${
                          isStatus ? statusColor(text) + " font-medium" : ""
                        }`}
                        title={text}
                      >
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
