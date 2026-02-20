"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useBusinessForm } from "@/hooks/useBusinessForm";
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

type PageStatus = "loading" | "valid" | "invalid" | "submitting" | "success" | "error";

export default function PublicFormPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [inviteLabel, setInviteLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    form,
    setField,
    setLogoFile,
    addColor,
    removeColor,
    addExtraField,
    removeExtraField,
    updateExtraField,
    buildBusinessData,
    validate,
  } = useBusinessForm();

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/form-invite/${token}`);
        const data = await res.json();

        if (data.valid) {
          setPageStatus("valid");
          setInviteLabel(data.label);
        } else {
          setPageStatus("invalid");
          setErrorMessage(data.error || "Geçersiz davet linki");
        }
      } catch {
        setPageStatus("invalid");
        setErrorMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
      }
    }

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSubmitError("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }
    setLogoFile(file);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    if (!form.logoFile) {
      setSubmitError("Logo yüklemek zorunludur.");
      return;
    }

    setPageStatus("submitting");
    setSubmitError(null);

    try {
      const businessData = buildBusinessData();

      const formData = new FormData();
      formData.append("token", token);
      formData.append("businessData", JSON.stringify(businessData));
      formData.append("logo", form.logoFile);

      const res = await fetch("/api/form-submit", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        setPageStatus("success");
      } else {
        setPageStatus("valid");
        setSubmitError(result.error || "Bir hata oluştu.");
      }
    } catch {
      setPageStatus("valid");
      setSubmitError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  // Loading state
  if (pageStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Davet linki doğrulanıyor...</p>
      </div>
    );
  }

  // Invalid token
  if (pageStatus === "invalid") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Geçersiz Davet Linki</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (pageStatus === "success") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Başarıyla Gönderildi!</h2>
          <p className="text-muted-foreground">
            İşletme bilgileriniz başarıyla kaydedildi. Ekibimiz bilgilerinizi inceleyip onaylayacaktır.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Onay bekleniyor</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDisabled = pageStatus === "submitting";

  // Form
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">İşletme Bilgileri</h2>
          <p className="text-muted-foreground">
            {inviteLabel
              ? `${inviteLabel} - İşletme bilgilerinizi doldurun`
              : "İşletme bilgilerinizi doldurun"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoSection
          name={form.name}
          logoPreview={form.logoPreview}
          colors={form.colors}
          newColor={form.newColor}
          website={form.website}
          lateProfileId={form.lateProfileId}
          disabled={isDisabled}
          onNameChange={(v) => setField("name", v)}
          onLogoSelect={handleLogoSelect}
          onColorAdd={addColor}
          onColorRemove={removeColor}
          onNewColorChange={(v) => setField("newColor", v)}
          onWebsiteChange={(v) => setField("website", v)}
          onLateProfileIdChange={(v) => setField("lateProfileId", v)}
          logoFileName={form.logoFile?.name}
          showLogoRequiredMark={true}
          hideLateProfileId={true}
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
          font={form.font}
          customFont={form.customFont}
          disabled={isDisabled}
          onAestheticChange={(v) => setField("aesthetic", v)}
          onPhotographyStyleChange={(v) => setField("photographyStyle", v)}
          onColorMoodChange={(v) => setField("colorMood", v)}
          onVisualMoodChange={(v) => setField("visualMood", v)}
          onFontChange={(v) => setField("font", v)}
          onCustomFontChange={(v) => setField("customFont", v)}
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

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button type="submit" className="w-full" disabled={isDisabled}>
          {pageStatus === "submitting" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 mr-2" />
              İşletme Bilgilerini Gönder
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
