"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Loader2,
  PencilLine,
  Save,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useBusinesses } from "@/hooks";
import { DEFAULT_COLOR } from "@/lib/constants";
import {
  emptyBrandIdentity,
  type BrandIdentity,
} from "@/lib/brandIdentity";
import { saveBrandIdentity } from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/firebase/storage";
import {
  BrandIdentityFields,
  setBrandPath,
} from "@/components/business/BrandIdentityFields";
import { BusinessPreviewCard } from "./business-preview-card";

// AI URL analizi geçici olarak devre dışı — form redesign sürerken token
// harcamamak için. Tekrar açma planı: mind-id#18.
const AI_ANALYSIS_PAUSED = true;

type WizardStep = "intro" | "review" | "done";

const STEP_LABELS = ["İşletme Bilgisi", "Marka Kimliği"];

export default function AddBusinessComponent() {
  const [step, setStep] = useState<WizardStep>("intro");
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<BrandIdentity | null>(null);

  const [tempName, setTempName] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const { createBusiness, editBusiness } = useBusinesses();

  const resetWizard = () => {
    setStep("intro");
    setCreatedBusinessId(null);
    setIdentity(null);
    setTempName("");
    setHata(null);
    setSaving(false);
  };

  const createMinimalBusiness = async (): Promise<string | null> => {
    return createBusiness({
      name: tempName.trim() || "Yeni İşletme",
      logo: "",
      colors: [DEFAULT_COLOR],
      late_profile_id: "",
      profile: {},
    });
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
      const bi = emptyBrandIdentity(businessId, "manual");
      bi.basics.name = tempName.trim() || null;
      setIdentity(bi);
      setStep("review");
    } catch (error) {
      console.error("İşletme oluşturma hatası:", error);
      setHata("İşletme oluşturulurken bir hata oluştu.");
    }
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

  const activeStepIndex = step === "intro" ? 0 : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">Yeni İşletme Ekle</h2>
          <p className="text-muted-foreground">
            İşletme adını gir, marka kimliğini doldur, kaydet. Ajanlar bu
            kimliği kullanır.
          </p>
        </div>
      </div>

      {AI_ANALYSIS_PAUSED && step === "intro" && (
        <div className="flex gap-3 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              AI URL analizi geçici olarak kapalı
            </p>
            <p className="text-amber-800/90 dark:text-amber-200/80 mt-0.5">
              Marka kimliği formu yenileniyor; token tasarrufu için web sitesi
              analizi şu an devre dışı. Manuel giriş ile devam edebilirsin.
            </p>
          </div>
        </div>
      )}

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

      {/* ADIM 1: Giriş (manuel) */}
      {step === "intro" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tempName">İşletme Adı</Label>
              <Input
                id="tempName"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Örn: Acme Teknoloji"
              />
            </div>

            {hata && <p className="text-sm text-destructive">{hata}</p>}

            <div className="flex pt-2">
              <Button onClick={startManual} className="gap-2">
                <PencilLine className="w-4 h-4" />
                Devam et — Marka Kimliği'ni doldur
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADIM 2: Marka Kimliği İncelemesi */}
      {step === "review" && identity && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Marka kimliğini doldur ve kaydet. Boş bırakılan alanlar daha sonra
            panelden düzenlenebilir.
          </p>

          <BusinessPreviewCard
            identity={identity}
            logoUrl={identity.visual?.logo_url || null}
          />

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

      {/* ADIM 3: Bitti */}
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
