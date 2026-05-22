# 📋 MASTER DEVİR NOTU — 2026-05-22

> Bu, **iki paralel session'ın** (Session A: canlı test sprint / Session B: Durum paneli + v1.23.0 plan) birleştirilmiş tek devir notudur. Eski `DEVIR-2026-05-22-canli-test.md` (mind-agent) ve `HANDOFF-2026-05-22.md` (mind-id) bu dosya tarafından **superseded** edildi.

## 🔴 KABUL EDİLEN GÜVENLİK BORÇLARI (Seyma bilinçli bıraktı)

Aşağıdaki secret'lar **chat geçmişinde / screen recording'de açıkta** ama Seyma kullanım kopukluğu riskini tercih etmedi:

| Secret | Sızıntı Yeri | Karar Tarihi | Risk Açıklaması |
|---|---|---|---|
| OpenAI key `mind-agent-prod` (sk-...xhUA) | Chat (2026-05-22) | 2026-05-22 | Auto-recharge ON → kart yanma riski; Seyma "kalsın chat geçmişini kimse görmez" dedi |
| NocoDB token `claude-setup` | Chat (önceki session) | 2026-05-22 | Lead DB erişimi → KVKK; Seyma chat görünme riskini kabul etti |

**Yeniden rotate yapılana kadar bu key'leri silmeyin** — yanlışlıkla silen önce Seyma'ya sorsun.

