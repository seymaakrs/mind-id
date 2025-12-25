"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  ExternalLink,
  Palette,
  Building2,
  Pencil,
  X,
  Save,
  Plus,
  Upload,
} from "lucide-react";
import { deleteBusiness, updateBusiness } from "@/lib/firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";
import type { Business } from "@/types/firebase";

type Props = {
  isletme: Business;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onUpdated?: (updated: Business) => void;
};

type ProfileField = {
  key: string;
  value: string;
};

// Profil değerini string'e çevir (iç içe obje olabilir)
const stringifyProfileValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export default function IsletmeDetay({ isletme, onBack, onDeleted, onUpdated }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(isletme.name);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editColors, setEditColors] = useState<string[]>(isletme.colors || []);
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editProfile, setEditProfile] = useState<ProfileField[]>(
    Object.entries(isletme.profile || {}).map(([key, value]) => ({ key, value: stringifyProfileValue(value) }))
  );
  const [hata, setHata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Güncel işletme verisi (düzenleme sonrası güncellenir)
  const [currentIsletme, setCurrentIsletme] = useState(isletme);

  const handleDelete = async () => {
    if (!confirm(`"${currentIsletme.name}" işletmesini silmek istediğinize emin misiniz?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteBusiness(currentIsletme.id);
      onDeleted(currentIsletme.id);
    } catch (error) {
      console.error("İşletme silinirken hata:", error);
      alert("İşletme silinirken bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  // Düzenleme modunu aç
  const startEditing = () => {
    setEditName(currentIsletme.name);
    setEditLogoFile(null);
    setEditLogoPreview(null);
    setEditColors(currentIsletme.colors || []);
    setEditProfile(
      Object.entries(currentIsletme.profile || {}).map(([key, value]) => ({ key, value: stringifyProfileValue(value) }))
    );
    setHata(null);
    setEditing(true);
  };

  // Düzenlemeyi iptal et
  const cancelEditing = () => {
    setEditing(false);
    setHata(null);
  };

  // Logo seçme
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setHata("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setHata("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }

    setEditLogoFile(file);
    setHata(null);

    const reader = new FileReader();
    reader.onloadend = () => setEditLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Renk işlemleri
  const handleAddColor = () => {
    if (!editColors.includes(newColor)) {
      setEditColors([...editColors, newColor]);
    }
  };

  const handleRemoveColor = (index: number) => {
    setEditColors(editColors.filter((_, i) => i !== index));
  };

  // Profil alan işlemleri
  const handleAddField = () => {
    setEditProfile([...editProfile, { key: "", value: "" }]);
  };

  const handleRemoveField = (index: number) => {
    setEditProfile(editProfile.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...editProfile];
    updated[index][field] = newValue;
    setEditProfile(updated);
  };

  // Kaydet
  const handleSave = async () => {
    if (!editName.trim()) {
      setHata("İşletme adı zorunludur.");
      return;
    }

    if (editColors.length === 0) {
      setHata("En az bir renk eklemeniz zorunludur.");
      return;
    }

    setSaving(true);
    setHata(null);

    try {
      let logoUrl = currentIsletme.logo;

      // Yeni logo yüklendiyse
      if (editLogoFile) {
        logoUrl = await uploadBusinessLogo(editLogoFile, currentIsletme.id);
      }

      // Profile objesine dönüştür
      const profile: Record<string, string> = {};
      editProfile.forEach((field) => {
        if (field.key.trim()) {
          profile[field.key.trim()] = field.value;
        }
      });

      // Güncelle
      await updateBusiness(currentIsletme.id, {
        name: editName.trim(),
        logo: logoUrl,
        colors: editColors,
        profile,
      });

      // Local state güncelle
      const updated: Business = {
        ...currentIsletme,
        name: editName.trim(),
        logo: logoUrl,
        colors: editColors,
        profile,
      };
      setCurrentIsletme(updated);
      onUpdated?.(updated);

      setEditing(false);
    } catch (error) {
      console.error("İşletme güncellenirken hata:", error);
      setHata("İşletme güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Düzenleme modu
  if (editing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelEditing} disabled={saving}>
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">İşletme Düzenle</h2>
              <p className="text-muted-foreground">{currentIsletme.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditing} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>

        {hata && <p className="text-sm text-destructive">{hata}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol: İsim ve Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* İşletme Adı */}
              <div className="space-y-2">
                <Label>
                  İşletme Adı <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={saving}
                  className="min-h-[60px] resize-y"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />

                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                    {editLogoPreview ? (
                      <img
                        src={editLogoPreview}
                        alt="Yeni logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : currentIsletme.logo ? (
                      <img
                        src={currentIsletme.logo}
                        alt="Mevcut logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {currentIsletme.logo ? "Değiştir" : "Yükle"}
                  </Button>
                </div>
                {editLogoFile && (
                  <p className="text-xs text-muted-foreground">
                    Yeni: {editLogoFile.name} ({(editLogoFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sağ: Renk Paleti */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Renk Paleti <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Renk ekleme */}
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={saving}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={saving}
                  className="w-28 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddColor}
                  disabled={saving}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Renkler */}
              <div className="flex flex-wrap gap-2">
                {editColors.map((color, index) => (
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
                      disabled={saving}
                      className="w-6 h-6 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profil Bilgileri */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Profil Bilgileri</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddField}
                disabled={saving}
              >
                <Plus className="w-4 h-4 mr-2" />
                Alan Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editProfile.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                Profil alanı bulunmuyor.
              </p>
            ) : (
              <div className="space-y-4">
                {editProfile.map((field, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="w-1/3">
                      <Textarea
                        placeholder="Alan adı"
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, "key", e.target.value)}
                        disabled={saving}
                        className="min-h-[60px] resize-y"
                      />
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Değer"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                        disabled={saving}
                        className="min-h-[60px] resize-y"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      disabled={saving}
                      className="text-destructive hover:text-destructive mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Görüntüleme modu
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{currentIsletme.name}</h2>
            <p className="text-muted-foreground">İşletme Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startEditing}>
            <Pencil className="w-4 h-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Sil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {currentIsletme.logo ? (
                <img
                  src={currentIsletme.logo}
                  alt={currentIsletme.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <Building2 className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            {currentIsletme.logo && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href={currentIsletme.logo} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Orijinal Boyutta Aç
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Orta: Renk Paleti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Renk Paleti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentIsletme.colors && currentIsletme.colors.length > 0 ? (
              <div className="space-y-3">
                {currentIsletme.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg border shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-sm">{color}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Renk paleti tanımlanmamış.</p>
            )}
          </CardContent>
        </Card>

        {/* Sağ: Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Oluşturulma Tarihi</p>
              <p className="font-medium">
                {currentIsletme.createdAt?.toDate?.()?.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Son Güncelleme</p>
              <p className="font-medium">
                {currentIsletme.updatedAt?.toDate?.()?.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-xs break-all">{currentIsletme.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profil Bilgileri */}
      {currentIsletme.profile && Object.keys(currentIsletme.profile).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentIsletme.profile).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{key}</p>
                  <p className="whitespace-pre-wrap">{stringifyProfileValue(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
