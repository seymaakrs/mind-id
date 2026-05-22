"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Database,
  Loader2,
  Palette,
  Building2,
  Pencil,
  X,
  Save,
  Globe,
} from "lucide-react";
import { useBusinesses } from "@/hooks";
import {
  BrandIdentityFields,
  setBrandPath,
} from "@/components/business/BrandIdentityFields";
import {
  buildBrandIdentityFromBusiness,
  type BrandIdentity,
} from "@/lib/brandIdentity";
import { getBrandIdentity, saveBrandIdentity } from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/firebase/storage";
import type { Business } from "@/types/firebase";

type Props = {
  business: Business;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onUpdated?: (updated: Business) => void;
};

export default function BusinessDetail({ business, onBack, onDeleted, onUpdated }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState(business);
  const [identity, setIdentity] = useState<BrandIdentity | null>(null);
  const [editIdentity, setEditIdentity] = useState<BrandIdentity | null>(null);

  const { removeBusiness, editBusiness } = useBusinesses();

  const loadIdentity = useCallback(async (biz: Business) => {
    let bi: BrandIdentity | null = null;
    try {
      bi = await getBrandIdentity(biz.id);
    } catch {
      bi = null;
    }
    if (!bi) {
      bi = buildBrandIdentityFromBusiness({
        businessId: biz.id,
        name: biz.name,
        logo: biz.logo,
        colors: biz.colors,
        profile: biz.profile,
        source: "imported",
      });
    }
    setIdentity(bi);
  }, []);

  useEffect(() => {
    loadIdentity(currentBusiness);
  }, [currentBusiness, loadIdentity]);

  const handleDelete = async () => {
    if (
      !confirm(
        `"${currentBusiness.name}" Veri Hazinesi'ne taşınacak. Hiçbir veri silinmez; istediğin zaman geri yükleyebilirsin. Devam edilsin mi?`
      )
    )
      return;
    setDeleting(true);
    try {
      await removeBusiness(currentBusiness.id);
      onDeleted(currentBusiness.id);
    } catch (error) {
      console.error("İşletme veri hazinesine taşınırken hata:", error);
      alert("İşletme veri hazinesine taşınırken bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStartEdit = () => {
    setEditIdentity(
      identity
        ? (structuredClone(identity) as BrandIdentity)
        : buildBrandIdentityFromBusiness({
            businessId: currentBusiness.id,
            name: currentBusiness.name,
            logo: currentBusiness.logo,
            colors: currentBusiness.colors,
            profile: currentBusiness.profile,
            source: "imported",
          })
    );
    setHata(null);
    setEditing(true);
  };

  const handleIdentityChange = (path: string, value: unknown) => {
    setEditIdentity((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as unknown as Record<string, unknown>;
      setBrandPath(next, path, value);
      return next as unknown as BrandIdentity;
    });
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setHata("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHata("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }
    setLogoUploading(true);
    setHata(null);
    try {
      const ext = file.name.split(".").pop() || "png";
      const url = await uploadFile(
        file,
        `businesses/${currentBusiness.id}/brand_logo.${ext}`
      );
      handleIdentityChange("visual.logo_url", url);
    } catch (error) {
      console.error("Logo yükleme hatası:", error);
      setHata("Logo yüklenirken bir hata oluştu.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editIdentity) return;
    if (!editIdentity.basics.name?.trim()) {
      setHata("Marka adı zorunludur.");
      return;
    }

    setSaving(true);
    setHata(null);

    try {
      const summary = {
        name: editIdentity.basics.name.trim(),
        logo: editIdentity.visual.logo_url || currentBusiness.logo || "",
        colors: editIdentity.visual.primary_colors,
      };

      const success = await editBusiness(currentBusiness.id, summary);
      if (!success) {
        setHata("Güncelleme başarısız oldu.");
        return;
      }
      await saveBrandIdentity(currentBusiness.id, editIdentity);

      const updated: Business = { ...currentBusiness, ...summary };
      setCurrentBusiness(updated);
      setIdentity(editIdentity);
      onUpdated?.(updated);
      setEditing(false);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setHata("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setHata(null);
  };

  const isDisabled = saving;

  const summaryRows: Array<{ label: string; value: string }> = [];
  if (identity) {
    const add = (label: string, v: unknown) => {
      const text = Array.isArray(v)
        ? v.join(", ")
        : typeof v === "string"
          ? v
          : "";
      if (text && text.trim()) summaryRows.push({ label, value: text });
    };
    add("Slogan", identity.basics.tagline);
    add("Sektör", identity.basics.industry);
    add("Anahtar kelimeler", identity.basics.keywords);
    add("Ton", identity.voice.tone);
    add("Hook stili", identity.voice.hook_style);
    add("CTA tarzı", identity.voice.cta_templates);
    add("Yazı tipi", identity.visual.font_family);
    add("Görsel stil", identity.visual.visual_style);
    add("Hedef kitle", identity.audience.primary.role);
    add("Yaş aralığı", identity.audience.primary.age_range);
    add("Değer önerisi (USP)", identity.business_context.usp);
    add("Ürünler", identity.business_context.products);
  }

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleStartEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Veri Hazinesi'ne taşı
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden border flex-shrink-0">
                {currentBusiness.logo ? (
                  <img
                    src={currentBusiness.logo}
                    alt={currentBusiness.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-2xl font-bold">{currentBusiness.name}</h2>
                {currentBusiness.colors?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    {currentBusiness.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 bg-muted rounded px-2 py-1"
                      >
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-mono text-xs">{color}</span>
                      </div>
                    ))}
                  </div>
                )}
                {currentBusiness.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={currentBusiness.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {currentBusiness.website}
                    </a>
                  </div>
                )}
                {currentBusiness.zernio_profile_id && (
                  <p className="text-sm text-muted-foreground">
                    Zernio Profile ID: {currentBusiness.zernio_profile_id}
                  </p>
                )}
                {currentBusiness.late_profile_id && !currentBusiness.zernio_profile_id && (
                  <p className="text-sm text-muted-foreground">
                    Late Profile ID (eski): {currentBusiness.late_profile_id}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {summaryRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Marka Kimliği</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryRows.map((r) => (
                  <div key={r.label} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {r.label}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{r.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleCancelEdit}>
          <X className="w-4 h-4 mr-2" />
          İptal
        </Button>
        <Button onClick={handleSave} disabled={isDisabled}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </>
          )}
        </Button>
      </div>

      {hata && <p className="text-sm text-destructive">{hata}</p>}

      {editIdentity && (
        <BrandIdentityFields
          identity={editIdentity}
          onChange={handleIdentityChange}
          onLogoSelect={handleLogo}
          logoUploading={logoUploading}
          disabled={isDisabled}
        />
      )}
    </div>
  );
}
