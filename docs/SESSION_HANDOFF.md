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
- **Bunu engellemek için Faz 1'de Netlify'da "Stop builds" yapılacak**

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

**Önemli notlar:**
- **Custom domain kullanılmıyor** → site sadece `mindid.netlify.app` üzerinden açılıyor. Vercel'a geçtikten sonra URL `mind-id.vercel.app` olacak. DNS değişikliği gerekmez.
- **GitHub repo Şeyma'nın** (`seymaakrs/mind-id`). Burak `bnrks` olarak commit yapan kişiydi, repo onun değildi.
- **Vercel'da mevcut bir proje var:** `seyma 's project (Hobby)` → `mind-id`. Burak Apr 19'da deploy etmiş ama "Error: Forbidden 403" almış (env eksik veya auth hatası, tamamlanmamış geçiş).

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

## 🛠️ VERCEL MIGRASYON PLANI (ULTRA-MÜHENDİSLİK)

### Felsefe
Her adım **bağımsız doğrulanabilir** ve **geri alınabilir** olmalı. Bir adım başarısız olursa ondan önceki güvenli duruma dönmek **5 dakikadan kısa** sürmeli. Veritabanı (Firestore) Google Cloud'da bağımsız servis — hosting değişimi veriye dokunmaz.

### Faz 0 — Keşif & Ön Kontroller (15 dk, sıfır risk)

| # | İş | Nasıl | Doğrulama |
|---|---|---|---|
| 0.1 | Vercel'deki "Forbidden 403" gerçek hatasını gör | Vercel sayfasında **"Visit"** butonuna tıkla → tarayıcıda aç | Hata mesajını oku, sebebini anla |
| 0.2 | Vercel'in mevcut env değişkenlerini listele | Sol menü → **"Environment Variables"** | Hangi key'ler var, hangileri eksik bilelim |
| 0.3 | Netlify'ın canlı env değişkenlerini al | Netlify dashboard → Site config → Env vars → her birini "Reveal" → not al | Tüm key'lerin değerlerini bir text dosyasına yaz |
| 0.4 | Vercel'in son deploy log'una bak | Vercel sayfasında **Build Logs** kısmını aç | Build aşamasında uyarı/hata var mı, package versiyonu ne |
| 0.5 | Vercel-GitHub bağlantısı doğrula | https://github.com/settings/installations → "Vercel" var mı, `mind-id` repo erişimi var mı | Bağlantı kopuksa Vercel → Settings → Git → Disconnect → Connect ile yeniden bağla |

### Faz 1 — Netlify'ı Dondur (10 dk, sıfır risk)

Şu anki canlıya hiç dokunmadan, gelecekteki bozulmaları engelle.

| # | İş | Komut/Yer | Risk |
|---|---|---|---|
| 1.1 | Netlify'da auto-deploy'u durdur | Dashboard → Site config → **Build & deploy** → **Stop builds** | Sıfır — sadece yeni deploy tetiklenmesini engeller |
| 1.2 | Doğrula | Birkaç dakika sonra deploy listesine bak — yeni build başlamamış olmalı | — |

**Sonuç:** Bundan sonra `git push` yapsak bile Netlify build başlatmaz, "publish ettiğimiz" eski deploy ayakta kalmaya devam eder.

### Faz 2 — Vercel Projesi Düzene Sok (20-30 dk, sıfır canlı risk)

| # | İş | Detay |
|---|---|---|
| 2.1 | Vercel'in env değişkenlerini Netlify'dan kopyala | Faz 0.3'te aldığın listeyi Vercel → Environment Variables → "Add" ile teker teker yapıştır. Her variable için **Production + Preview + Development** üç ortamı da seç |
| 2.2 | `FIREBASE_PRIVATE_KEY` özel dikkat | Bu key çok satırlı, kopyalarken `\n` karakterleri korunmalı. Vercel'de yapıştırırken **olduğu gibi yapıştır** (replace etme) |
| 2.3 | Build settings doğrula | Settings → Build & Development Settings: Framework=Next.js, Build Command=`npm run build` (boş/default), Install Command=`pnpm install` veya `npm install` |
| 2.4 | Node version | Settings → Build → **Node Version: 20.x** (Netlify'la aynı tutuyoruz) |
| 2.5 | Root directory | `./` (boş bırak) |

**Tüm env vars listesi (Netlify'dan kopyalanacak):**
- `BASE_URL`, `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_BILLING_ACCOUNT_ID`
- `OPENAI_ADMIN_KEY`

### Faz 3 — Test Deploy (Vercel Preview) (15 dk, sıfır canlı risk)

Hâlâ canlıya dokunmuyoruz. Sadece Vercel'in preview URL'sinde test.

| # | İş | Detay |
|---|---|---|
| 3.1 | Yeni branch'ten test deploy | Cloud Shell'de: `git checkout -b vercel-migration-test`, küçük bir noktasız değişiklik (örn. README'ye bir satır), push. Vercel otomatik preview deploy yapar |
| 3.2 | Build log'unu izle | Hatasız geçmesi lazım |
| 3.3 | Preview URL'i aç | `mind-id-git-vercel-migration-test-xxx.vercel.app` gibi bir URL → giriş yap → anasayfa açılıyor mu, canvas görünüyor mu |
| 3.4 | API endpoint test | `/api/health-check` URL'i 200 dönüyor mu |
| 3.5 | Function log'da hata var mı | Vercel → Logs → runtime logs |

**🟢 Geçer ise:** Vercel ile çalışıyor, Faz 4'e geç.
**🔴 Hata varsa:** Hangi env eksik, hangi paket sorun belli olur. Düzeltir tekrar deneriz. Canlı hâlâ Netlify'da.

### Faz 4 — Production Deploy (10 dk)

Vercel preview'da çalıştığını gördükten sonra:

| # | İş | Detay |
|---|---|---|
| 4.1 | `main`'e ufak bir commit (Vercel'i tetiklemek için) | Cloud Shell'de: handoff doc branch'ini main'e merge et — küçük doc değişikliği, kod kırılmaz |
| 4.2 | Vercel otomatik production deploy yapar | `mind-id.vercel.app`'e gider |
| 4.3 | Test | `mind-id.vercel.app`'e gir, giriş yap, tüm sayfaları gez (Anasayfa, Agent, İşletmeler, İstatistikler, Ayarlar) |
| 4.4 | API test | İstatistikler sayfası, agent gönder, hepsi çalışıyor mu |

**Hâlâ Netlify ayakta** — sadece Vercel'de paralel bir kopya çalışıyor.

### Faz 5 — Domain Yönlendirmesi (ATLA — kullanılmıyor)

Custom domain kullanılmadığı için bu faz yok. Yeni site URL'si: **`mind-id.vercel.app`**.

### Faz 6 — Netlify'ı Devre Dışı Bırak (5 dk, 1 hafta sonra)

**1 hafta beklenmeli.** Yedek olarak Netlify dursun, Vercel'da problem çıkarsa geri dönülebilir.

1 hafta sonra:
- Netlify dashboard → Site → **Delete site**
- VEYA: Sadece "Stop builds" durumunda bırak, ücretsiz duruyor zaten

### Faz 7 — Şirinler Köyü Aktivasyonu (Bonus, 10 dk)

Vercel sağlam ayakta olduktan sonra:
1. `app/page.tsx`'te `CommandCenterCanvas` → `VillageCanvas` swap et
2. `netlify.toml` dosyasını sil (Vercel için gereksiz)
3. Push → Vercel otomatik deploy → anasayfada Şirinler köyü açılır

### Risk & Rollback Matrisi

| Faz | Risk | Geri Alma Süresi |
|---|---|---|
| 0 | Sıfır | — |
| 1 | Sıfır | Netlify'da "Resume builds" — 1 dk |
| 2 | Sıfır (canlıya dokunmuyor) | Env'ler düzeltilir | 5 dk |
| 3 | Sıfır (preview URL) | Branch silinir | 1 dk |
| 4 | Vercel'de hata olursa | Vercel deploy'u rollback (önceki başarılı'a geç) — 30 sn |
| 6 | Yapmazsan risk yok | — |
| 7 | Sadece UI değişimi | `app/page.tsx`'te swap'ı geri al — 1 dk |

---

## 🎯 DİĞER BEKLEYEN İŞLER

### Görsel ajan: Gemini → OpenAI (orta öncelik, 1 saat)
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

### Güvenlik temizliği (düşük öncelik)
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
| 2026-05-08 | Claude (chat oturumu) | Vercel migrasyon planı detaylandı (custom domain yok, Faz 5 atlanacak) |

> Yeni session açıldığında: Şeyma'ya **"Vercel migrasyonu şu durumda"** diye sorabilirsin. Eğer henüz yapılmadıysa "Vercel'a geçişe başlayalım" deyip yukarıdaki Faz 0'dan başla.
