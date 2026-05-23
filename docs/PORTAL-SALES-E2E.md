# Portal Sales E2E Runbook + Hardening Audit

PR #13 (portal Sales sekmesi) için H-8/H-9/H-10 birleşik runbook'u. mind-id'de unit test framework kurulu olmadığı için (`No Testing` — `CLAUDE.md`), bu üç koruma katmanı **statik kod audit + manuel E2E checklist** olarak konsolide edildi. Gelecek iş için Vitest setup önerisi sonda.

> İlgili PR'lar:
> * **mind-id PR #13** — bu repo, Sales sekmesi + canlı agent durumları
> * **mind-agent PR #24** — backend `/sales/*` endpoint'leri
> * **mind-agent PR #34** — Publisher (LinkedIn/IG) cutover
>
> Deploy sırası: mind-agent #24 main → mind-agent canary → mind-id #13 main → Vercel preview/prod.

---

## ✅ Contract Doğrulaması — DRIFT YOK

ADIM 3 hardening sırasında mind-agent `src/tools/sales/reporting_tools.py` cross-verify edildi. Backend dönüşleri ile portal `components/businesses/tabs/sales-tab.tsx` field isimleri TAM UYUMLU:

| Endpoint | Portal bekliyor | Backend `_*_impl` döner | Durum |
|---|---|---|---|
| `/sales/leads/count` | `{ success, count }` | `{ success, count }` | ✅ |
| `/sales/leads/funnel` | `{ success, data[].asama/count }` | `{ success, data[].asama/count, total, schema }` | ✅ |
| `/sales/outreach/status` | `{ success, sent_today, sent_last_hour, daily_limit, remaining }` | `{ success, sent_today, daily_limit, remaining, percent_used, sent_last_hour }` | ✅ |
| `/sales/outreach/health` | `{ success, active, paused, reason, configured }` | `{ success, configured, active, paused, reason, paused_at? }` | ✅ |

**Sonuç:** Backend ↔ portal sözleşmesi sağlam, ek shim gerekmiyor. Mind-agent PR #24 `tests/test_sales_api_contract.py` H-1 testi de bu isimleri snapshot olarak donduruyor — gelecekteki sessiz drift CI'da yakalanır.

> Gelecekte yeni endpoint eklendiğinde veya field rename yapılmak istendiğinde **iki PR aynı anda merge edilmeli** (mind-agent + mind-id). Bu kuralı runbook sonundaki "Future work" bölümüne ekleyin.

---

## H-8 — Bearer token leak audit (statik)

`app/api/sales/[...path]/route.ts` token'ı şu yollardan **expose etmemeli**:

| Vektör | Mevcut durum | Audit sonucu |
|---|---|---|
| Response body | `new NextResponse(text, ...)` — sadece upstream text döner | ✅ `token` body'ye girmiyor |
| Error message | Catch bloğu `target` URL'ini döner, `token`'ı koymaz | ✅ |
| Vercel function log | `console.log` çağrısı yok | ✅ |
| Browser DevTools Network | `Authorization` header sadece server-side fetch'te eklenir, browser request'inde değil | ✅ doğrulandı (line 67-69) |
| Client component prop | Token import'u sadece `process.env` üzerinden; client component'a geçmiyor | ✅ |
| Build artifact (`.next/`) | Server-only env var (`SALES_API_TOKEN`, `NEXT_PUBLIC_` prefix YOK) | ✅ doğru naming |

**Sonuç:** Mevcut implementation güvenli. Manuel doğrulama için aşağıdaki "Adım 5" checklist'inde browser DevTools incelemesi var.

### Regression-koruyucu kural
`SALES_API_TOKEN` env'i **asla** `NEXT_PUBLIC_` prefix ile yeniden adlandırılmamalı. Bunu PR review checklist'ine ekleyin.

---

## H-9 — Sales tab UI shape audit (statik)

`components/businesses/tabs/sales-tab.tsx` 4 metrik kartı:

| Kart | State key'i | Empty davranış | Error davranış |
|---|---|---|---|
| Sıcak Lead | `count` | `count: 0` gösterir, hata yok | Hata mesajı + retry butonu |
| Funnel | `data[]` | "Henüz lead yok" placeholder | Aynı |
| Outreach Status | `sent_today/remaining` | "Bugün henüz mesaj atılmadı" | Aynı |
| Pause Badge | `paused` bool | Yeşil "Aktif" | Kırmızı "Duraklatılmış" + reason |

### Görsel doğrulama referansı
- Sıcak Lead kartı: turuncu Flame icon + sayı
- Funnel: yatay bar, her aşama `STAGE_COLORS` haritasından renk
- Outreach status: gönderim hızı + kalan kapasite
- Pause badge: sayfanın üstünde global uyarı şeridi (PauseCircle/PlayCircle icon)

Component shape'i değişirse (yeni metrik kart eklenirse) bu tablo aynı PR'da güncellenmeli.

---

## H-10 — Manuel E2E Smoke Checklist

Her deploy sonrası (Vercel preview veya prod) bu sıra ile geç:

### Adım 1 — Vercel preview deploy
```bash
# Branch'i PR olarak aç (varsa)
gh pr view --json url -q .url
# veya direkt local Vercel preview:
npx vercel
```
Vercel preview URL'ini al; aşağıda `$PORTAL_URL` olarak kullan.

