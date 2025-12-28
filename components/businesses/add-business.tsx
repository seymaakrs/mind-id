"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
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

type Status = "bosta" | "kaydediliyor" | "basarili" | "hata";

export default function AddBusinessComponent() {
  const [status, setStatus] = useState<Status>("bosta");
  const [hata, setHata] = useState<string | null>(null);

  const { createBusiness, uploadLogo } = useBusinesses();
  const {
    form,
    setField,
    setLogoFile,
    addColor,
    removeColor,
    addExtraField,
    removeExtraField,
    updateExtraField,
    resetForm,
    buildBusinessData,
    validate,
  } = useBusinessForm();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setHata(validationError);
      return;
    }

    if (!form.logoFile) {
      setHata("Logo yüklemek zorunludur.");
      return;
    }

    setStatus("kaydediliyor");
    setHata(null);

    try {
      const businessData = buildBusinessData();
      const tempId = `temp_${Date.now()}`;

      const logoUrl = await uploadLogo(form.logoFile, tempId);
      if (!logoUrl) {
        setHata("Logo yüklenirken bir hata oluştu.");
        setStatus("hata");
        return;
      }

      const businessId = await createBusiness({ ...businessData, logo: logoUrl });

      if (businessId) {
        setStatus("basarili");
        resetForm();
      } else {
        setStatus("hata");
        setHata("İşletme kaydedilirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("İşletme kaydedilirken hata:", error);
      setHata("İşletme kaydedilirken bir hata oluştu.");
      setStatus("hata");
    }
  };

  const isDisabled = status === "kaydediliyor";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">Yeni İşletme Ekle</h2>
          <p className="text-muted-foreground">İşletme bilgilerini girin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoSection
          name={form.name}
          logoPreview={form.logoPreview}
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
          logoFileName={form.logoFile?.name}
          showLogoRequiredMark={true}
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

        {hata && <p className="text-sm text-destructive">{hata}</p>}
        {status === "basarili" && (
          <p className="text-sm text-green-600">İşletme başarıyla kaydedildi!</p>
        )}

        <Button type="submit" className="w-full" disabled={isDisabled}>
          {status === "kaydediliyor" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 mr-2" />
              İşletmeyi Kaydet
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
