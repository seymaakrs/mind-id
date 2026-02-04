# Güvenlik Denetim Raporu

## 1. Yüksek Öncelikli Güvenlik Açıkları

### 1.1. Kimlik Doğrulaması Olmayan Bulut Fonksiyonları (Hizmet Reddi / Finansal Risk)
*   **Açık Türü:** Erişim Kontrolü Hatası (Broken Access Control)
*   **Önem Derecesi:** **Yüksek**
*   **Kaynak Konumu:** `D:\mind-id\functions\src\index.ts`
*   **Satır İçeriği:**
    *   Satır 622: `export const collectInstagramStatsNow = onRequest({`
    *   Satır 743: `export const runJobsNow = onRequest({`
*   **Açıklama:** `collectInstagramStatsNow` ve `runJobsNow` isimli Bulut Fonksiyonları (Cloud Functions), genel erişime açık HTTP uç noktaları olarak yapılandırılmıştır. Bu fonksiyonlar, tüm işletmeleri veya görevleri toplu olarak işlemek gibi yüksek kaynak gerektiren işlemler yapar ve dış API'lere (Late API) çağrıda bulunur. Çağıran kişinin kimliğini doğrulayan bir mekanizma bulunmamaktadır.
*   **Etki:** Kimliği doğrulanmamış bir saldırgan bu fonksiyonları tekrar tekrar tetikleyerek şunlara yol açabilir:
    *   **Hizmet Reddi (DoS):** Bulut fonksiyonu örneklerini ve Firestore kotalarını tüketerek sistemin durmasına neden olabilir.
    *   **Finansal Kayıp:** Ücretli API kotalarını (Late API) ve Firebase kaynaklarını gereksiz yere harcatabilir.
    *   **Veri Bütünlüğü Sorunları:** Planlanmamış güncellemeleri veya görevleri zorla çalıştırarak veri akışını bozabilir.
*   **Öneri:**
    *   İstek başlıklarındaki (headers) Firebase Kimlik Doğrulama belirtecinin (token) `admin.auth().verifyIdToken()` kullanılarak doğrulanması gerekir.
    *   Alternatif olarak, bu fonksiyonlar yalnızca dahili kullanıma (örneğin Pub/Sub tetikleyicileri) kısıtlanmalı veya paylaşılan bir gizli anahtar (örn: `x-admin-key`) gerektirmelidir.

### 1.2. Kimlik Doğrulaması Olmayan API Uç Noktaları (Sistemik)
*   **Açık Türü:** Erişim Kontrolü Hatası (Broken Access Control)
*   **Önem Derecesi:** **Yüksek**
*   **Kaynak Konumu:** Birden Fazla API Yolu
    *   `app/api/agent-task/route.ts` (Satır 92)
    *   `app/api/add-link/route.ts` (Satır 5)
    *   `app/api/calculate-comments/route.ts` (Satır 5)
    *   `app/api/create-content/route.ts` (Satır 5)
    *   `app/api/create-video/route.ts` (Satır 5)
    *   `app/api/instagram-post/route.ts` (Satır 5)
    *   `app/api/pick-avatar/route.ts` (Satır 5)
    *   `app/api/post-blog/route.ts` (Satır 5)
    *   `app/api/sync-accounts/route.ts` (Satır 6)
    *   `app/api/update-post-status/route.ts` (Satır 15)
*   **Açıklama:** Bu Next.js API rotaları, arka uç servislerine proxy görevi görmekte veya doğrudan veritabanı işlemleri yapmaktadır. İstekleri işlemeden önce aktif bir kullanıcı oturumunu kontrol etmemekte veya herhangi bir kimlik doğrulama belirtecini doğrulamamaktadır.
*   **Etki:** Herhangi bir kullanıcı (kimliği doğrulanmamış olanlar dahil), arka uç süreçlerini tetikleyebilir, içerik oluşturabilir/değiştirebilir veya işletme verilerini manipüle edebilir. Bu durum yetkisiz işlemlere ve kaynakların kötüye kullanımına olanak tanır.
*   **Öneri:** Her API işleyicisinin başında kullanıcının oturumunu doğrulayan bir ara yazılım (middleware) veya yardımcı fonksiyon (örn: `getServerSession` veya Firebase Admin Auth kullanarak) uygulanmalıdır. Kimliği doğrulanmamış kullanıcılardan gelen istekler `401 Unauthorized` durumu ile reddedilmelidir.

