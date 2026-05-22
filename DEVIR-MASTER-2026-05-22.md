# 📋 MASTER DEVİR NOTU — 2026-05-22

> Bu, **iki paralel session'ın** (Session A: canlı test sprint / Session B: Durum paneli + v1.23.0 plan) birleştirilmiş tek devir notudur. Eski `DEVIR-2026-05-22-canli-test.md` (mind-agent) ve `HANDOFF-2026-05-22.md` (mind-id) bu dosya tarafından **superseded** edildi.

## 🎯 Bu Session'da Yapılanlar (Session D — konsolidasyon)
- ✅ İki HANDOFF okundu, çakışmalar tespit edildi
- ✅ OpenAI key yenilendi (Seyma → MindID/Default project, $9.56 + auto-recharge)
- ✅ `mind-agent/docs/versions.json` oluşturuldu (branch: `claude/zen-wozniak-LEuNW`)
- ✅ `StatusVersionPanel.tsx` URL'i düzeltildi (bozuk branch → `claude/zen-wozniak-LEuNW`)
- ⏳ Cloud Run env update (Seyma Cloud Shell'de çalıştıracak)
- ⏳ Smoke test bekliyor

## 🚨 Kritik Tespit: İki Branch Sürüklenmesi
| Konu | Session A | Session B |
|---|---|---|
| Branch | `claude/vibrant-brown-qENng` (remote'da yok) | `claude/fervent-knuth-t10qy` |
| GCP project | `instagram-post-bot-471518` (canlı revision burada) | `mindid` (handoff ana diyor) |
| Cloud Run revision | `00003-r99` (v1.23.0) | `00034-vgb` (v1.22.6, rollback noktası) |

**Karar:** Bu session'dan itibaren tek branch — `claude/zen-wozniak-LEuNW` (3 repo için).
Canlı GCP project: **`instagram-post-bot-471518`** (DEVIR-canli-test'in gerçek deploy'u burada).

## 🔑 OpenAI Key Durumu
- **YENİ key (2026-05-22):** MindID/Default project, 164 char, $9.56 credit, auto-recharge ON
- **ESKİ key:** `...CkUA` ile biten — henüz revoke edilmedi (yeni doğrulanınca revoke)
- ⚠️ **Güvenlik borcu:** Yeni key chat geçmişinde açıkta yapıştırıldı → smoke test sonrası rotate edilmeli + GCP Secret Manager'a taşınmalı (kod/dokümana yazma)

## 🏃 Hemen Yapılacaklar (sıralı)

### 1. Cloud Run'a yeni OpenAI key push (Seyma Cloud Shell)
```bash
gcloud run services update agents-sdk-api \
  --project=instagram-post-bot-471518 \
  --region=us-central1 \
  --update-env-vars=OPENAI_API_KEY=<YENI_KEY_CHATTEN_AL>
```

### 2. Smoke test
- Vercel preview: https://mind-wscdmowoc-seymaakrs-slowdays-web.vercel.app
- Mesaj: `kac sicak lead var` → NocoDB sayısı dönmeli
- Mesaj: `son 3 lead listele` → gerçek data
- Mesaj: `modern banner görseli oluştur` → Gemini image
- Mesaj: `30 saniyelik tanıtım videosu` → Veo 3.1

### 3. Eski OpenAI key revoke + yeni key rotate
- platform.openai.com → eski (`...CkUA`) revoke
- Yeni key chat'te açıkta → rotate (yeni key oluştur, eskini revoke, Cloud Run güncelle)
- GCP Secret Manager'a koy, `--update-env-vars` yerine `--update-secrets` kullan

### 4. mind-agent lokal commit + push
Session A'nın Cloud Shell'deki lokal değişiklikleri (`scripts/deploy_v1_23_0.sh`, `.env`) push edilmeli. Yoksa canlı baseline kayıp.

## 📋 Açık İşler (öncelik sırası)

| # | İş | Sahibi | Engel |
|---|---|---|---|
| 1 | OpenAI key Cloud Run'a push | Seyma → Claude | — |
| 2 | E2E smoke test | Claude | #1 |
| 3 | Eski + yeni OpenAI key rotate, Secret Manager | Claude | #2 OK |
| 4 | mind-agent lokal push (`vibrant-brown-qENng`'in script'leri) | Seyma | Lokalden |
| 5 | Zernio panel webhook URL + HMAC switch | Seyma | — |
| 6 | mind-id PR #15 (Durum paneli) review + merge | Seyma | — |
| 7 | mind-id `vercel --prod` | Claude | #2 |
| 8 | Admin custom claim (Seyma/Emir/Beyza UID) | Seyma | — |
| 9 | NocoDB token revoke + Secret Manager | Claude | Test bitince |
| 10 | NocoDB HTTPS + VPC connector | Claude | — |
| 11 | Firestore rules sıkılaştırma | Claude | — |
| 12 | v1.23.0 atomik plan (Faz B1/B2/C/D) | Claude | Ayrı sprint |
| 13 | customer_agent (n8n) entegrasyonu | — | Ayrı sprint |
| 14 | mind-id production URL (`mind-id-gray.vercel.app`) Firestore'a | Claude | #7 |

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

Rollback komutu:
  gcloud run services update-traffic agents-sdk-api --region=us-central1 \
    --to-revisions=agents-sdk-api-00034-vgb=100

Branch (3 repo, bu session'dan itibaren): claude/zen-wozniak-LEuNW
```

## 🤝 4 Repo Ailesi
| Repo | Branch | Rol |
|---|---|---|
| mind-id | `claude/zen-wozniak-LEuNW` | Salon + garson (Next.js panel) |
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
