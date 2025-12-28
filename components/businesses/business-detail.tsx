"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Palette,
  Building2,
  Pencil,
  X,
  Save,
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
import type { Business } from "@/types/firebase";

type Props = {
  business: Business;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onUpdated?: (updated: Business) => void;
};

const profileLabels: Record<string, string> = {
  slogan: "Slogan", industry: "Sektör", sub_category: "Alt Kategori", market_position: "Pazar Konumu",
  location_city: "Şehir / Konum", tone: "Ses Tonu", language: "Dil", formality: "Resmiyet Düzeyi",
  emoji_usage: "Emoji Kullanımı", caption_style: "Caption Stili", aesthetic: "Estetik",
  photography_style: "Fotoğraf Stili", color_mood: "Renk Havası", visual_mood: "Görsel Hava",
  target_age_range: "Yaş Aralığı", target_gender: "Cinsiyet", target_description: "Hedef Kitle Açıklaması",
  target_interests: "İlgi Alanları", brand_values: "Marka Değerleri", unique_points: "Benzersiz Noktalar",
  brand_story_short: "Kısa Marka Hikayesi", hashtags_brand: "Marka Hashtagleri",
  hashtags_industry: "Sektör Hashtagleri", hashtags_location: "Konum Hashtagleri",
  content_pillars: "İçerik Direkleri", avoid_topics: "Kaçınılacak Konular",
  seasonal_content: "Mevsimsel İçerik", promo_frequency: "Promosyon Sıklığı", extras: "Ekstra Alanlar",
};

const stringifyProfileValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

export default function BusinessDetail({ business, onBack, onDeleted, onUpdated }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState(business);

  const { removeBusiness, editBusiness, uploadLogo } = useBusinesses();
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

  useEffect(() => {
    if (editing) {
      loadFromBusiness(currentBusiness);
    }
  }, [editing, currentBusiness, loadFromBusiness]);

  const handleDelete = async () => {
    if (!confirm(`"${currentBusiness.name}" işletmesini silmek istediğinize emin misiniz?`)) return;
    setDeleting(true);
    try {
      await removeBusiness(currentBusiness.id);
      onDeleted(currentBusiness.id);
    } catch (error) {
      console.error("İşletme silinirken hata:", error);
      alert("İşletme silinirken bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setHata("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHata("Logo dosyası 5MB'dan küçük olmalıdır.");
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
        setEditing(false);
      } else {
        setHata("Güncelleme başarısız oldu.");
      }
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

  const profile = currentBusiness.profile || {};
  const isDisabled = saving;

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />Geri
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />Düzenle
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" />Sil</>}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden border flex-shrink-0">
                {currentBusiness.logo ? (
                  <img src={currentBusiness.logo} alt={currentBusiness.name} className="w-full h-full object-contain p-2" />
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
                {currentBusiness.instagram_account_id && (
                  <p className="text-sm text-muted-foreground">Instagram ID: {currentBusiness.instagram_account_id}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.keys(profile).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Profil Bilgileri</CardTitle></CardHeader>
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
                      <p className="text-sm font-medium text-muted-foreground">{profileLabels[key] || key}</p>
                      <p className="text-sm whitespace-pre-wrap">{displayValue}</p>
                    </div>
                  );
                })}
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
          <X className="w-4 h-4 mr-2" />İptal
        </Button>
        <Button onClick={handleSave} disabled={isDisabled}>
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Kaydediliyor...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Kaydet</>
          )}
        </Button>
      </div>

      {hata && <p className="text-sm text-destructive">{hata}</p>}

      <BasicInfoSection
        name={form.name}
        logoPreview={form.logoPreview}
        existingLogo={currentBusiness.logo}
        colors={form.colors}
        newColor={form.newColor}
        instagramId={form.instagramId}
        instagramToken={form.instagramToken}
        disabled={isDisabled}
        onNameChange={(v) => setField("name", v)}
        onLogoSelect={handleLogoSelect}
        onColorAdd={addColor}
        onColorRemove={removeColor}
        onNewColorChange={(v) => setField("newColor", v)}
        onInstagramIdChange={(v) => setField("instagramId", v)}
        onInstagramTokenChange={(v) => setField("instagramToken", v)}
        showLogoRequiredMark={false}
      />

      <IdentitySection
        slogan={form.slogan}
        industry={form.industry}
        subCategory={form.subCategory}
        marketPosition={form.marketPosition}
        locationCity={form.locationCity}
        disabled={isDisabled}
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
        disabled={isDisabled}
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
        disabled={isDisabled}
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
        disabled={isDisabled}
        onTargetAgeRangeChange={(v) => setField("targetAgeRange", v)}
        onTargetGenderChange={(v) => setField("targetGender", v)}
        onTargetDescriptionChange={(v) => setField("targetDescription", v)}
        onTargetInterestsChange={(v) => setField("targetInterests", v)}
      />

      <BrandValuesSection
        brandValues={form.brandValues}
        uniquePoints={form.uniquePoints}
        brandStoryShort={form.brandStoryShort}
        disabled={isDisabled}
        onBrandValuesChange={(v) => setField("brandValues", v)}
        onUniquePointsChange={(v) => setField("uniquePoints", v)}
        onBrandStoryShortChange={(v) => setField("brandStoryShort", v)}
      />

      <SocialMediaSection
        hashtagsBrand={form.hashtagsBrand}
        hashtagsIndustry={form.hashtagsIndustry}
        hashtagsLocation={form.hashtagsLocation}
        contentPillars={form.contentPillars}
        disabled={isDisabled}
        onHashtagsBrandChange={(v) => setField("hashtagsBrand", v)}
        onHashtagsIndustryChange={(v) => setField("hashtagsIndustry", v)}
        onHashtagsLocationChange={(v) => setField("hashtagsLocation", v)}
        onContentPillarsChange={(v) => setField("contentPillars", v)}
      />

      <RulesSection
        avoidTopics={form.avoidTopics}
        seasonalContent={form.seasonalContent}
        promoFrequency={form.promoFrequency}
        disabled={isDisabled}
        onAvoidTopicsChange={(v) => setField("avoidTopics", v)}
        onSeasonalContentChange={(v) => setField("seasonalContent", v)}
        onPromoFrequencyChange={(v) => setField("promoFrequency", v)}
      />

      <ExtraFieldsSection
        extraFields={form.extraFields}
        disabled={isDisabled}
        onAddField={addExtraField}
        onRemoveField={removeExtraField}
        onUpdateField={updateExtraField}
      />
    </div>
  );
}
