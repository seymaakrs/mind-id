"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Palette,
  Building2,
  Pencil,
  X,
  Save,
  Loader2,
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
import { SyncAccountsButton } from "@/components/shared";
import type { Business } from "@/types/firebase";

interface BusinessDetailsTabProps {
  business: Business;
  onUpdated?: (updated: Business) => void;
}

export function BusinessDetailsTab({ business, onUpdated }: BusinessDetailsTabProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState(business);
  const [identity, setIdentity] = useState<BrandIdentity | null>(null);
  const [editIdentity, setEditIdentity] = useState<BrandIdentity | null>(null);

  const { editBusiness } = useBusinesses();

  useEffect(() => {
    setCurrentBusiness(business);
  }, [business]);

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

  const handleOpenEdit = () => {
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
    setEditModalOpen(true);
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
      setEditModalOpen(false);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setHata("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const getPlatformIds = () => {
    const platformIds: Array<{ platform: string; id: string }> = [];
    const platformLabels: Record<string, string> = {
      instagram_id: "Instagram",
      facebook_id: "Facebook",
      twitter_id: "Twitter",
      tiktok_account_id: "TikTok",
      youtube_id: "YouTube",
      linkedin_account_id: "LinkedIn",
    };

    for (const [key, label] of Object.entries(platformLabels)) {
      const value = currentBusiness[key as keyof Business];
      if (value && typeof value === "string") {
        platformIds.push({ platform: label, id: value });
      }
    }
    return platformIds;
  };

  const platformIds = getPlatformIds();

  const handleSyncComplete = () => {
    window.location.reload();
  };

  // Marka kimliği özeti (görüntüleme)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <SyncAccountsButton
          businessId={currentBusiness.id}
          lateProfileId={currentBusiness.late_profile_id}
          onSyncComplete={handleSyncComplete}
        />
        <Button onClick={handleOpenEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Düzenle
        </Button>
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
              {currentBusiness.late_profile_id && (
                <p className="text-sm text-muted-foreground">
                  Late Profile ID: {currentBusiness.late_profile_id}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {platformIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Senkronize Edilen Hesaplar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformIds.map(({ platform, id }) => (
                <div
                  key={platform}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="font-medium">{platform}</span>
                  <span
                    className="text-sm text-muted-foreground font-mono truncate max-w-[150px]"
                    title={id}
                  >
                    {id.slice(0, 12)}...
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marka Kimliğini Düzenle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {hata && <p className="text-sm text-destructive">{hata}</p>}

            {editIdentity && (
              <BrandIdentityFields
                identity={editIdentity}
                onChange={handleIdentityChange}
                onLogoSelect={handleLogo}
                logoUploading={logoUploading}
                disabled={saving}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
