"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useBusinesses, useBusinessForm } from "@/hooks";
import {
  BasicInfoSection,
  IdentitySection,
  BrandVoiceSection,
  VisualSection,
  TargetAudienceSection,
  BrandValuesSection,
  SocialMediaSection,
  RulesSection,
  ExtraFieldsSection,
} from "@/components/business/form";
import { SyncAccountsButton } from "@/components/shared";
import type { Business } from "@/types/firebase";

interface BusinessDetailsTabProps {
  business: Business;
  onUpdated?: (updated: Business) => void;
}

const profileLabels: Record<string, string> = {
  slogan: "Slogan",
  industry: "Sektor",
  sub_category: "Alt Kategori",
  market_position: "Pazar Konumu",
  location_city: "Sehir / Konum",
  tone: "Ses Tonu",
  language: "Dil",
  formality: "Resmiyet Duzeyi",
  emoji_usage: "Emoji Kullanimi",
  caption_style: "Caption Stili",
  aesthetic: "Estetik",
  photography_style: "Fotograf Stili",
  color_mood: "Renk Havasi",
  visual_mood: "Gorsel Hava",
  target_age_range: "Yas Araligi",
  target_gender: "Cinsiyet",
  target_description: "Hedef Kitle Aciklamasi",
  target_interests: "Ilgi Alanlari",
  brand_values: "Marka Degerleri",
  unique_points: "Benzersiz Noktalar",
  brand_story_short: "Kisa Marka Hikayesi",
  hashtags_brand: "Marka Hashtagleri",
  hashtags_industry: "Sektor Hashtagleri",
  hashtags_location: "Konum Hashtagleri",
  content_pillars: "Icerik Direkleri",
  avoid_topics: "Kacinilacak Konular",
  seasonal_content: "Mevsimsel Icerik",
  promo_frequency: "Promosyon Sikligi",
  extras: "Ekstra Alanlar",
};

const stringifyProfileValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Evet" : "Hayir";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export function BusinessDetailsTab({ business, onUpdated }: BusinessDetailsTabProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState(business);

  const { editBusiness, uploadLogo } = useBusinesses();
  const {
    form,
    setField,
    setLogoFile,
    addColor,
    removeColor,
    addExtraField,
    removeExtraField,
    updateExtraField,
    loadFromBusiness,
    buildBusinessData,
    validate,
  } = useBusinessForm();

  // Update currentBusiness when prop changes
  useEffect(() => {
    setCurrentBusiness(business);
  }, [business]);

  const handleOpenEdit = () => {
    loadFromBusiness(currentBusiness);
    setHata(null);
    setEditModalOpen(true);
  };

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setHata("Lutfen gecerli bir resim dosyasi secin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHata("Logo dosyasi 5MB'dan kucuk olmalidir.");
      return;
    }
    setLogoFile(file);
    setHata(null);
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setHata(validationError);
      return;
    }

    setSaving(true);
    setHata(null);

    try {
      const businessData = buildBusinessData();
      let logoUrl = currentBusiness.logo;

      if (form.logoFile) {
        const newLogoUrl = await uploadLogo(form.logoFile, currentBusiness.id);
        if (newLogoUrl) logoUrl = newLogoUrl;
      }

      const success = await editBusiness(currentBusiness.id, { ...businessData, logo: logoUrl });

      if (success) {
        const updated: Business = { ...currentBusiness, ...businessData, logo: logoUrl };
        setCurrentBusiness(updated);
        onUpdated?.(updated);
        setEditModalOpen(false);
      } else {
        setHata("Guncelleme basarisiz oldu.");
      }
    } catch (error) {
      console.error("Guncelleme hatasi:", error);
      setHata("Guncelleme sirasinda bir hata olustu.");
    } finally {
      setSaving(false);
    }
  };

  const profile = currentBusiness.profile || {};

  // Get platform IDs from business
  const getPlatformIds = () => {
    const platformIds: Array<{ platform: string; id: string }> = [];
    const platformLabels: Record<string, string> = {
      instagram_id: "Instagram",
      facebook_id: "Facebook",
      twitter_id: "Twitter",
      tiktok_id: "TikTok",
      youtube_id: "YouTube",
      linkedin_id: "LinkedIn",
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
    // Reload the business data by triggering onUpdated
    // The parent component should refetch the data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-end gap-2">
        <SyncAccountsButton
          businessId={currentBusiness.id}
          lateProfileId={currentBusiness.late_profile_id}
          onSyncComplete={handleSyncComplete}
        />
        <Button onClick={handleOpenEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Duzenle
        </Button>
      </div>

      {/* Business Info Card */}
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
                    <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                      <span className="font-mono text-xs">{color}</span>
                    </div>
                  ))}
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

      {/* Synced Platform Accounts Card */}
      {platformIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Senkronize Edilen Hesaplar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformIds.map(({ platform, id }) => (
                <div key={platform} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{platform}</span>
                  <span className="text-sm text-muted-foreground font-mono truncate max-w-[150px]" title={id}>
                    {id.slice(0, 12)}...
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Info Card */}
      {Object.keys(profile).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(profile).map(([key, value]) => {
                if (key === "extras" && typeof value === "object" && value !== null) {
                  return Object.entries(value as Record<string, string>).map(([ek, ev]) => (
                    <div key={`extras-${ek}`} className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{ek}</p>
                      <p className="text-sm">{ev}</p>
                    </div>
                  ));
                }
                const displayValue = stringifyProfileValue(value);
                if (!displayValue) return null;
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {profileLabels[key] || key}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{displayValue}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Isletmeyi Duzenle</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {hata && <p className="text-sm text-destructive">{hata}</p>}

            <BasicInfoSection
              name={form.name}
              logoPreview={form.logoPreview}
              existingLogo={currentBusiness.logo}
              colors={form.colors}
              newColor={form.newColor}
              lateProfileId={form.lateProfileId}
              disabled={saving}
              onNameChange={(v) => setField("name", v)}
              onLogoSelect={handleLogoSelect}
              onColorAdd={addColor}
              onColorRemove={removeColor}
              onNewColorChange={(v) => setField("newColor", v)}
              onLateProfileIdChange={(v) => setField("lateProfileId", v)}
              showLogoRequiredMark={false}
            />

            <IdentitySection
              slogan={form.slogan}
              industry={form.industry}
              subCategory={form.subCategory}
              marketPosition={form.marketPosition}
              locationCity={form.locationCity}
              disabled={saving}
              onSloganChange={(v) => setField("slogan", v)}
              onIndustryChange={(v) => setField("industry", v)}
              onSubCategoryChange={(v) => setField("subCategory", v)}
              onMarketPositionChange={(v) => setField("marketPosition", v)}
              onLocationCityChange={(v) => setField("locationCity", v)}
            />

            <BrandVoiceSection
              tone={form.tone}
              language={form.language}
              formality={form.formality}
              emojiUsage={form.emojiUsage}
              captionStyle={form.captionStyle}
              disabled={saving}
              onToneChange={(v) => setField("tone", v)}
              onLanguageChange={(v) => setField("language", v)}
              onFormalityChange={(v) => setField("formality", v)}
              onEmojiUsageChange={(v) => setField("emojiUsage", v)}
              onCaptionStyleChange={(v) => setField("captionStyle", v)}
            />

            <VisualSection
              aesthetic={form.aesthetic}
              photographyStyle={form.photographyStyle}
              colorMood={form.colorMood}
              visualMood={form.visualMood}
              disabled={saving}
              onAestheticChange={(v) => setField("aesthetic", v)}
              onPhotographyStyleChange={(v) => setField("photographyStyle", v)}
              onColorMoodChange={(v) => setField("colorMood", v)}
              onVisualMoodChange={(v) => setField("visualMood", v)}
            />

            <TargetAudienceSection
              targetAgeRange={form.targetAgeRange}
              targetGender={form.targetGender}
              targetDescription={form.targetDescription}
              targetInterests={form.targetInterests}
              disabled={saving}
              onTargetAgeRangeChange={(v) => setField("targetAgeRange", v)}
              onTargetGenderChange={(v) => setField("targetGender", v)}
              onTargetDescriptionChange={(v) => setField("targetDescription", v)}
              onTargetInterestsChange={(v) => setField("targetInterests", v)}
            />

            <BrandValuesSection
              brandValues={form.brandValues}
              uniquePoints={form.uniquePoints}
              brandStoryShort={form.brandStoryShort}
              disabled={saving}
              onBrandValuesChange={(v) => setField("brandValues", v)}
              onUniquePointsChange={(v) => setField("uniquePoints", v)}
              onBrandStoryShortChange={(v) => setField("brandStoryShort", v)}
            />

            <SocialMediaSection
              hashtagsBrand={form.hashtagsBrand}
              hashtagsIndustry={form.hashtagsIndustry}
              hashtagsLocation={form.hashtagsLocation}
              contentPillars={form.contentPillars}
              disabled={saving}
              onHashtagsBrandChange={(v) => setField("hashtagsBrand", v)}
              onHashtagsIndustryChange={(v) => setField("hashtagsIndustry", v)}
              onHashtagsLocationChange={(v) => setField("hashtagsLocation", v)}
              onContentPillarsChange={(v) => setField("contentPillars", v)}
            />

            <RulesSection
              avoidTopics={form.avoidTopics}
              seasonalContent={form.seasonalContent}
              promoFrequency={form.promoFrequency}
              disabled={saving}
              onAvoidTopicsChange={(v) => setField("avoidTopics", v)}
              onSeasonalContentChange={(v) => setField("seasonalContent", v)}
              onPromoFrequencyChange={(v) => setField("promoFrequency", v)}
            />

            <ExtraFieldsSection
              extraFields={form.extraFields}
              disabled={saving}
              onAddField={addExtraField}
              onRemoveField={removeExtraField}
              onUpdateField={updateExtraField}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Iptal
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
