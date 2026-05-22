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
  PencilLine,
  RotateCcw,
  Save,
} from "lucide-react";
import { useBusinesses, useAgentTask } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_COLOR } from "@/lib/constants";
import {
  emptyBrandIdentity,
  buildBrandIdentityFromBusiness,
  type BrandIdentity,
} from "@/lib/brandIdentity";
import { getBrandIdentity, saveBrandIdentity } from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/firebase/storage";
import {
  BrandIdentityFields,
  setBrandPath,
} from "@/components/business/BrandIdentityFields";

type WizardStep = "intro" | "analyzing" | "review" | "done";
type EntryMode = "ai" | "manual";

const STEP_LABELS = ["İşletme Bilgisi", "AI Analizi", "Marka Kimliği"];

export default function AddBusinessComponent() {
  const [step, setStep] = useState<WizardStep>("intro");
  const [, setMode] = useState<EntryMode | null>(null);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<BrandIdentity | null>(null);

  const [tempName, setTempName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const { user } = useAuth();
  const { createBusiness, editBusiness, loadBusiness } = useBusinesses();
  const {
    error: analysisError,
    progressMessages,
    sendTask,
    reset: resetAgent,
    currentTask,
  } = useAgentTask();

  // AI analiz tamamlanınca profili çekip marka kimliğine dönüştür
  useEffect(() => {
    if (step !== "analyzing" || !createdBusinessId) return;
    if (currentTask?.status === "completed") {
      (async () => {
        const biz = await loadBusiness(createdBusinessId);
        let bi: BrandIdentity | null = null;
        try {
          bi = await getBrandIdentity(createdBusinessId);
        } catch {
          bi = null;
        }
        if (!bi) {
          bi = buildBrandIdentityFromBusiness({
            businessId: createdBusinessId,
            name: biz?.name || tempName.trim(),
            logo: biz?.logo,
            colors: biz?.colors,
            profile: biz?.profile,
            source: "ai_synthesis",
          });
        }
        if (!bi.basics.name) bi.basics.name = tempName.trim() || null;
        setIdentity(bi);
        setStep("review");
      })();
    }
  }, [currentTask?.status, step, createdBusinessId, loadBusiness, tempName]);

  const analyzing =
    currentTask?.status === "pending" || currentTask?.status === "running";
  const analysisFailed = step === "analyzing" && currentTask?.status === "failed";

  const resetWizard = () => {
    resetAgent();
    setStep("intro");
    setMode(null);
    setCreatedBusinessId(null);
    setIdentity(null);
    setTempName("");
    setWebsiteUrl("");
    setHata(null);
    setSaving(false);
  };

  const createMinimalBusiness = async (): Promise<string | null> => {
    return createBusiness({
      name: tempName.trim() || "Yeni İşletme",
      logo: "",
      colors: [DEFAULT_COLOR],
      late_profile_id: "",
      zernio_profile_id: "",
      profile: {},
    });
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
      const businessId = createdBusinessId || (await createMinimalBusiness());
      if (!businessId) {
        setHata("İşletme oluşturulamadı.");
        return;
      }
      setCreatedBusinessId(businessId);
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

  const startManual = async () => {
    setHata(null);
    try {
      const businessId = createdBusinessId || (await createMinimalBusiness());
      if (!businessId) {
        setHata("İşletme oluşturulamadı.");
        return;
      }
      setCreatedBusinessId(businessId);
      setMode("manual");
      const bi = emptyBrandIdentity(businessId, "manual");
      bi.basics.name = tempName.trim() || null;
      setIdentity(bi);
      setStep("review");
    } catch (error) {
      console.error("İşletme oluşturma hatası:", error);
      setHata("İşletme oluşturulurken bir hata oluştu.");
    }
  };

  const continueManuallyAfterFailure = async () => {
    if (!createdBusinessId) {
      await startManual();
      return;
    }
    setMode("manual");
    const bi = emptyBrandIdentity(createdBusinessId, "manual");
    bi.basics.name = tempName.trim();
    setIdentity(bi);
    setHata(null);
    setStep("review");
  };

  const handleIdentityChange = (path: string, value: unknown) => {
    setIdentity((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as unknown as Record<string, unknown>;
      setBrandPath(next, path, value);
      return next as unknown as BrandIdentity;
    });
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file || !createdBusinessId) return;
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
        `businesses/${createdBusinessId}/brand_logo.${ext}`
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
    if (!identity || !createdBusinessId) return;
    if (!identity.basics.name?.trim()) {
      setHata("Marka adı zorunludur.");
      return;
    }

    setSaving(true);
    setHata(null);
    try {
      await editBusiness(createdBusinessId, {
        name: identity.basics.name.trim(),
        logo: identity.visual.logo_url || "",
        colors: identity.visual.primary_colors,
      });
      await saveBrandIdentity(createdBusinessId, identity);
      setStep("done");
    } catch (error) {
      console.error("İşletme kaydedilirken hata:", error);
      setHata("İşletme kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const activeStepIndex = step === "intro" ? 0 : step === "analyzing" ? 1 : 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">Yeni İşletme Ekle</h2>
          <p className="text-muted-foreground">
            Web sitesini yapay zekaya analiz ettir, marka kimliğini gözden
            geçir, kaydet. Ajanlar bu kimliği kullanır.
          </p>
        </div>
      </div>

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
                        active
                          ? "border-primary text-primary"
                          : "border-muted-foreground/40"
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
              İşletmenin adını ve web sitesini girin; yapay zeka marka kimliğini
              otomatik dolduracak.
            </p>

            <div className="space-y-2">
              <Label htmlFor="tempName">İşletme Adı</Label>
              <Input
                id="tempName"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Örn: Acme Teknoloji"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">
                Web Sitesi URL'si{" "}
                <span className="text-muted-foreground">
                  (yalnızca AI analizi için)
                </span>
              </Label>
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
              <Button
                variant="outline"
                onClick={startManual}
                className="gap-2"
              >
                <PencilLine className="w-4 h-4" />
                Web sitem yok — manuel gir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Manuel girişte web sitesi (ve ad) zorunlu değildir; tüm
              bilgileri sonraki adımda doldurabilirsiniz.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ADIM 2: Analiz */}
      {step === "analyzing" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              {analyzing && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
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
                  <div
                    ref={(el) => el?.scrollIntoView({ behavior: "smooth" })}
                  />
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

      {/* ADIM 3: Marka Kimliği İncelemesi */}
      {step === "review" && identity && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Aşağıdaki alanlar otomatik dolduruldu. Seçim listeleri ve örneklerle
            rahatça düzenleyip kaydedin.
          </p>

          <BrandIdentityFields
            identity={identity}
            onChange={handleIdentityChange}
            onLogoSelect={handleLogo}
            logoUploading={logoUploading}
            disabled={saving}
          />

          {hata && <p className="text-sm text-destructive">{hata}</p>}

          <div className="flex items-center gap-3 sticky bottom-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              İşletmeyi Kaydet
            </Button>
          </div>
        </div>
      )}

      {/* ADIM 4: Bitti */}
      {step === "done" && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
            <div>
              <h3 className="text-xl font-semibold">İşletme kaydedildi!</h3>
              <p className="text-muted-foreground">
                Marka kimliği kaydedildi. Ajanlar artık bu kimliği kullanacak.
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
