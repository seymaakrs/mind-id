"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Loader2,
  Globe,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import { useBusinesses, useBusinessForm, useAgentTask } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_COLOR } from "@/lib/constants";
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

type WizardStep = "intro" | "analyzing" | "review" | "done";
type EntryMode = "ai" | "manual";

const STEP_LABELS = ["İşletme Bilgisi", "AI Analizi", "İnceleme"];
const REVIEW_PAGE_TITLES = [
  "Temel Bilgiler & Kimlik",
  "Marka Sesi & Görsel",
  "Değerler, Sosyal & Kurallar",
];
const TOTAL_REVIEW_PAGES = 3;

export default function AddBusinessComponent() {
  const [step, setStep] = useState<WizardStep>("intro");
  const [mode, setMode] = useState<EntryMode | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  const [tempName, setTempName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const { user } = useAuth();
  const { createBusiness, editBusiness, uploadLogo, loadBusiness } = useBusinesses();
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
    loadFromBusiness,
    buildBusinessData,
    validate,
  } = useBusinessForm();

  const {
    error: analysisError,
    progressMessages,
    sendTask,
    reset: resetAgent,
    currentTask,
  } = useAgentTask();

  // AI analiz tamamlanınca profili çekip incelemeye geç
  useEffect(() => {
    if (step !== "analyzing" || !createdBusinessId) return;
    if (currentTask?.status === "completed") {
      (async () => {
        const business = await loadBusiness(createdBusinessId);
        if (business) loadFromBusiness(business);
        setReviewPage(0);
        setStep("review");
      })();
    }
  }, [currentTask?.status, step, createdBusinessId, loadBusiness, loadFromBusiness]);

  const analyzing =
    currentTask?.status === "pending" || currentTask?.status === "running";
  const analysisFailed = step === "analyzing" && currentTask?.status === "failed";

  const resetWizard = () => {
    resetForm();
    resetAgent();
    setStep("intro");
    setMode(null);
    setReviewPage(0);
    setCreatedBusinessId(null);
    setTempName("");
    setWebsiteUrl("");
    setHata(null);
    setSaving(false);
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
      const businessId = await createBusiness({
        name: tempName.trim(),
        logo: "",
        colors: [DEFAULT_COLOR],
        late_profile_id: "",
        profile: {},
      });
      if (!businessId) {
        setHata("İşletme oluşturulamadı.");
        return;
      }

      setCreatedBusinessId(businessId);
      setField("name", tempName.trim());
      setField("colors", [DEFAULT_COLOR]);
      setMode("ai");
      setStep("analyzing");

      await sendTask({
        task: `Bu işletmenin web sitesini analiz et ve profil bilgilerini güncelle: ${websiteUrl}`,
        businessId,
        createdBy: user?.displayName || user?.email || undefined,
        extras: { website_url: websiteUrl },
      });
    } catch (error) {
      console.error("Analiz hatası:", error);
      setHata("Analiz sırasında bir hata oluştu.");
      setStep("intro");
    }
  };

  const handleManual = () => {
    setMode("manual");
    if (tempName.trim()) setField("name", tempName.trim());
    if (websiteUrl.trim()) setField("website", websiteUrl.trim());
    setField("colors", [DEFAULT_COLOR]);
    setReviewPage(0);
    setHata(null);
    setStep("review");
  };

  const continueManuallyAfterFailure = () => {
    setMode("manual");
    setField("name", tempName.trim());
    setField("colors", [DEFAULT_COLOR]);
    setReviewPage(0);
    setHata(null);
    setStep("review");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setHata(validationError);
      return;
    }

    // Logo, yalnızca henüz işletme oluşturulmamış manuel girişte zorunlu
    if (!form.logoFile && !createdBusinessId) {
      setHata("Logo yüklemek zorunludur.");
      return;
    }

    setSaving(true);
    setHata(null);

    try {
      const businessData = buildBusinessData();

      let logoUrl = "";
      if (form.logoFile) {
        const tempId = createdBusinessId || `temp_${Date.now()}`;
        const uploadedUrl = await uploadLogo(form.logoFile, tempId);
        if (!uploadedUrl) {
          setHata("Logo yüklenirken bir hata oluştu.");
          setSaving(false);
          return;
        }
        logoUrl = uploadedUrl;
      }

      let success: boolean;
      if (createdBusinessId) {
        success = await editBusiness(createdBusinessId, {
          ...businessData,
          ...(logoUrl ? { logo: logoUrl } : {}),
        });
      } else {
        const newId = await createBusiness({ ...businessData, logo: logoUrl });
        success = !!newId;
      }

      if (success) {
        setStep("done");
      } else {
        setHata("İşletme kaydedilirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("İşletme kaydedilirken hata:", error);
      setHata("İşletme kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const activeStepIndex =
    step === "intro" ? 0 : step === "analyzing" ? 1 : 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">Yeni İşletme Ekle</h2>
          <p className="text-muted-foreground">
            Web sitesini yapay zekaya analiz ettir, gözden geçir, kaydet.
          </p>
        </div>
      </div>

      {/* Adım göstergesi */}
      {step !== "done" && (
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const done = i < activeStepIndex;
            const active = i === activeStepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 text-sm ${
                    active
                      ? "text-primary font-semibold"
                      : done
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full text-xs border ${
                        active ? "border-primary text-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                  {label}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <span className="w-8 h-px bg-border" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADIM 1: Giriş */}
      {step === "intro" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="w-4 h-4" />
              Web Sitesi Analizi
            </div>
            <p className="text-sm text-muted-foreground">
              İşletmenin adını ve web sitesini girin; yapay zeka profil
              bilgilerini otomatik dolduracak.
            </p>

            <div className="space-y-2">
              <Label htmlFor="tempName">İşletme Adı *</Label>
              <Input
                id="tempName"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Örn: Acme Teknoloji"
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
              />
            </div>

            {hata && <p className="text-sm text-destructive">{hata}</p>}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleAnalyze} className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI ile Analiz Et
              </Button>
              <Button variant="outline" onClick={handleManual} className="gap-2">
                <PencilLine className="w-4 h-4" />
                Web sitem yok — manuel gir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADIM 2: Analiz */}
      {step === "analyzing" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              {analyzing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              {analyzing
                ? "AI işletmeyi analiz ediyor…"
                : analysisFailed
                  ? "Analiz tamamlanamadı"
                  : "Analiz başlatılıyor…"}
            </div>

            {(progressMessages.length > 0 || analyzing) && (
              <Card className="bg-muted/50 font-mono text-xs overflow-hidden">
                <CardContent className="p-3 max-h-[300px] overflow-y-auto space-y-1">
                  {progressMessages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground">
                        [{new Date(msg.timestamp).toLocaleTimeString()}]
                      </span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                  <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
                </CardContent>
              </Card>
            )}

            {analysisFailed && (
              <>
                {analysisError && (
                  <p className="text-sm text-destructive">{analysisError}</p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleAnalyze} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Tekrar dene
                  </Button>
                  <Button
                    variant="outline"
                    onClick={continueManuallyAfterFailure}
                    className="gap-2"
                  >
                    <PencilLine className="w-4 h-4" />
                    Manuel devam et
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ADIM 3: İnceleme */}
      {step === "review" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {REVIEW_PAGE_TITLES[reviewPage]}
            </p>
            <span className="text-xs text-muted-foreground">
              Bölüm {reviewPage + 1}/{TOTAL_REVIEW_PAGES}
            </span>
          </div>

          {reviewPage === 0 && (
            <>
              <BasicInfoSection
                name={form.name}
                logoPreview={form.logoPreview}
                colors={form.colors}
                newColor={form.newColor}
                website={form.website}
                lateProfileId={form.lateProfileId}
                disabled={saving}
                onNameChange={(v) => setField("name", v)}
                onLogoSelect={handleLogoSelect}
                onColorAdd={addColor}
                onColorRemove={removeColor}
                onNewColorChange={(v) => setField("newColor", v)}
                onWebsiteChange={(v) => setField("website", v)}
                onLateProfileIdChange={(v) => setField("lateProfileId", v)}
                logoFileName={form.logoFile?.name}
                showLogoRequiredMark={!createdBusinessId}
              />

              {createdBusinessId && form.lateProfileId && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Hesap Senkronizasyonu</p>
                        <p className="text-sm text-muted-foreground">
                          Late Profile ID kullanarak diğer platform hesaplarını
                          senkronize edin
                        </p>
                      </div>
                      <SyncAccountsButton
                        businessId={createdBusinessId}
                        lateProfileId={form.lateProfileId}
                        disabled={saving}
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
                disabled={saving}
                onSloganChange={(v) => setField("slogan", v)}
                onIndustryChange={(v) => setField("industry", v)}
                onSubCategoryChange={(v) => setField("subCategory", v)}
                onMarketPositionChange={(v) => setField("marketPosition", v)}
                onLocationCityChange={(v) => setField("locationCity", v)}
              />
            </>
          )}

          {reviewPage === 1 && (
            <>
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
                font={form.font}
                customFont={form.customFont}
                disabled={saving}
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
                disabled={saving}
                onTargetAgeRangeChange={(v) => setField("targetAgeRange", v)}
                onTargetGenderChange={(v) => setField("targetGender", v)}
                onTargetDescriptionChange={(v) => setField("targetDescription", v)}
                onTargetInterestsChange={(v) => setField("targetInterests", v)}
              />
            </>
          )}

          {reviewPage === 2 && (
            <>
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
            </>
          )}

          {hata && <p className="text-sm text-destructive">{hata}</p>}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={saving || reviewPage === 0}
              onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Button>

            {reviewPage < TOTAL_REVIEW_PAGES - 1 ? (
              <Button
                type="button"
                disabled={saving}
                onClick={() => setReviewPage((p) => p + 1)}
                className="gap-2"
              >
                Devam
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    İşletmeyi Kaydet
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      )}

      {/* ADIM 4: Bitti */}
      {step === "done" && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
            <div>
              <h3 className="text-xl font-semibold">İşletme kaydedildi!</h3>
              <p className="text-muted-foreground">
                İşletme başarıyla eklendi. Yeni bir işletme ekleyebilirsiniz.
              </p>
            </div>
            <Button onClick={resetWizard} className="gap-2">
              <Building2 className="w-4 h-4" />
              Yeni İşletme Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
