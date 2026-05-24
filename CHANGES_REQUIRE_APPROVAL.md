# Değişiklik Onay Matrisi (Şeyma için)

> Claude session'ları otomatik PR açıyor. Bu dosya **hangi değişikliklerin merge öncesi ek incelemeden geçmesi gerektiğini** tanımlar.

## 🟢 Otomatik merge OK (düşük risk)
- Doküman güncellemesi (`.md` dosyaları, CLAUDE.md, OPERATIONS.md)
- Yeni test ekleme (mevcut test silinmediği sürece)
- Yorum satırı / log mesajı düzenleme
- `.gitignore`, `.pre-commit-config.yaml` ekleme
- Yeni agent / yeni tool ekleme (mevcut routing değişmiyorsa)

## 🟡 1 göz daha (orta risk) — sen merge etmeden önce oku
- Mevcut tool imzası değişiyor
- Firestore koleksiyon şeması değişikliği
- Prompt / instruction büyük revizyon (> 50 satır)
- Yeni Cloud Run env var ekleme (deploy gerekli)
- Bağımlılık ekleme (`requirements.txt`, `package.json`)
- UI'da görünür akış değişikliği (mind-id)

## 🔴 ASLA otomatik merge etme — sen elle gözden geçir
- **Secret / key dosyası** içeriği (`.env`, `*credentials*.json`, `serviceAccount.json`)
- **Branch protection** ayar değişikliği
- **Firestore Security Rules** değişikliği (`firestore.rules`)
- **Production deploy script'i** (`scripts/deploy_*.sh`, `Dockerfile`)
- **Model değiştirme** (`gpt-5`, `gemini-2.0-flash-image-generation` gibi yok modelleri)
- **Cloud Run revision yönlendirme** (`gcloud run services update-traffic`)
- **Cloud Run service authentication** (`--no-allow-unauthenticated` riski)
- **NocoDB / Firestore migration** (geri alınmaz)
- **Force push / branch silme**
- **Yeni 3rd-party servis entegrasyonu** (yeni API key gerektiren)

## 📋 PR açan Claude için kurallar
1. PR title: net kısa Türkçe (`feat:`, `fix:`, `chore:`, `docs:` prefix)
2. PR body: ne değişti + neden + test planı
3. 🔴 listesindeki değişiklik varsa **draft** olarak aç + body'de açıkça belirt
4. Branch protection kurulu — PR olmadan main'e push imkânsız
5. Squash merge tercih edilir

## 🚨 Kırmızı bayraklar (acil sor)
- Birden fazla repoyu aynı anda değiştiren PR
- `git push --force` denemesi
- `firestore.rules` ya da `firebase.json` değişikliği
- Tek seferde > 1000 satır kod ekleyen PR (kod kalitesi düşer)

---

**Son güncelleme:** 2026-05-21