**Mitigasyon önerileri (yapılırsa):**
- OpenAI auto-recharge OFF + usage alert ($5 günlük)
- NocoDB → VPC connector (token sızsa bile dış IP'den erişilemez)

---

## 🎯 Bu Session'da Yapılanlar (Session D — konsolidasyon)
- ✅ İki HANDOFF okundu, çakışmalar tespit edildi
- ✅ OpenAI key yenilendi (Seyma → MindID/Default project, $9.56 + auto-recharge)
- ✅ `mind-agent/docs/versions.json` oluşturuldu (branch: `claude/zen-wozniak-LEuNW`)
- ✅ `StatusVersionPanel.tsx` URL'i düzeltildi (bozuk branch → `claude/zen-wozniak-LEuNW`)
- ✅ Cloud Run env update (revision `00004-7sl` → smoke OK)
- ✅ E2E smoke: 133 sıcak lead chat'ten döndü
- ✅ Admin custom claim: Seyma + Beyza
- ✅ PR #15 (Durum paneli) + PR #16 (master devir) merge → production canlı
- ✅ Firestore `settings/app_settings.serverUrl` doğrulandı
- ✅ Zernio webhook zaten aktif (n8n lead-toplama, 21 gündür çalışıyor)
- ✅ OpenAI key rotate v2 (revision `00006-28b`) — eski key chat'te kalıyor, kabul edilen borç
- ⏳ NocoDB token rotate (devam ediyor)

## 🚨 Kritik Tespit: İki Branch Sürüklenmesi
| Konu | Session A | Session B |
|---|---|---|
| Branch | `claude/vibrant-brown-qENng` (remote'da yok) | `claude/fervent-knuth-t10qy` |
| GCP project | `instagram-post-bot-471518` (canlı revision burada) | `mindid` (handoff ana diyor) |
| Cloud Run revision | `00003-r99` (v1.23.0) | `00034-vgb` (v1.22.6, rollback noktası) |

**Karar:** Bu session'dan itibaren tek branch — `claude/zen-wozniak-LEuNW` (3 repo için).
Canlı GCP project: **`instagram-post-bot-471518`** (DEVIR-canli-test'in gerçek deploy'u burada).

## 🔑 OpenAI Key Durumu (güncel)
- **Canlı (Cloud Run):** `mind-agent-prod-v2` (sk-...Q6EA) — revision `00006-28b`
- **Açıkta (revoke edilmedi, bilinçli borç):** `mind-agent-prod` (sk-...xhUA), eski `...CkUA`
- $9.56 credit + auto-recharge ON

## 📋 Açık İşler (öncelik sırası)

| # | İş | Sahibi | Engel |
|---|---|---|---|
| 1 | ~~OpenAI key Cloud Run'a push~~ | ✅ Bitti | — |
| 2 | ~~E2E smoke test~~ | ✅ 133 lead | — |
| 3 | ~~OpenAI key rotate~~ | ✅ v2 canlı (revoke borç) | — |
| 4 | mind-agent lokal push | ✅ Bitti (sadece chmod) | — |
| 5 | Zernio webhook | ✅ Zaten aktif | — |
| 6 | ~~PR #15 + #16 merge~~ | ✅ Bitti | — |
| 7 | mind-id production deploy | ✅ Otomatik | — |
| 8 | ~~Admin custom claim~~ | ✅ Seyma + Beyza | — |
| 9 | NocoDB token rotate | ⏳ Şu an | Seyma |
| 10 | NocoDB HTTPS + VPC connector | 🟢 İleride | Ayrı sprint |
| 11 | Firestore rules sıkılaştırma | 🟢 İleride | — |
| 12 | v1.23.0 atomik plan | 🟢 İleride | Ayrı sprint |
| 13 | customer_agent (n8n) entegrasyonu | 🟢 İleride | Ayrı sprint |
| 14 | OpenAI key + NocoDB token nihai revoke | 🔴 Borç | Seyma kabul etti |

## 🔑 Değer Sözlüğü

```
mind-agent Cloud Run:    https://agents-sdk-api-704233028546.us-central1.run.app
mind-id Vercel preview:  https://mind-wscdmowoc-seymaakrs-slowdays-web.vercel.app
mind-id Vercel prod:     https://mind-id-gray.vercel.app
NocoDB:                  http://34.26.138.196

GCP deploy project:      instagram-post-bot-471518   (Cloud Run, Vertex — CANLI)
Firebase project:        mindid-75079                (Auth, Firestore, Storage)
Artifact Registry:       us-central1-docker.pkg.dev/instagram-post-bot-471518/agents-sdk
Compute SA:              704233028546-compute@developer.gserviceaccount.com
Firebase admin SA:       firebase-adminsdk-fbsvc@mindid-75079.iam.gserviceaccount.com

NocoDB tables:
  Leadler          m5lcgc5ifeqh38h
  Etkilesimler     mx3kbw2vhwimxjf  (notifications da buraya, tur='bildirim')
  system_settings  mzpphfqirl8njoe
  workspace        wgh5kblj
  base             ps9dj2fqrh823av

Zernio:
  WA_ACCOUNT_ID:    69ecc2273a63baf2053dfc21
  WEBHOOK_SECRET:   <SECRET_MANAGER'DAN_AL>
  Base URL:         https://api.zernio.com/v1

GUARDIAN_ALERT_WEBHOOK_URL: https://mindidai.app.n8n.cloud/webhook/lead-toplama
Langfuse: Hem LANGFUSE_HOST hem LANGFUSE_BASE_URL set et

Rollback komutu (eski stabil):
  gcloud run services update-traffic agents-sdk-api --region=us-central1 \
    --to-revisions=agents-sdk-api-00004-7sl=100

Current canlı revision: agents-sdk-api-00006-28b (v2 OpenAI key)

Branch (3 repo, bu session'dan itibaren): claude/zen-wozniak-LEuNW
```

## 🤝 4 Repo Ailesi
| Repo | Branch | Rol |
|---|---|---|
| mind-id | `main` (merged) / `claude/zen-wozniak-LEuNW` | Salon + garson (Next.js panel) |
| mind-agent | `claude/zen-wozniak-LEuNW` | Mutfak (FastAPI + 5 ajan) |
| customer_agent | `claude/zen-wozniak-LEuNW` | Pazarlama (n8n + 6 satış ajanı) |
| mindid-nocodb | — | Depo (CRM + lead DB) |

## 🚧 Gelecekte Tekrar Etmemek İçin Tuzaklar
1. Cloud Run aynı dizine birden fazla secret mount edemiyor — ayrı path
2. Cloud Run default port 8080, uvicorn 8000 — `--port=8000` zorunlu
3. SA `secretAccessor` rolü secret mount öncesi gerekli
4. Cloud Shell preview proxy POST + NDJSON streaming'i koparıyor — Vercel preview kullan
5. mind-id dev mode `testServerUrl` öncelikli — ikisini de set et
6. `firestore.rules` global write false → 30+ client-side write koparıyor; Seyma `{collection}/{document=**}` formatına çevirdi
7. **İki Claude session paralel çalışırsa branch sürüklenmesi olur** — bu master devir notunu güncel tut
8. **Secret'ları asla doküman/kod/chat'e yazma** — sadece Secret Manager. GitHub secret scanning push'u bloke ediyor (test edildi)
9. **`gcloud run services update` multi-line backslash Cloud Shell'de bozulabilir** — tek satır kullan veya `--update-env-vars=KEY=$VAR` formatı
10. **Placeholder yapıştırmadan komut çalıştırma** — `read -s VAR` ile değişkene al, length doğrula, sonra `$VAR` kullan

## 👤 Seyma Notları
- Kurucu, kod bilmiyor, sade dil
- A/B seçenek sun
- Step by step + ultra mühendislik
- Cloud Shell aktif kullanıcı (`seymaakrs@cs-491899653936-default`)
- Tablo + emoji renk

## 📌 Önceki Devir Notları (superseded)
- `mind-agent/docs/DEVIR-2026-05-22-canli-test.md` (Session A)
- `mind-id/HANDOFF-2026-05-22.md` (Session B)

**Yeni session başlatan Claude:** Önce bu master dosyayı oku, sonra `mind-agent/docs/versions.json`'a bak, sonra Seyma'ya "şimdi nereden devam ediyoruz?" diye sor.
