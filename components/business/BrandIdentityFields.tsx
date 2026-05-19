"use client";

import { Loader2, Upload } from "lucide-react";
import { FormSection } from "@/components/shared/FormSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BrandIdentity } from "@/lib/brandIdentity";

const NONE = "__none__";

type FieldKind =
  | "text"
  | "long"
  | "list"
  | "select"
  | "langselect"
  | "multiselect"
  | "multiselect_str"
  | "colorpalette"
  | "logo";

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

const TONE_OPTIONS = [
  "Samimi / sıcak",
  "Resmi / profesyonel",
  "Eğlenceli / esprili",
  "İddialı / cesur",
  "İlham verici",
  "Bilgilendirici / öğretici",
  "Lüks / prestijli",
  "Sade / minimal",
];

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Poppins",
  "Lato",
  "Nunito",
  "Playfair Display",
  "Raleway",
  "Oswald",
];

const GRID_OPTIONS = [
  "Dama Tahtası (Checkerboard)",
  "Yapboz (Puzzle Grid)",
  "Dikey Çizgi (Vertical Lines)",
  "Yatay Sıra (Row by Row)",
  "Renk / Filtre Temalı",
];

export const BRAND_IDENTITY_SECTIONS: {
  title: string;
  description: string;
  fields: FieldDef[];
}[] = [
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
      {
        path: "basics.keywords",
        label: "Anahtar kelimeler",
        kind: "list",
        hint: "Her satıra bir tane",
      },
    ],
  },
  {
    title: "Görsel Kimlik",
    description: "Logo, renkler ve görsel stil",
    fields: [
      {
        path: "visual.logo_url",
        label: "Logo",
        kind: "logo",
        hint: "Bilgisayardan bir görsel seçin (PNG/JPG)",
      },
      {
        path: "visual.primary_colors",
        label: "Renk paleti",
        kind: "colorpalette",
        hint: "Renk ekleyin; paletteki renkler önizlenir",
      },
      {
        path: "visual.font_family",
        label: "Yazı tipi",
        kind: "multiselect_str",
        options: FONT_OPTIONS,
        hint: "Başlıca 10 fonttan seçin (birden fazla seçilebilir)",
      },
      { path: "visual.visual_style", label: "Görsel stil", kind: "text" },
      { path: "visual.photography_style", label: "Fotoğraf stili", kind: "text" },
      {
        path: "visual.image_dos",
        label: "Görselde yapılacaklar",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "visual.image_donts",
        label: "Görselde yapılmayacaklar",
        kind: "list",
        hint: "Her satıra bir tane",
      },
    ],
  },
  {
    title: "Marka Sesi",
    description: "İletişim tarzı ve dil",
    fields: [
      {
        path: "voice.tone",
        label: "Ton",
        kind: "select",
        options: TONE_OPTIONS,
        hint: "Markanın genel konuşma tonu (AI içerik üretirken bunu kullanır)",
      },
      {
        path: "voice.personality",
        label: "Kişilik",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "voice.preferred_words",
        label: "Tercih edilen kelimeler",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "voice.avoid_words",
        label: "Kaçınılacak kelimeler",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "voice.avoid_topics",
        label: "Kaçınılacak konular",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "voice.example_captions",
        label: "Örnek başlıklar",
        kind: "list",
        hint: "Her satıra bir tane",
      },
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
        path: "content_strategy.required_hashtags",
        label: "Hashtag stratejisi ve zorunlu hashtag'ler",
        kind: "list",
        hint: "Her satıra bir madde: strateji notu veya #etiket (AI bunları kullanır)",
      },
    ],
  },
  {
    title: "İş Bağlamı",
    description: "Ürünler, rakipler ve değer önerisi",
    fields: [
      {
        path: "business_context.products",
        label: "Ürünler / hizmetler",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "business_context.price_segment",
        label: "Fiyat segmenti",
        kind: "select",
        options: ["ekonomik", "orta", "premium", "luks"],
      },
      { path: "business_context.usp", label: "Değer önerisi (USP)", kind: "long" },
      {
        path: "business_context.competitors",
        label: "Rakipler",
        kind: "list",
        hint: "Her satıra bir tane",
      },
      {
        path: "business_context.seo_keywords",
        label: "SEO anahtar kelimeleri",
        kind: "list",
        hint: "Her satıra bir tane",
      },
    ],
  },
];

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export function setBrandPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
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
  identity: BrandIdentity;
  onChange: (path: string, value: unknown) => void;
  onLogoSelect: (file: File | undefined) => void;
  logoUploading?: boolean;
  disabled?: boolean;
}