### Adım 2 — Env doğrula
Vercel dashboard → Settings → Environment Variables → `SALES_API_TOKEN` Production + Preview'da olmalı.
```bash
# CLI ile doğrulama
vercel env ls | grep SALES_API_TOKEN
```

### Adım 3 — Backend ayakta mı?
```bash
curl -sf -H "Authorization: Bearer $SALES_API_TOKEN" \
  "$AGENT_URL/sales/leads/count" | jq .success
# Beklenen: true
```

### Adım 4 — Portal proxy uçtan uca (drift detect)
```bash
# Önce token olmadan — 401 dönmeli
curl -s -o /dev/null -w '%{http_code}\n' "$AGENT_URL/sales/leads/count"
# Beklenen: 401

# Portal proxy üzerinden (browser'da çerez yok, JS olmadan)
curl -sf "$PORTAL_URL/api/sales/leads/count" | jq .
# Beklenen: 200 + {success: true, count: <int>, ...}

# Funnel — data field dolu mu, stage shape doğru mu?
curl -sf "$PORTAL_URL/api/sales/leads/funnel" | jq '{success, n_stages: (.data | length), first_stage_keys: (.data[0] | keys)}'
# Beklenen: { "success": true, "n_stages": >=1, "first_stage_keys": ["asama", "count"] }
```

### Adım 5 — Browser DevTools (token leak kontrol)
1. `$PORTAL_URL/?business=<id>` aç, Sales sekmesine geç
2. Chrome DevTools → Network panel
3. `leads/count` request'ine tıkla → Headers
4. **Request headers'ta `Authorization` header GÖRMEMELISIN** (browser, proxy'ye anonim request atar; proxy server-side'da header'ı yukarı geçirir)
5. Response body'sinde `SALES_API_TOKEN` veya başka secret string'i yok
6. Console → token değerini `console.log`'lamaya çalışmış kod yok (`window.SALES_API_TOKEN` undefined olmalı)

### Adım 6 — UI smoke (4 metrik kart)
1. Sıcak Lead kartı: sayı dolu, "0" gösterilse bile UI hatasız
2. Funnel kartı: en az 1 stage barı görünür (gerçek lead varsa)
3. Outreach Status kartı: "Bugün X mesaj atıldı" gibi insan-okur metin
4. Pause badge: hem aktif (yeşil) hem paused (kırmızı + reason) state'leri test et
   - Test için backend'de `outreach_pause` tool'unu çağırıp ekrana yansıyıp yansımadığını gör

### Adım 7 — Business preview card + canvas
1. Business listesinde her kartın altında özet metrik şeridi (PR `business-preview-card.tsx`)
2. Anasayfa canvas'ında agent state'leri güncel (yeşil/sarı/kırmızı düğümler)
3. `useLiveAgentStates.ts` hook 30 sn'de bir yenilenmeli (Network panel'de polling görünür)

### Kabul kriterleri
- [ ] Adım 4'te `n_stages >= 1` ve `first_stage_keys == ["asama","count"]`
- [ ] Adım 5'te token DevTools'ta hiçbir yerde görünmüyor
- [ ] Adım 6'da 4 metrik kart dolu (veya doğru empty state)
- [ ] Console'da hata yok
- [ ] Pause state değişikliği UI'a 30 sn içinde yansıyor

Tek madde kırmızıysa: PR #13 merge'ini geri al ve drift sebebini fix'le.

---

## Rollback

```bash
# Vercel previous deployment'a hızlı geçiş
vercel rollback <previous-deployment-url> --scope=seymaakrs-slowdays-web
```

veya GitHub UI'dan PR'ı revert et + Vercel otomatik yeniden deploy eder.

---

## Future work — Vitest setup önerisi

mind-id'ye unit/integration test koymak için (öncelik düşük; manuel checklist şu an yeterli):

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true, setupFiles: ["./vitest.setup.ts"] },
});
```

İlk eklenecek 3 test:
1. `app/api/sales/[...path]/route.test.ts` — token env yoksa 503, token ile 200, response body'de token yok (H-8 otomatize)
2. `components/businesses/tabs/sales-tab.test.tsx` — 4 metrik kart shape + empty/error state (H-9 otomatize)
3. `hooks/useBusinessSummary.test.ts` — brand identity completeness hesabı

`package.json` script: `"test": "vitest run", "test:watch": "vitest"`.

Bu kurulum ayrı bir PR (~150 satır) olarak girer; bu runbook'un manuel checklist'ini deterministik CI gate'e dönüştürür.

---

## İlgili dosyalar

* `app/api/sales/[...path]/route.ts` — Bearer-token proxy
* `components/businesses/tabs/sales-tab.tsx` — 4 metrik kart UI
* `hooks/useOutreachHealth.ts` — pause polling (30 sn)
* `hooks/useBusinessSummary.ts` — brand completeness
* `components/mind-id-canvas/useLiveAgentStates.ts` — canvas state polling
* mind-agent PR #24 `src/app/sales_api.py` — backend endpoints
* mind-agent `docs/SALES-API-DEPLOY-RUNBOOK.md` — token rotation
