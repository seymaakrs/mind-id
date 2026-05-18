"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, CheckCircle2, AlertCircle, Fingerprint, Upload } from "lucide-react";
import { useBusinesses } from "@/hooks";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import { FormSection } from "@/components/shared/FormSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBrandIdentity, saveBrandIdentity } from "@/lib/firebase/firestore";
import { uploadFile } from "@/lib/firebase/storage";
import { emptyBrandIdentity, type BrandIdentity } from "@/lib/brandIdentity";

type Durum = "bosta" | "yukleniyor" | "kaydediliyor" | "basarili" | "hata";
const NONE = "__none__";

// Panel-içi alan tanımları. Alttaki şema (mind-agent ile ortak) AYNEN korunur;
// kaldırılan alanlar burada gösterilmez, birleştirilenler tek bir şema alanına yazılır.
type FieldKind =
  | "text"
  | "long"
  | "list"
  | "select" // tek seçim, string saklar
  | "langselect" // tr/en/tr+en -> dizi
  | "multiselect" // çoklu seçim -> dizi (etiketler)
  | "logo"; // dosya yükle -> url

interface FieldDef {
  path: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  hint?: string;
}

const HOOK_OPTIONS = [
  "Soru soran",
  "Şok eden istatistik / veri",
  "Hikaye / anekdot",
  "Merak boşluğu (cliffhanger)",
  "Doğrudan faydaya giren",
  "İddialı / tartışmalı",
  "Liste vaadi (örn. '5 yol')",
];

const CTA_OPTIONS = [
  "Yumuşak: keşfet / göz at",
  "Sert: hemen al / son fırsat",
  "Bilgilendirici: detaylı bilgi al",
  "Eğlenceli / esprili",
  "DM'den yaz",
  "Profildeki linke tıkla",
  "Yorumlara yaz",
  "Kaydet / paylaş",
  "Arkadaşını etiketle",
];

const GRID_OPTIONS = [
  "Dama Tahtası (Checkerboard)",
  "Yapboz (Puzzle Grid)",
  "Dikey Çizgi (Vertical Lines)",
  "Yatay Sıra (Row by Row)",
  "Renk / Filtre Temalı",
];

