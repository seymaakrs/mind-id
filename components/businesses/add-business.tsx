"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Loader2, Globe, Sparkles } from "lucide-react";
import { useBusinesses, useBusinessForm, useAgentTask } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
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

type Status = "bosta" | "kaydediliyor" | "basarili" | "hata";
export default function AddBusinessComponent() {
  const [status, setStatus] = useState<Status>("bosta");
  const [hata, setHata] = useState<string | null>(null);

  // Analiz dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  const { user } = useAuth();
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

  const {
    loading: analyzing,
    error: analysisError,
    progressMessages,
    sendTask,
    reset: resetAgent,
  } = useAgentTask();

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

  const handleOpenAnalyzeDialog = () => {
    setTempName("");
    setWebsiteUrl("");
    resetAgent();
    setDialogOpen(true);
  };

  const handleAnalyze = async () => {
    if (!tempName.trim()) {
      setHata("İşletme adı zorunludur.");
      return;
    }
    if (!websiteUrl.trim()) {
      setHata("Web sitesi URL'si zorunludur.");
      return;
    }

    setHata(null);

    try {
      // 1. Minimal işletme oluştur
      const minimalBusiness = {
        name: tempName.trim(),
        logo: "", // Kullanıcı sonra ekleyecek
        colors: ["#000000"], // Varsayılan renk
        late_profile_id: "",
        profile: {},
      };

      const businessId = await createBusiness(minimalBusiness);
      if (!businessId) {
        setHata("İşletme oluşturulamadı.");
        return;
      }

      setCreatedBusinessId(businessId);
      setField("name", tempName.trim());
      setField("colors", ["#000000"]);

      // 2. Agent'a analiz task'ı gönder (backend profili doğrudan güncelleyecek)
      const taskPrompt = `Bu işletmenin web sitesini analiz et ve profil bilgilerini güncelle: ${websiteUrl}`;

      const result = await sendTask({
        task: taskPrompt,
        businessId,
        createdBy: user?.displayName || user?.email || undefined,
        extras: { website_url: websiteUrl },
      });

      if (result) {
        // Agent başarılı oldu, dialog'u kapat
        setDialogOpen(false);
        // Kullanıcıya bilgi ver - işletme listesine yönlendirilebilir
        setStatus("basarili");
      }
    } catch (error) {
      console.error("Analiz hatası:", error);
      setHata("Analiz sırasında bir hata oluştu.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setHata(validationError);
      return;
    }

    // Eğer analiz ile oluşturulduysa logo zorunlu değil
    if (!form.logoFile && !createdBusinessId) {
      setHata("Logo yüklemek zorunludur.");
      return;
    }

    setStatus("kaydediliyor");
    setHata(null);

    try {
      const businessData = buildBusinessData();

      // Eğer analiz ile zaten oluşturulduysa, güncelle
      if (createdBusinessId) {
        // TODO: editBusiness fonksiyonu eklenebilir
        // Şimdilik yeni işletme olarak devam
      }

      let logoUrl = "";
      if (form.logoFile) {
        const tempId = createdBusinessId || `temp_${Date.now()}`;
        const uploadedUrl = await uploadLogo(form.logoFile, tempId);
        if (!uploadedUrl) {
          setHata("Logo yüklenirken bir hata oluştu.");
          setStatus("hata");
          return;
        }
        logoUrl = uploadedUrl;
      }

      const businessId = await createBusiness({ ...businessData, logo: logoUrl });

      if (businessId) {
        setStatus("basarili");
        resetForm();
        setCreatedBusinessId(null);
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

  const isDisabled = status === "kaydediliyor" || analyzing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Yeni İşletme Ekle</h2>
            <p className="text-muted-foreground">İşletme bilgilerini girin</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleOpenAnalyzeDialog}
          disabled={isDisabled}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          İşletmeyi Analiz Et
        </Button>
      </div>

      {/* Analiz Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Web Sitesi Analizi
            </DialogTitle>
            <DialogDescription>
              İşletmenin web sitesini girin, AI otomatik olarak profil bilgilerini dolduracak.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tempName">İşletme Adı *</Label>
              <Input
                id="tempName"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Örn: Acme Teknoloji"
                disabled={analyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Web Sitesi URL'si *</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={analyzing}
              />
            </div>

            {analyzing && (
              <Card className="bg-muted/50 font-mono text-xs overflow-hidden">
                <CardContent className="p-3 max-h-[200px] overflow-y-auto space-y-1">
                  <p className="font-bold text-primary mb-2">Agent çalışıyor...</p>
                  {progressMessages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                  <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
                </CardContent>
              </Card>
            )}

            {analysisError && (
              <p className="text-sm text-destructive">{analysisError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={analyzing}
            >
              İptal
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analiz Et
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoSection
          name={form.name}
          logoPreview={form.logoPreview}
          colors={form.colors}
          newColor={form.newColor}
          lateProfileId={form.lateProfileId}
          disabled={isDisabled}
          onNameChange={(v) => setField("name", v)}
          onLogoSelect={handleLogoSelect}
          onColorAdd={addColor}
          onColorRemove={removeColor}
          onNewColorChange={(v) => setField("newColor", v)}
          onLateProfileIdChange={(v) => setField("lateProfileId", v)}
          logoFileName={form.logoFile?.name}
          showLogoRequiredMark={!createdBusinessId}
        />

        {/* Sync Accounts Button - shown when business is created and has late_profile_id */}
        {createdBusinessId && form.lateProfileId && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Hesap Senkronizasyonu</p>
                  <p className="text-sm text-muted-foreground">
                    Late Profile ID kullanarak diger platform hesaplarini senkronize edin
                  </p>
                </div>
                <SyncAccountsButton
                  businessId={createdBusinessId}
                  lateProfileId={form.lateProfileId}
                  disabled={isDisabled}
                />
              </div>
            </CardContent>
          </Card>
        )}

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