### 1.3. İmzalı URL ile Keyfi Dosya Erişimi (IDOR)
*   **Açık Türü:** Erişim Kontrolü Hatası (IDOR)
*   **Önem Derecesi:** **Kritik**
*   **Kaynak Konumu:** `D:\mind-id\app\api\agent-task\route.ts`
*   **Satır İçeriği:** Satır 35: `const signedUrl = await getSignedUrl(item.storage_path, 60);`
*   **Açıklama:** Uygulama, `POST` isteğindeki JSON gövdesinden doğrudan kullanıcı tarafından sağlanan bir `storage_path` (depolama yolu) bilgisini kabul etmektedir. Daha sonra, isteği yapan kullanıcının o dosyaya erişim yetkisi olup olmadığını kontrol etmeden, bu yol için bir Firebase Storage İmzalı URL'si (Signed URL) oluşturmaktadır.
*   **Etki:** Bir saldırgan, Firebase Storage kovası (bucket) içindeki geçerli herhangi bir dosya yolunu (örneğin: `businesses/BASKA_ISLETME_ID/gizli.pdf` veya sistem yedekleri) sağlayabilir. API, bu dosya için tam okuma erişimi sağlayan geçerli bir imzalı URL döndürecektir.
*   **Öneri:**
    *   **Yolu Doğrulayın:** `storage_path` değerinin, kimliği doğrulanmış kullanıcı için izin verilen modelle (örneğin: `businesses/{user.businessId}/**`) kesinlikle eşleştiğinden emin olun.
    *   **Sahipliği Zorunlu Kılın:** İmzalama işleminden önce, kullanıcının o dosyayı referans alan dökümanın sahibi olduğunu doğrulamak için Firestore sorgusu yapın.

---

## 2. Düşük Öncelikli Güvenlik Açıkları

### 2.1. Bilgi İfşası (Dahili Sunucu URL'si)
*   **Açık Türü:** Bilgi İfşası (Information Disclosure)
*   **Önem Derecesi:** **Düşük**
*   **Kaynak Konumu:** `D:\mind-id\app\api\health-check\route.ts`
*   **Satır İçeriği:** Satır 52: `serverUrl: baseUrl,`
*   **Açıklama:** Sağlık kontrolü (health check) uç noktası, JSON yanıtında dahili arka uç `serverUrl` bilgisini döndürmektedir.
*   **Etki:** Dahili altyapı detaylarının sızdırılması, saldırganların sistemi haritalamasına ve potansiyel olarak ön yüz korumalarını atlayarak doğrudan arka ucu hedef almasına yardımcı olabilir.
*   **Öneri:** `serverUrl` alanını genel yanıttan kaldırın.

### 2.2. Potansiyel Parametre Enjeksiyonu
*   **Açık Türü:** Girdi Doğrulama (Input Validation)
*   **Önem Derecesi:** **Düşük**
*   **Kaynak Konumu:** `D:\mind-id\app\api\instagram-permalink\route.ts`
*   **Satır İçeriği:** Satır 21: `const url = 
https://graph.facebook.com/v19.0/${postId}?fields=permalink,owner{username,id}&access_token=${accessToken}
`;`
*   **Açıklama:** `postId` değişkeni, Graph API URL dizesine doğrudan yerleştirilmektedir.
*   **Etki:** İstek `graph.facebook.com` alan adı ile sınırlı olsa da, `postId` içinde beklenmedik karakterler olması teorik olarak API sorgu parametrelerini değiştirebilir.
*   **Öneri:** URL'yi oluşturmadan önce girdiyi temizlemek için `encodeURIComponent(postId)` kullanın.

---

## Özet
Yapılan denetim sonucunda **Erişim Kontrolü Hataları** ile ilgili **1 Kritik** ve **2 Yüksek** önem derecesine sahip güvenlik açığı tespit edilmiştir. En acil sorun, neredeyse tüm API yollarında kimlik doğrulamasının eksik olması ve özellikle `agent-task` uç noktasının keyfi dosya erişimine izin veren bir IDOR açığı barındırmasıdır. Bu uç noktaların güvenliğinin sağlanması için acil düzeltme yapılması gerekmektedir.