const SECTIONS: { title: string; description: string; fields: FieldDef[] }[] = [
  {
    title: "Temel Bilgiler",
    description: "Markanın kimlik bilgileri",
    fields: [
      { path: "basics.name", label: "Marka adı", kind: "text" },
      { path: "basics.tagline", label: "Slogan", kind: "text" },
      { path: "basics.industry", label: "Sektör", kind: "text" },
      {
        path: "basics.languages",
        label: "Diller",
        kind: "langselect",
        options: ["tr", "en", "tr+en"],
      },
      { path: "basics.keywords", label: "Anahtar kelimeler", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
  {
    title: "Görsel Kimlik",
    description: "Logo, renkler ve görsel stil",
    fields: [
      { path: "visual.logo_url", label: "Logo", kind: "logo", hint: "Bilgisayardan bir görsel seçin (PNG/JPG)" },
      { path: "visual.primary_colors", label: "Ana renkler (hex)", kind: "list", hint: "Örn: #FF0000 — her satıra bir tane" },
      { path: "visual.secondary_colors", label: "İkincil renkler (hex)", kind: "list", hint: "Her satıra bir tane" },
      { path: "visual.font_family", label: "Yazı tipi", kind: "text" },
      { path: "visual.visual_style", label: "Görsel stil", kind: "text" },
      { path: "visual.photography_style", label: "Fotoğraf stili", kind: "text" },
      { path: "visual.image_dos", label: "Görselde yapılacaklar", kind: "list", hint: "Her satıra bir tane" },
      { path: "visual.image_donts", label: "Görselde yapılmayacaklar", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
  {
    title: "Marka Sesi",
    description: "İletişim tarzı ve dil",
    fields: [
      { path: "voice.personality", label: "Kişilik", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.preferred_words", label: "Tercih edilen kelimeler", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.avoid_words", label: "Kaçınılacak kelimeler", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.avoid_topics", label: "Kaçınılacak konular", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.example_captions", label: "Örnek başlıklar", kind: "list", hint: "Her satıra bir tane" },
      {
        path: "voice.address_form",
        label: "Hitap",
        kind: "select",
        options: ["siz", "sen"],
      },
      {
        path: "voice.hook_style",
        label: "Hook (kanca) stili",
        kind: "select",
        options: HOOK_OPTIONS,
        hint: "İçeriğin ilk cümlesi/girişi hangi tarzda olsun",
      },
      {
        path: "voice.cta_templates",
        label: "CTA (harekete geçirme) tarzı",
        kind: "multiselect",
        options: CTA_OPTIONS,
        hint: "Takipçiyi ne yapmaya çağırıyoruz? Birden fazla seçebilirsiniz. (Örn. 'DM'den yaz' = mesaj at; 'Profildeki linke tıkla' = siteye yönlendir.)",
      },
    ],
  },
  {
    title: "Hedef Kitle",
    description: "Kime hitap ediyoruz",
    fields: [
      { path: "audience.primary.role", label: "Kitle tanımı", kind: "long" },
      { path: "audience.primary.age_range", label: "Yaş aralığı", kind: "text" },
      {
        path: "audience.primary.gender",
        label: "Cinsiyet",
        kind: "select",
        options: ["Kadın", "Erkek", "Tümü"],
      },
      {
        path: "audience.primary.ses",
        label: "Sosyoekonomik durum, sorun noktaları ve motivasyonlar",
        kind: "long",
        hint: "Hepsini tek alanda serbestçe yazın",
      },
    ],
  },
  {
    title: "İçerik Stratejisi",
    description: "Instagram düzeni ve hashtag",
    fields: [
      {
        path: "content_strategy.pillars",
        label: "İçerik / grid düzeni",
        kind: "multiselect",
        options: GRID_OPTIONS,
        hint: "Profil görünümü hangi düzen(ler)le kurgulanacak",
      },
      {
        path: "content_strategy.hashtag_strategy",
        label: "Hashtag stratejisi ve zorunlu hashtag'ler",
        kind: "long",
        hint: "Strateji + her zaman kullanılacak hashtag'leri tek alanda yazın",
      },
    ],
  },
  {
    title: "İş Bağlamı",
    description: "Ürünler, rakipler ve değer önerisi",
    fields: [
      { path: "business_context.products", label: "Ürünler / hizmetler", kind: "list", hint: "Her satıra bir tane" },
      {
        path: "business_context.price_segment",
        label: "Fiyat segmenti",
        kind: "select",
        options: ["ekonomik", "orta", "premium", "luks"],
      },
      { path: "business_context.usp", label: "Değer önerisi (USP)", kind: "long" },
      { path: "business_context.competitors", label: "Rakipler", kind: "list", hint: "Her satıra bir tane" },
      { path: "business_context.seo_keywords", label: "SEO anahtar kelimeleri", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
];

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

function langArrayToOption(v: unknown): string {
  if (!Array.isArray(v)) return "";
  const has = (x: string) => v.includes(x);
  if (has("tr") && has("en")) return "tr+en";
  if (has("tr")) return "tr";
  if (has("en")) return "en";
  return "";
}
function langOptionToArray(opt: string): string[] {
  if (opt === "tr+en") return ["tr", "en"];
  if (opt === "tr") return ["tr"];
  if (opt === "en") return ["en"];
  return [];
}

interface Props {
  initialBusinessId?: string;
  onBusinessChange?: (id: string) => void;
}

export function BrandIdentityEditor({ initialBusinessId, onBusinessChange }: Props) {
  const { businesses, loading: bizLoading } = useBusinesses();
  const [businessId, setBusinessId] = useState(initialBusinessId ?? "");
  const [identity, setIdentity] = useState<BrandIdentity | null>(null);
  const [durum, setDurum] = useState<Durum>("bosta");
  const [mesaj, setMesaj] = useState("");
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setDurum("yukleniyor");
    setMesaj("");
    try {
      const existing = await getBrandIdentity(id);
      setIdentity(existing ?? emptyBrandIdentity(id, "manual"));
      setDurum("bosta");
    } catch (e) {
      setIdentity(emptyBrandIdentity(id, "manual"));
      setDurum("hata");
      const detay = e instanceof Error ? e.message : typeof e === "string" ? e : "";
      setMesaj(
        `Mevcut marka kimliği okunamadı (boş formla devam edebilirsiniz). Detay: ${detay || "bilinmiyor"}`
      );
    }
  }, []);

  useEffect(() => {
    if (businessId) load(businessId);
  }, [businessId, load]);

  const handleSelect = (id: string) => {
    setBusinessId(id);
    onBusinessChange?.(id);
  };

  const update = (path: string, value: unknown) => {
    setIdentity((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as unknown as Record<string, unknown>;
      setPath(next, path, value);
      return next as unknown as BrandIdentity;
    });
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file || !businessId) return;
    setLogoYukleniyor(true);
    setMesaj("");
    try {
      const ext = file.name.split(".").pop() || "png";
      const url = await uploadFile(file, `businesses/${businessId}/brand_logo.${ext}`);
      update("visual.logo_url", url);
    } catch (e) {
      setDurum("hata");
      setMesaj(`Logo yüklenemedi. Detay: ${e instanceof Error ? e.message : "bilinmiyor"}`);
    } finally {
      setLogoYukleniyor(false);
    }
  };

  const handleSave = async () => {
    if (!identity || !businessId) return;
    setDurum("kaydediliyor");
    setMesaj("");
    try {
      await saveBrandIdentity(businessId, { ...identity, source: "manual" });
      setDurum("basarili");
      setMesaj("Marka kimliği kaydedildi.");
    } catch {
      setDurum("hata");
      setMesaj("Kaydetme başarısız oldu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Marka Kimliği</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Formdan gelen alanlar otomatik dolar. Boş alanları buradan
          tamamlayabilirsiniz. Ajanlar bu defteri kullanır.
        </p>
        <div className="mt-2">
          <BusinessSelector
            businesses={businesses}
            loading={bizLoading}
            selectedId={businessId}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {!businessId && (
        <p className="text-muted-foreground">Düzenlemek için bir işletme seçin.</p>
      )}

      {businessId && durum === "yukleniyor" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
        </div>
      )}

      {businessId && durum === "hata" && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="break-all">{mesaj}</span>
        </div>
      )}

      {businessId && identity && durum !== "yukleniyor" && (
        <>
          {SECTIONS.map((section) => (
            <FormSection
              key={section.title}
              title={section.title}
              description={section.description}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((f) => {
                  const raw = getPath(identity, f.path);
                  const id = `f-${f.path}`;
                  const wide =
                    f.kind === "long" ||
                    f.kind === "list" ||
                    f.kind === "multiselect" ||
                    f.kind === "logo";
                  return (
                    <div
                      key={f.path}
                      className={`space-y-1.5 ${wide ? "md:col-span-2" : ""}`}
                    >
                      <Label htmlFor={id}>{f.label}</Label>

                      {f.kind === "text" && (
                        <Input
                          id={id}
                          value={(raw as string) ?? ""}
                          onChange={(e) => update(f.path, e.target.value || null)}
                        />
                      )}

                      {f.kind === "long" && (
                        <Textarea
                          id={id}
                          rows={3}
                          value={(raw as string) ?? ""}
                          onChange={(e) => update(f.path, e.target.value || null)}
                        />
                      )}

                      {f.kind === "list" && (
                        <Textarea
                          id={id}
                          rows={3}
                          value={Array.isArray(raw) ? raw.join("\n") : ""}
                          onChange={(e) =>
                            update(
                              f.path,
                              e.target.value
                                .split("\n")
                                .map((x) => x.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                      )}

                      {f.kind === "select" && (
                        <Select
                          value={(raw as string) || NONE}
                          onValueChange={(v) =>
                            update(f.path, v === NONE ? null : v)
                          }
                        >
                          <SelectTrigger id={id}>
                            <SelectValue placeholder="Seçilmedi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Seçilmedi</SelectItem>
                            {f.options?.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {f.kind === "langselect" && (
                        <Select
                          value={langArrayToOption(raw) || NONE}
                          onValueChange={(v) =>
                            update(f.path, v === NONE ? [] : langOptionToArray(v))
                          }
                        >
                          <SelectTrigger id={id}>
                            <SelectValue placeholder="Seçilmedi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Seçilmedi</SelectItem>
                            {f.options?.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {f.kind === "multiselect" && (
                        <div className="flex flex-wrap gap-2">
                          {f.options?.map((o) => {
                            const arr = Array.isArray(raw) ? (raw as string[]) : [];
                            const on = arr.includes(o);
                            return (
                              <button
                                type="button"
                                key={o}
                                onClick={() =>
                                  update(
                                    f.path,
                                    on ? arr.filter((x) => x !== o) : [...arr, o]
                                  )
                                }
                                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                  on
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-foreground hover:bg-muted"
                                }`}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {f.kind === "logo" && (
                        <div className="flex items-center gap-4">
                          {typeof raw === "string" && raw ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={raw}
                              alt="logo"
                              className="h-16 w-16 rounded object-contain border border-border bg-muted"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                              yok
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                            {logoYukleniyor ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            Bilgisayardan seç
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={logoYukleniyor}
                              onChange={(e) => handleLogo(e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      )}

                      {f.hint && (
                        <p className="text-xs text-muted-foreground">{f.hint}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </FormSection>
          ))}

          <div className="flex items-center gap-3 sticky bottom-4">
            <Button onClick={handleSave} disabled={durum === "kaydediliyor"} size="lg">
              {durum === "kaydediliyor" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Kaydet
            </Button>
            {durum === "basarili" && (
              <span className="flex items-center gap-1.5 text-sm text-green-500">
                <CheckCircle2 className="w-4 h-4" /> {mesaj}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
