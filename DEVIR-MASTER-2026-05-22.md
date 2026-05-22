# 📋 MASTER DEVİR NOTU — 2026-05-22 (KAPANIŞ)

> Bu, **iki paralel session'ın** (Session A: canlı test sprint / Session B: Durum paneli + v1.23.0 plan) birleştirilmiş tek devir notudur. Eski `DEVIR-2026-05-22-canli-test.md` (mind-agent) ve `HANDOFF-2026-05-22.md` (mind-id) bu dosya tarafından **superseded** edildi.

## 🏆 BU SESSION'IN KAZANIMLARI (sırayla)

1. ✅ İki HANDOFF konsolidasyonu — branch sürüklenmesi çözüldü
2. ✅ `versions.json` + `StatusVersionPanel.tsx` URL fix
3. ✅ OpenAI key v1 push (revision `00004-7sl`) → smoke test 133 lead
4. ✅ PR #15 (Durum paneli) + PR #16 (master devir) merge → production deploy
5. ✅ Admin custom claim: Seyma (seymaakrs@gmail.com) + Beyza (beyzakara0119@gmail.com)
6. ✅ Firestore `settings/app_settings.serverUrl` doğrulama
7. ✅ Zernio webhook keşif — n8n `lead-toplama` zaten 21 gündür aktif
8. ✅ OpenAI key v2 rotate (revision `00006-28b`)
9. ✅ NocoDB token v2 rotate
10. ✅ **NocoDB HTTPS sertifikalı domain:** `db.mindidai.com.tr` (Let's Encrypt + Caddy reverse proxy)
11. ✅ Caddy IP whitelist: NocoDB UI sadece Seyma IP (`185.98.219.69`), API public (mind-agent için)
12. ✅ Cloud Run `NOCODB_BASE_URL` → `https://db.mindidai.com.tr` (revision `00008-bnk`)
13. ✅ Smoke test (HTTPS NocoDB üzerinden) — 133 sıcak lead
14. ✅ **Zernio webhook Signing Secret aktive edildi** (HMAC-SHA256, panel-side)

---

## 🔴 KABUL EDİLEN GÜVENLİK BORÇLARI (Seyma bilinçli bıraktı)

| Secret | Sızıntı | Karar | Risk |
|---|---|---|---|
| OpenAI key `mind-agent-prod` (sk-...xhUA) | Chat 2026-05-22 | Revoke etmedik | Auto-recharge ON → kart yanma riski (cap yok) |
| Eski OpenAI keys (`...CkUA`, vb.) | Önceki session | Revoke etmedik | Geçmişte canlı'ydı, şu an kullanılmıyor |
| NocoDB token `claude-setup` + 2 eski token | Önceki session | Revoke etmedik | Lead DB API erişimi (HTTPS sertifika ile aktif) |
| NocoDB token v2 (`Q6EA` ile başlayan, LnH... full) | Chat 2026-05-22 | Cloud Run'da kullanılıyor | API erişimi |

**Yeniden rotate yapılana kadar bu key'leri silmeyin** — sızıntı olursa cap yok.

**Mitigasyon önerileri (ileride):**
- OpenAI auto-recharge OFF + usage alert ($5 günlük)
- Static egress IP + firewall (mind-agent → NocoDB tek IP)
- NocoDB token v3 rotate (chat'te kalmasın)

---

## 📊 GÜNCEL ALTYAPI HARITASI

```
Kullanıcı tarayıcı (Seyma IP: 185.98.219.69)
    ↓
mind-id.vercel.app (production)
    ↓
Cloud Run agents-sdk-api (revision 00008-bnk)
    OpenAI: key v2 (mind-agent-prod-v2)
    NocoDB URL: https://db.mindidai.com.tr ← HTTPS
    NocoDB Token: v2
    ↓
Caddy (NocoDB VM, port 443)
    IP whitelist: Seyma + API path open
    ↓
NocoDB container (127.0.0.1:8080)
    SQLite (volume: nocodb_data)
    133 sıcak lead
```

```
Zernio (WhatsApp/Instagram) → n8n cloud → lead-toplama workflow → NocoDB
  Zernio: Signing Secret AKTİF → X-Zernio-Signature gönderiyor
  n8n:    Signature doğrulama YOK (yarım koruma — ileride tam yapılacak)
```

---

## 🔑 Değer Sözlüğü

```
mind-agent Cloud Run:    https://agents-sdk-api-704233028546.us-central1.run.app
mind-id Vercel prod:     https://mind-id-gray.vercel.app
NocoDB HTTPS:            https://db.mindidai.com.tr (Caddy + Let's Encrypt)
NocoDB IP (admin):       34.26.138.196 (sadece HTTP→HTTPS redirect döner)

GCP deploy project:      instagram-post-bot-471518   (Cloud Run, Vertex)
Firebase project:        mindid-75079                (Auth, Firestore, Storage)
NocoDB VM project:       mindid-lab (VM: mindid-nocodb, us-east1-d, e2-micro)
Domain:                  mindidai.com.tr (türkticaret, 03 Nisan 2027'ye kadar)

Compute SA:              704233028546-compute@developer.gserviceaccount.com
Firebase admin SA:       firebase-adminsdk-fbsvc@mindid-75079.iam.gserviceaccount.com

NocoDB tables:
  Leadler          m5lcgc5ifeqh38h
  Etkilesimler     mx3kbw2vhwimxjf
  system_settings  mzpphfqirl8njoe
  workspace        wgh5kblj
  base             ps9dj2fqrh823av

Zernio:
  WA_ACCOUNT_ID:    69ecc2273a63baf2053dfc21
  WEBHOOK_SECRET:   Zernio panel "Mind Sales — Lead Toplama" → Signing Secret (2026-05-22 set, sadece panelden görünür)
  Base URL:         https://api.zernio.com/v1
  Imza formatı:     X-Zernio-Signature: lowercase hex HMAC-SHA256(rawBody, secret)

GUARDIAN_ALERT_WEBHOOK_URL: https://mindidai.app.n8n.cloud/webhook/lead-toplama

Rollback (eski stabil):
  gcloud run services update-traffic agents-sdk-api --region=us-central1 \
    --to-revisions=agents-sdk-api-00004-7sl=100

Current canlı revision: agents-sdk-api-00008-bnk (v2 OpenAI + v2 NocoDB token + HTTPS NocoDB URL)

Branch (3 repo): claude/zen-wozniak-LEuNW
mind-id default: main (PR #15 + #16 merged)
```

---

## ⏭ ATLAR / İLERİDE

| İş | Neden Atlandı | Süre Tahmini |
|---|---|---|
| **n8n HMAC doğrulama** (Zernio signature verify) | Production workflow'u modifiye etmek + raw body capture risk. Test workflow'da güvenli yapılmalı | 1-1.5 saat |
| customer_agent eksik 3 workflow (LinkedIn/Clay/IG DM) | Yeni workflow inşası, ayrı sprint | 2-4 saat her biri |
| v1.23.0 atomik plan | Mevcut canlı yeterli. İhtiyaç çıkarsa tekrar bak | 3-5 saat |
| Cloud Run static egress IP + tam firewall | $5-8/ay maliyet kabul edilmedi | 45 dk |
| Tüm key/token nihai revoke | Kullanım kopukluğu riski kabul edilmedi | 15 dk |
| Lead Onboarding workflow aktive (n8n) | 133 sıcak lead'e gerçek mail gider — onay gerek | 5 dk |
| OpenAI auto-recharge OFF + usage alert | Henüz yapılmadı, opsiyonel ek güvenlik | 5 dk |
| mind-agent secrets → GCP Secret Manager | env var yerine secret mount | 1 saat |

---

## 📝 N8N HMAC DOĞRULAMASI — İLERİDE YAPMA REHBERİ

Lead Toplama Agent workflow'una eklenmesi gereken kod (raw body alabilmek için Webhook node'unda `options.rawBody = true` aktive edilmeli):

```javascript
// Code node: "Verify Zernio Signature" (Webhook → BU NODE → Calculate Lead Score)
const crypto = require('crypto');
const secret = $env.ZERNIO_WEBHOOK_SECRET; // n8n env var, panelden alınır

const headers = $input.first().json.headers || {};
const signature = headers['x-zernio-signature'] || headers['X-Zernio-Signature'];

// Raw body — webhook node options.rawBody=true gerek
const rawBody = Buffer.from($input.first().binary.data.data, 'base64').toString('utf8');

if (!signature) {
  // No signature — reject (post-rotation, all real Zernio sends signature)
  console.log('REJECTED: no signature');
  return [];
}

const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

if (signature !== expected) {
  console.log('REJECTED: signature mismatch');
  return [];
}

// Valid — pass parsed body to next node
return [{ json: { body: JSON.parse(rawBody), headers } }];
```

**Test stratejisi:**
1. Lead Toplama Agent'ı duplicate → "Lead Toplama Agent (HMAC Test)"
2. Test workflow URL'ini Zernio'da SADECE test event'i için kullan
3. 1-2 gerçek delivery sonra production swap

---

## 🚧 Gelecekte Tekrar Etmemek İçin Tuzaklar

1. Cloud Run aynı dizine birden fazla secret mount edemiyor — ayrı path
2. Cloud Run default port 8080, uvicorn 8000 — `--port=8000` zorunlu
3. SA `secretAccessor` rolü secret mount öncesi gerekli
4. Cloud Shell preview proxy POST + NDJSON'i koparıyor — Vercel preview kullan
5. mind-id dev mode `testServerUrl` öncelikli — ikisini de set et
6. Firestore rules `match /{document=**}` global write tehlikeli → per-collection
7. **İki paralel Claude session = branch sürüklenmesi** — master devir notunu güncel tut
8. **Secret'ları doküman/kod/chat'e asla yazma** — GitHub secret scanning yakalar
9. `gcloud run services update` multi-line Cloud Shell'de bozulabilir — tek satır kullan
10. **Placeholder yapıştırmadan komut çalıştırma** — `read -s VAR` ile değişkene al, length doğrula, sonra `$VAR`
11. **VM vs Cloud Shell prompt karışıklığı** — komutları çalıştırmadan önce prompt'u (`@mindid-nocodb` vs `@cs-...`) doğrula
12. NocoDB Docker container recreate olduğunda volume `nocodb_data` mutlaka mount edilmeli (yoksa veri kaybı)
13. Caddy port 80'i Let's Encrypt yenileme + HTTP→HTTPS redirect için kullanır — port 80 firewall kuralı asla silinmemeli
14. **Webhook HMAC verification'ı production'da direkt değiştirme** — raw body re-serialize sorunu sessizce tüm istekleri reddedebilir, lead'ler kaçar

---

## 👤 Seyma Notları

- Kurucu, kod bilmiyor, sade dil
- A/B seçenek sun
- Step by step + ultra mühendislik
- Cloud Shell aktif kullanıcı (`seymaakrs@cs-491899653936-default`)
- Tablo + emoji renk
- Tarayıcı IP: `185.98.219.69` (2026-05-22 itibariyle, ISP'inde değişebilir)

---

## 📌 Önceki Devir Notları (superseded)

- `mind-agent/docs/DEVIR-2026-05-22-canli-test.md` (Session A)
- `mind-id/HANDOFF-2026-05-22.md` (Session B)

---

**Yeni session başlatan Claude:**
1. Önce bu master dosyayı oku
2. `mind-agent/docs/versions.json`'a bak (Durum paneli buradan okuyor)
3. Seyma'ya "şimdi nereden devam ediyoruz?" diye sor
4. Güvenlik borçlarını unutma — yanlışlıkla key/token silmeden önce Seyma'ya sor
