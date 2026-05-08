# SESSION HANDOFF — 2026-05-08

> Bu dosya bir Claude oturumundan diğerine bilgi aktarımı için yazıldı.
> Şeyma yalnız çalışıyor (Burak ayrıldı). Yeni oturum açıldığında **önce bunu oku.**

---

## 🚨 KRİTİK: ŞU AN DOKUNULMAMASI GEREKEN ŞEYLER

### 1. `main` branch'ine push YAPMAYIN
- Site şu an **2 Mayıs tarihli eski bir Deploy Preview**'in manuel "Publish deploy" ile aktive edilmiş hali ile ayakta
- Netlify'a giden her yeni başarılı build, bu manual publish'in üzerine yazar
- Yeni build crash etmese bile (yani build başarılı olsa bile), runtime'da Lambda OpenSSL crash'i nedeniyle site **"This function has crashed"** ekranına döner
- **Vercel'a geçilene kadar main'e tek bir commit bile gitmemeli**

### 2. Netlify "publish" durumunu bozmayın
- Netlify dashboard'unda en üstte yeşil **"Production: main@768c0f9"** (PR #5'in deploy preview'i) görünmeli
- Eğer farklı bir deploy "Published" olarak görünüyorsa, **manual publish gitmiş** demektir, site yine kırık
- Düzeltme: Deploys → Successful filter → 2 Mayıs tarihli "fix(business-details): ..." Deploy Preview → "Publish deploy"

---

## 📍 PRODUCTION DURUMU

| Sistem | Repo | Platform | Durum |
|---|---|---|---|
| **mind-id** (Next.js panel) | `seymaakrs/mind-id` | Netlify | 🟠 Kırılgan ayakta — Vercel'a göç planlandı |
| **mind-agent** (orkestratör + ajanlar) | `seymaakrs/mind-agent` | Cloud Run | 🟢 Sorunsuz |
| **NocoDB** (CRM) | — | Self-hosted | 🟢 Sorunsuz |

---

## 💥 BUGÜN NE OLDU — KISA HİKAYE

1. Anasayfadaki React Flow canvas'ı "Şirinler Köyü" temasıyla yeniden tasarlamayı denedik (`components/canvas/village-canvas.tsx`)
2. Canlıya alırken Netlify'da **runtime crash** ile karşılaştık
3. Crash aslında **bizim canvas değişikliğimizle alakasız** olduğu ortaya çıktı:
   - `package.json`'a Mart 2026'da Next.js 16 eklenmişti (Burak tarafından)
   - Netlify Lambda ortamında Node 22 + Next.js 16 + bağımlılık zincirinde bir yerde **legacy OpenSSL crypto** çağrısı var
   - Lambda image'ında legacy provider `.so` dosyası yok → `Unable to load legacy provider` → process crash
4. Site haftalardır gerçekte kırıktı, sadece Netlify CDN cache eski içeriği gösteriyordu. Bizim yeni deploy denemelerimiz cache'i invalidate edince asıl bozuk durum görünür hale geldi.
5. Çözüm denemeleri (hepsi başarısız):
   - Next.js 16 → 15.5 downgrade (kalmalı, faydalı)
   - `NODE_VERSION = "20"` netlify.toml'a (kalmalı)
   - `firebase-admin / google-auth-library / @google-cloud/bigquery` upgrade (kalmalı, faydalı)
   - `NODE_OPTIONS=--openssl-legacy-provider` (kalmalı ama yetmedi)
6. Son çare: 2 Mayıs tarihli eski bir deploy'u "Publish deploy" ile aktive ettik — site bu şekilde ayakta

### Repo'da bıraktıklarımız

- `components/canvas/village-canvas.tsx` — yeni Şirinler köyü tasarımı, **dosyada duruyor ama hiçbir yerden import edilmiyor**, bundle'a girmez. Vercel'a geçtikten sonra `app/page.tsx`'te tek satırla aktive edilebilir.
- `docs/smurf-hierarchy-preview.html` — tasarımın statik HTML önizlemesi (referans amaçlı)
- `netlify.toml` — Node 20 pin + secrets scan + NODE_OPTIONS satırları var. Vercel geçişinde silinecek.

---

## 🎯 BEKLEYEN İŞLER (öncelik sırasıyla)

### 1. Vercel'a geçiş (acil, 1-2 saat)
**Neden:** Netlify Lambda Next.js 16 sürümünü çalıştıramıyor. Vercel = Next.js'in yapımcısı, native destek var.