export function BrandIdentityFields({
  identity,
  onChange,
  onLogoSelect,
  logoUploading,
  disabled,
}: Props) {
  return (
    <>
      {BRAND_IDENTITY_SECTIONS.map((section) => (
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
                f.kind === "multiselect_str" ||
                f.kind === "colorpalette" ||
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
                      disabled={disabled}
                      value={(raw as string) ?? ""}
                      onChange={(e) => onChange(f.path, e.target.value || null)}
                    />
                  )}

                  {f.kind === "long" && (
                    <Textarea
                      id={id}
                      rows={3}
                      disabled={disabled}
                      value={(raw as string) ?? ""}
                      onChange={(e) => onChange(f.path, e.target.value || null)}
                    />
                  )}

                  {f.kind === "list" && (
                    <Textarea
                      id={id}
                      rows={3}
                      disabled={disabled}
                      value={Array.isArray(raw) ? raw.join("\n") : ""}
                      onChange={(e) =>
                        onChange(
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
                      disabled={disabled}
                      value={(raw as string) || NONE}
                      onValueChange={(v) =>
                        onChange(f.path, v === NONE ? null : v)
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
                      disabled={disabled}
                      value={langArrayToOption(raw) || NONE}
                      onValueChange={(v) =>
                        onChange(f.path, v === NONE ? [] : langOptionToArray(v))
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
                            disabled={disabled}
                            onClick={() =>
                              onChange(
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

                  {f.kind === "multiselect_str" && (
                    <div className="flex flex-wrap gap-2">
                      {f.options?.map((o) => {
                        const cur =
                          typeof raw === "string" && raw
                            ? raw
                                .split(",")
                                .map((x) => x.trim())
                                .filter(Boolean)
                            : [];
                        const on = cur.includes(o);
                        return (
                          <button
                            type="button"
                            key={o}
                            disabled={disabled}
                            style={{ fontFamily: o }}
                            onClick={() => {
                              const next = on
                                ? cur.filter((x) => x !== o)
                                : [...cur, o];
                              onChange(
                                f.path,
                                next.length ? next.join(", ") : null
                              );
                            }}
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

                  {f.kind === "colorpalette" && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(raw) ? (raw as string[]) : []).map(
                          (c, idx) => (
                            <span
                              key={`${c}-${idx}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border pl-1 pr-2 py-1 text-xs"
                            >
                              <span
                                className="h-5 w-5 rounded"
                                style={{ backgroundColor: c }}
                              />
                              {c}
                              <button
                                type="button"
                                aria-label="kaldır"
                                disabled={disabled}
                                className="text-muted-foreground hover:text-red-500"
                                onClick={() => {
                                  const arr = Array.isArray(raw)
                                    ? (raw as string[])
                                    : [];
                                  onChange(
                                    f.path,
                                    arr.filter((_, i) => i !== idx)
                                  );
                                }}
                              >
                                ×
                              </button>
                            </span>
                          )
                        )}
                        {(!Array.isArray(raw) || raw.length === 0) && (
                          <span className="text-xs text-muted-foreground">
                            Henüz renk yok
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          disabled={disabled}
                          className="h-9 w-12 rounded border border-border bg-transparent p-0.5"
                          onChange={(e) => {
                            const arr = Array.isArray(raw)
                              ? (raw as string[])
                              : [];
                            const hex = e.target.value.toUpperCase();
                            if (!arr.includes(hex)) onChange(f.path, [...arr, hex]);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          Renk seç → palete eklenir
                        </span>
                      </div>
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
                        {logoUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Bilgisayardan seç
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={disabled || logoUploading}
                          onChange={(e) => onLogoSelect(e.target.files?.[0])}
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
    </>
  );
}
