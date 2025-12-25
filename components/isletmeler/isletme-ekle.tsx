"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Building2, Loader2, Upload, X, Palette } from "lucide-react";
import { addBusiness } from "@/lib/firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";

type ProfileField = {
  key: string;
  value: string;
};

type Status = "bosta" | "kaydediliyor" | "basarili" | "hata";

export default function IsletmeEkleComponent() {
  const [isletmeAdi, setIsletmeAdi] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("#3b82f6");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [instagramAccessToken, setInstagramAccessToken] = useState("");
  const [profileFields, setProfileFields] = useState<ProfileField[]>([]);
  const [status, setStatus] = useState<Status>("bosta");
  const [hata, setHata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo seçme
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sadece resim dosyalarını kabul et
    if (!file.type.startsWith("image/")) {
      setHata("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setHata("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }

    setLogoFile(file);
    setHata(null);

    // Preview oluştur
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Logo temizle
  const handleLogoClear = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Renk ekle
  const handleAddColor = () => {
    if (!colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
  };

  // Renk sil
  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // Profil alanı ekleme
  const handleAddField = () => {
    setProfileFields([...profileFields, { key: "", value: "" }]);
  };

  // Profil alanı silme
  const handleRemoveField = (index: number) => {
    setProfileFields(profileFields.filter((_, i) => i !== index));
  };

  // Profil alanı güncelleme
  const handleFieldChange = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...profileFields];
    updated[index][field] = newValue;
    setProfileFields(updated);
  };

  // Formu sıfırla
  const resetForm = () => {
    setIsletmeAdi("");
    setLogoFile(null);
    setLogoPreview(null);
    setColors([]);
    setNewColor("#3b82f6");
    setDescription("");
    setSector("");
    setTargetAudience("");
    setInstagramAccountId("");
    setInstagramAccessToken("");
    setProfileFields([]);
    setHata(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Kaydet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasyonlar
    if (!isletmeAdi.trim()) {
      setHata("İşletme adı zorunludur.");
      return;
    }

    if (!logoFile) {
      setHata("Logo yüklemek zorunludur.");
      return;
    }

    if (colors.length === 0) {
      setHata("En az bir renk eklemeniz zorunludur.");
      return;
    }

    if (!description.trim()) {
      setHata("İşletme açıklaması zorunludur.");
      return;
    }

    if (!sector.trim()) {
      setHata("Sektör bilgisi zorunludur.");
      return;
    }

    if (!targetAudience.trim()) {
      setHata("Hedef kitle bilgisi zorunludur.");
      return;
    }

    if (!instagramAccountId.trim()) {
      setHata("Instagram Account ID zorunludur.");
      return;
    }

    if (!instagramAccessToken.trim()) {
      setHata("Instagram Access Token zorunludur.");
      return;
    }

    // Profile objesine dönüştür (boş key'leri filtrele)
    const profile: Record<string, string> = {};
    profileFields.forEach((field) => {
      if (field.key.trim()) {
        profile[field.key.trim()] = field.value;
      }
    });

    setStatus("kaydediliyor");
    setHata(null);

    try {
      // Önce geçici bir ID ile klasör oluşturmak için timestamp kullan
      const tempId = Date.now().toString();

      // Logo'yu Storage'a yükle
      const logoUrl = await uploadBusinessLogo(logoFile, tempId);

      // Firestore'a kaydet
      await addBusiness({
        name: isletmeAdi.trim(),
        logo: logoUrl,
        colors,
        description: description.trim(),
        sector: sector.trim(),
        target_audience: targetAudience.trim(),
        instagram_account_id: instagramAccountId.trim(),
        instagram_access_token: instagramAccessToken.trim(),
        profile,
      });

      setStatus("basarili");
      resetForm();

      // 3 saniye sonra durumu sıfırla
      setTimeout(() => setStatus("bosta"), 3000);
    } catch (error) {
      console.error("İşletme kaydetme hatası:", error);
      setHata("İşletme kaydedilirken bir hata oluştu.");
      setStatus("hata");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">İşletme Ekle</h2>
          <p className="text-muted-foreground">Yeni bir işletme kaydı oluşturun</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İşletme Bilgileri</CardTitle>
          <CardDescription>
            İşletme adı, logo ve renk paleti zorunludur. Ek bilgiler için alan ekleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İşletme Adı - Zorunlu */}
            <div className="space-y-2">
              <Label htmlFor="isletme-adi">
                İşletme Adı <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="isletme-adi"
                placeholder="Örn: ABC Teknoloji Ltd."
                value={isletmeAdi}
                onChange={(e) => setIsletmeAdi(e.target.value)}
                disabled={status === "kaydediliyor"}
                className="min-h-[60px] resize-y"
                rows={1}
              />
            </div>

            {/* Logo Upload - Zorunlu */}
            <div className="space-y-2">
              <Label>
                Logo <span className="text-destructive">*</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />

              {!logoPreview ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === "kaydediliyor"}
                  className="w-full h-32 border-dashed flex flex-col gap-2"
                >
                  <Upload className="w-8 h-8" />
                  <span>Logo yüklemek için tıklayın</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, SVG (max 5MB)</span>
                </Button>
              ) : (
                <div className="relative border rounded-lg p-4 flex items-center gap-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-24 h-24 object-contain rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{logoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {logoFile && (logoFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleLogoClear}
                    disabled={status === "kaydediliyor"}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Renk Paleti - Zorunlu */}
            <div className="space-y-3">
              <Label>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Renk Paleti <span className="text-destructive">*</span>
                </div>
              </Label>

              {/* Renk ekleme */}
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={status === "kaydediliyor"}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={status === "kaydediliyor"}
                  className="w-28 font-mono"
                  placeholder="#000000"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddColor}
                  disabled={status === "kaydediliyor"}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ekle
                </Button>
              </div>

              {/* Eklenen renkler */}
              {colors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-lg">
                  Henüz renk eklenmedi. Renk seçip &quot;Ekle&quot; butonuna tıklayın.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
                    >
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono text-sm">{color}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveColor(index)}
                        disabled={status === "kaydediliyor"}
                        className="w-6 h-6 text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İşletme Açıklaması - Zorunlu */}
            <div className="space-y-2">
              <Label htmlFor="description">
                İşletme Açıklaması <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="İşletmenizi kısaca tanıtın. Bu bilgi içerik üretiminde AI tarafından kullanılacaktır."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={status === "kaydediliyor"}
                className="min-h-[100px] resize-y"
                rows={3}
              />
            </div>

            {/* Sektör - Zorunlu */}
            <div className="space-y-2">
              <Label htmlFor="sector">
                Sektör / Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sector"
                placeholder="Örn: Teknoloji, E-ticaret, Sağlık, Eğitim"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                disabled={status === "kaydediliyor"}
              />
            </div>

            {/* Hedef Kitle - Zorunlu */}
            <div className="space-y-2">
              <Label htmlFor="target-audience">
                Hedef Kitle <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="target-audience"
                placeholder="Örn: 25-45 yaş arası, teknoloji meraklısı, şehirde yaşayan profesyoneller"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                disabled={status === "kaydediliyor"}
                className="min-h-[80px] resize-y"
                rows={2}
              />
            </div>

            {/* Instagram Account ID - Zorunlu */}
            <div className="space-y-2">
              <Label htmlFor="instagram-account-id">
                Instagram Account ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="instagram-account-id"
                placeholder="Örn: 17841400000000000"
                value={instagramAccountId}
                onChange={(e) => setInstagramAccountId(e.target.value)}
                disabled={status === "kaydediliyor"}
              />
            </div>

            {/* Instagram Access Token - Zorunlu */}
            <div className="space-y-2">
              <Label htmlFor="instagram-access-token">
                Instagram Access Token <span className="text-destructive">*</span>
              </Label>
              <Input
                id="instagram-access-token"
                type="password"
                placeholder="Access token"
                value={instagramAccessToken}
                onChange={(e) => setInstagramAccessToken(e.target.value)}
                disabled={status === "kaydediliyor"}
              />
            </div>

            {/* Profil Alanları - Opsiyonel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Profil Bilgileri (Opsiyonel)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  disabled={status === "kaydediliyor"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Alan Ekle
                </Button>
              </div>

              {profileFields.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                  Henüz profil alanı eklenmedi. &quot;Alan Ekle&quot; butonuna tıklayarak başlayın.
                </p>
              ) : (
                <div className="space-y-4">
                  {profileFields.map((field, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="w-1/3">
                        <Textarea
                          placeholder="Alan adı (örn: Telefon)"
                          value={field.key}
                          onChange={(e) => handleFieldChange(index, "key", e.target.value)}
                          disabled={status === "kaydediliyor"}
                          className="min-h-[60px] resize-y"
                          rows={1}
                        />
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Değer (örn: 0532 123 45 67)"
                          value={field.value}
                          onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                          disabled={status === "kaydediliyor"}
                          className="min-h-[60px] resize-y"
                          rows={1}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(index)}
                        disabled={status === "kaydediliyor"}
                        className="text-destructive hover:text-destructive mt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hata Mesajı */}
            {hata && (
              <p className="text-sm text-destructive">{hata}</p>
            )}

            {/* Başarı Mesajı */}
            {status === "basarili" && (
              <p className="text-sm text-green-500">İşletme başarıyla kaydedildi!</p>
            )}

            {/* Kaydet Butonu */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={status === "kaydediliyor"}
                className="flex-1"
              >
                {status === "kaydediliyor" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={status === "kaydediliyor"}
              >
                Temizle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
