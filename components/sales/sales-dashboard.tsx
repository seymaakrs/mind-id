"use client";

import { useCallback, useRef, useState } from "react";
import { Send, TrendingUp, Users, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase/config";

/**
 * SalesDashboard — Şeyma'nın "kaç sıcak lead var?" soracağı sayfa.
 *
 * Mimari:
 *   browser  --POST /api/sales/query-->  mind-id route handler
 *                                           --POST /task-->  mind-agent
 *                                                              orchestrator
 *                                                              -> sales_query_agent
 *                                                              -> NocoDB
 *
 * Sayfanın 3 alanı var:
 *   - Üst: 4 hızlı metrik kartı (lead sayısı, sıcak, pipeline, kanal sayısı).
 *     İlk render'da boş, kullanıcı sorgu attıkça mind-agent'tan gelen rapor
 *     içinden değerleri çekip gösteriyoruz (best-effort).
 *   - Orta: chat arayüzü.
 *   - Alt: hızlı sorgu kısayolları.
 *
 * Konuşmayı state'te tutuyoruz (Q+A çiftleri); kalıcı saklama yok — çünkü
 * gerçek veri zaten NocoDB'de, sohbet sadece o veriye erişim arayüzü.
 */
type Turn = {
  id: string;
  role: "user" | "agent";
  text: string;
  status: "sending" | "ok" | "error";
};

const QUICK_PROMPTS = [
  "Kaç sıcak lead var?",
  "Bu hafta pipeline ne kadar?",
  "Hangi kanal en düşük CAC üretiyor?",
  "Bugün hangi otonom kararlar alındı?",
  "Agent'ların sağlık durumu?",
];

export default function SalesDashboard() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sendQuery = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      setError(null);

      const userTurn: Turn = {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
        status: "ok",
      };
      const pendingTurn: Turn = {
        id: crypto.randomUUID(),
        role: "agent",
        text: "Sales agent düşünüyor…",
        status: "sending",
      };

      setTurns((prev) => [...prev, userTurn, pendingTurn]);
      setBusy(true);
      setInput("");

      try {
        // Get fresh ID token for the API auth header.
        const user = auth?.currentUser;
        if (!user) throw new Error("Oturum sonlandı, lütfen tekrar giriş yapın.");
        const idToken = await user.getIdToken();

        const resp = await fetch("/api/sales/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ question: trimmed }),
        });

        const json = (await resp.json().catch(() => null)) as
          | { answer?: string; final_output?: string; error?: string; result?: string }
          | null;

        if (!resp.ok) {
          throw new Error(
            (json && (json.error as string)) ||
              `Agent hata kodu: HTTP ${resp.status}`
          );
        }

        const answer =
          json?.answer ||
          json?.final_output ||
          json?.result ||
          (typeof json === "string" ? json : "Agent yanıt vermedi.");

        setTurns((prev) =>
          prev.map((t) =>
            t.id === pendingTurn.id ? { ...t, text: answer, status: "ok" } : t
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
        setError(msg);
        setTurns((prev) =>
          prev.map((t) =>
            t.id === pendingTurn.id
              ? {
                  ...t,
                  text: `Hata: ${msg}. Lütfen tekrar deneyin.`,
                  status: "error",
                }
              : t
          )
        );
      } finally {
        setBusy(false);
        // Scroll bottom on next paint.
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* ----- Header / Quick Stats placeholder ---------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Sıcak Lead"
          value="?"
          hint="Skor 8+"
          accent="text-orange-400"
        />
        <StatCard
          icon={Users}
          label="Toplam Lead"
          value="?"
          hint="Tüm CRM"
          accent="text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Pipeline TL"
          value="?"
          hint="Açık değer"
          accent="text-emerald-400"
        />
        <StatCard
          icon={Target}
          label="Hedef"
          value="116K TL"
          hint="7 gün"
          accent="text-purple-400"
        />
      </div>

      {/* ----- Chat ------------------------------------------------------- */}
      <Card className="flex-1 flex flex-col min-h-[420px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot /> Sales Agent
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Doğal dilde sor — &quot;kaç sıcak lead var?&quot;, &quot;pipeline?&quot;, &quot;hangi
            kanal en iyi?&quot; — agent NocoDB&apos;den okur, Türkçe özetler.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[55vh] pr-1"
          >
            {turns.length === 0 ? (
              <EmptyState onPick={(p) => sendQuery(p)} />
            ) : (
              turns.map((t) => <Bubble key={t.id} turn={t} />)
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_PROMPTS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => sendQuery(p)}
              >
                {p}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sales agent'a sor (Enter = gönder, Shift+Enter = yeni satır)…"
              rows={2}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) sendQuery(input);
                }
              }}
              className="resize-none"
            />
            <Button
              type="button"
              onClick={() => sendQuery(input)}
              disabled={busy || !input.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {error ? (
            <p className="text-sm text-red-400 mt-2">⚠ {error}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Bot() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
      🌱
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          </div>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  const isUser = turn.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : turn.status === "error"
            ? "bg-red-900/30 border border-red-700"
            : "bg-muted"
        }`}
      >
        {turn.text}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
      <span className="text-4xl">🌱</span>
      <p className="text-muted-foreground text-sm">
        Sales agent hazır. Aşağıdaki kısayollardan birini deneyebilir veya
        kendi sorunu yazabilirsin.
      </p>
      <Button variant="ghost" size="sm" onClick={() => onPick(QUICK_PROMPTS[0])}>
        Örnek: {QUICK_PROMPTS[0]}
      </Button>
    </div>
  );
}