**Adımlar:**
1. https://vercel.com → GitHub ile giriş
2. "Add New Project" → `seymaakrs/mind-id` seç → import
3. Build settings: Framework=Next.js (otomatik algılar), root="."
4. **Environment variables**: Netlify dashboard'undan kopyalayıp Vercel'a yapıştır:
   - `BASE_URL`, `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_BILLING_ACCOUNT_ID`
   - `OPENAI_ADMIN_KEY`
5. Deploy → preview URL'de test et
6. Çalışırsa: DNS'i Vercel'a yönlendir (Cloudflare/domain provider'dan)
7. Netlify'ı kapatma — 1 hafta yedek dursun
8. **Sonra**: `netlify.toml`'u sil, `app/page.tsx`'te `CommandCenterCanvas` → `VillageCanvas` swap et (Şirinler köyü için)

**Beklenen sonuç:** Site Vercel'da çalışır, Şirinler köyü canvas'ı aktif olur, `firebase-admin` crypto crash'i Vercel'da olmaz (Vercel kendi serverless runtime'ı kullanır, AWS Lambda değil).

### 2. Görsel ajan: Gemini → OpenAI (orta öncelik, 1 saat)
**Neden:** Şeyma OpenAI'nin yeni image modeline (gpt-image-1 / DALL-E 3) geçmek istiyor.

**Repo:** `seymaakrs/mind-agent` (mind-id DEĞİL — bu mind-id'yi etkilemez)

**Değişecek dosyalar:**
- `src/tools/image_tools.py` → Gemini client → OpenAI client
- `src/agents/instructions/image.py` → prompt tuning (modeller farklı stil bekler)
- `settings/app_settings` Firestore doc → `imageGenerationModel` alanı
- `OPENAI_API_KEY` env zaten var (orchestrator için)

**Süreç:**
1. mind-agent'ta yeni branch
2. Değişiklikleri yap
3. Lokalde `DRY_RUN=true` ile test
4. Bir-iki örnek görsel üret, kalite + maliyet karşılaştır (OpenAI Gemini'den ~3-5x pahalı)
5. Onaylarsan Cloud Run'a deploy

### 3. Güvenlik temizliği (düşük öncelik)
- `netlify.toml`'da `SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"` var — Vercel geçişinde bu dosya zaten silinecek, sorun kendi kendine çözülür
- `.env.local` ve `.env` dosyaları repo'da görünüyor (`.gitignore`'da olmalı ama olmayabilir) — Şeyma'nın kontrol etmesi lazım

---

## 🧠 ŞEYMA HAKKINDA NOTLAR (yeni Claude oturumu için)

- Tek başına solo developer, junior seviye yazılım mühendisi
- Türkçe konuşmayı tercih ediyor
- Açıklamaları sade ve örnekli istiyor — abartılı jargon istemiyor
- Önce **lokalde Cloud Shell'de test et**, sonra canlıya al; sürpriz canlı bozulmasın
- Risk veya ambiguity varsa **dokunmadan önce sor**, kendi başına denemen gerekmiyor
- Burak ayrıldı, eskisinin aksine "Burak'a sor" cevabı işe yaramaz, her şeyi sen ona açıklamalısın
- Tasarım ekibi yok — kod + tasarım + DevOps hepsi Şeyma'da

---

## 🔧 ÖNEMLİ KOMUTLAR (referans)

### Cloud Shell'de mind-id ile çalışma
```bash
cd ~/mind-id
git pull origin main
npm install   # veya: npx pnpm install
npm run build
npm start
# Web Preview: göz ikonu → port 3000
```

### Netlify deploy listesi
https://app.netlify.com/projects/mindid/deploys

### Vercel CLI (gerekirse)
```bash
npm install -g vercel
vercel login
vercel link
vercel --prod
```

---

## 📅 HANDOFF TARİHÇESİ

| Tarih | Yazan | Değişiklik |
|---|---|---|
| 2026-05-08 | Claude (chat oturumu) | İlk dokümantasyon, Netlify krizi sonrası |

> Yeni session açıldığında: Şeyma'ya **"Vercel migrasyonu şu durumda"** diye sorabilirsin. Eğer henüz yapılmadıysa "Vercel'a geçişe başlayalım" deyip yukarıdaki Adım 1'i izle.
