# DEVİR NOTU (HANDOFF)

> Bu dosya, oturumlar arası bağlamı korumak için yazıldı. Yeni agent buradan
> devam edebilir. Kullanıcı teknik terim bilmiyor; sade Türkçe açıklama ister,
> kararları kendisi verir.

## Proje

- **mind-id** — Next.js + Firebase/Firestore.
- GitHub: `seymaakrs/mind-id`. Toplam 3 ayrı/bağımsız repo: `mind-id`,
  `customer_agent`, `mind-agent`.
- Vercel hesabı: `seymaakrs-slowdays-web` (yalnızca hesap/takım adı; kodla
  ilgisi yok).
- **Production URL:** `mind-id-gray.vercel.app`
- **Preview URL:** `mind-id-git-...vercel.app`
- Aktif dal: `claude/unify-brand-identity-data`
- **PR #12 (mind-id) — DRAFT, MERGE EDİLMEDİ.**

## YAPILDI (PR #12'de, push'lu)

1. **Marka kimliği tek kaynağa indirildi:** business detail/edit artık
   `brand_identity/v1` okuyup yazıyor (eski `Business.profile` yerine,
   geriye dönük dönüşümle).
2. **Güvenli silme (Veri Hazinesi):** hard delete kaldırıldı.
   - `Business.status`'a `'deleted'` + `deletedAt`/`archivedAt`.
   - `softDeleteBusiness` / `restoreBusiness` (firestore.ts).
   - `useBusinesses.businesses` artık `'deleted'` hariç; `allBusinesses`
     ham liste (yalnızca İşletme Listesi sekmeleri kullanır).
   - İşletme Listesi'ne 3. sekme "Veri Hazinesi" + Geri Yükle.
   - İşletme Detay: sil → "Veri Hazinesi'ne taşı".
   - `functions/src/index.ts`: 4 döngüde `status === 'deleted'` atlanıyor.
3. Doğrulama ajanı bir regresyon yakaladı (silinenler seçicilerde
   görünüyordu) → düzeltildi.
4. Next.js derlemesi başarılı. (`functions/` tsc hataları ortamda
   bağımlılık kurulu olmadığı için çıkan ÖNCEDEN VAR OLAN durum;
   eklenen tek satırlık status kontrolü tip-güvenli.)

## ÇÖZÜLMEMİŞ / EKSİK

- **A. ASIL SORUN (öncelik):** Kullanıcı "geçersiz oturum" auth hatası
  alıyor. Hatanın **nerede** olduğu (production `mind-id-gray` mi, preview
  mi) TESPİT EDİLMEDİ. PR'lar merge edilmediği için production hâlâ ESKİ
  kod çalıştırıyor. Sonraki adım: kullanıcıya hatayı aldığı tam URL'i sor;
  Vercel'de **Production vs Preview ortam değişkenlerini** (Firebase env)
  karşılaştır — bunlar Vercel'de ayrı tutulur, sık karışır.
- **B.** PR #12 taslak ve merge edilmedi → production etkilenmedi.
- **C.** Cloud Functions değişikliği Firebase deploy gerektiriyor (yapılmadı).
- **D.** Tarayıcı/UI testi yapılmadı; kullanıcının preview'da golden path
  doğrulaması gerek (Sil → Veri Hazinesi → Geri Yükle).
- **E.** Veritabanı/bağlantı sağlamlığı KONTROL EDİLMEDİ (kullanıcı sormuştu).
- **F.** `mind-agent` (Python, ayrı repo) `status='deleted'`i bilmiyor;
  koordinasyon gerekebilir (kapsam dışıydı).
