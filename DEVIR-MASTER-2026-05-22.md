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
Beklemede: Zernio SSL düzelene kadar panel yönetimi açılmıyor
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
  WEBHOOK_SECRET:   <SECRET_MANAGER'DAN_AL>
  Base URL:         https://api.zernio.com/v1

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
| customer_agent (n8n) entegrasyonu | n8n'de 8 workflow zaten aktif. Eksik 3 (LinkedIn/Clay/IG DM) ayrı sprint | 1-3 saat |
| v1.23.0 atomik plan | Mevcut canlı yeterli. İhtiyaç çıkarsa tekrar bak | 3-5 saat |
| Zernio panel webhook | Zernio SSL bozuk (NET::ERR_CERT_DATE_INVALID). Düzelince. | 5 dk |
| Cloud Run static egress IP + tam firewall | $5-8/ay maliyet kabul edilmedi | 45 dk |
| Tüm key/token nihai revoke | Kullanım kopukluğu riski kabul edilmedi | 15 dk |

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
