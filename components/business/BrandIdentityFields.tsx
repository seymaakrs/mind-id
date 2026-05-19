"use client";

import { useState } from "react";
import {
  Loader2,
  Upload,
  Info,
  ChevronDown,
  Building2,
  Palette,
  MessageSquare,
  Users,
  LayoutGrid,
  Briefcase,
  ImageOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
  placeholder?: string;
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

type SectionMeta = {
  title: string;
  description: string;
  icon: typeof Building2;
  fields: FieldDef[];
};

export const BRAND_IDENTITY_SECTIONS: SectionMeta[] = [
  {
    title: "Temel Bilgiler",
    description: "Markanın adı, sloganı ve sektörü",
    icon: Building2,
    fields: [
      {
        path: "basics.name",
        label: "Marka adı",
        kind: "text",
        placeholder: "Örn: Acme Teknoloji",
      },
      {
        path: "basics.tagline",
        label: "Slogan",
        kind: "text",
        placeholder: "Örn: Geleceği bugün inşa ediyoruz",
      },
      {
        path: "basics.industry",
        label: "Sektör",
        kind: "text",
        placeholder: "Örn: Yazılım / SaaS",
      },
      {
        path: "basics.languages",
        label: "İçerik dili",
        kind: "langselect",
        options: ["tr", "en", "tr+en"],
      },
      {
        path: "basics.keywords",
        label: "Anahtar kelimeler",
        kind: "list",
        hint: "İşletmeyi tanımlayan kelimeler — her satıra bir tane",
        placeholder: "yapay zeka\nbulut\nverimlilik",
      },
    ],
  },
  {
    title: "Görsel Kimlik",
    description: "Logo, renk paleti ve görsel stil",
    icon: Palette,
    fields: [
      {
        path: "visual.logo_url",
        label: "Logo",
        kind: "logo",
        hint: "PNG veya JPG — şeffaf arka plan tercih edilir",
      },
      {
        path: "visual.primary_colors",
        label: "Renk paleti",
        kind: "colorpalette",
        hint: "Markanın ana renkleri. Renk seçiciden ekleyin.",
      },
      {
        path: "visual.font_family",
        label: "Yazı tipi",
        kind: "multiselect_str",
        options: FONT_OPTIONS,
        hint: "Birden fazla seçilebilir; örnek font önizlemeyle gösterilir",
      },
      {
        path: "visual.visual_style",
        label: "Görsel stil",
        kind: "text",
        placeholder: "Örn: Minimal, bol beyaz alan, modern",
      },
      {
        path: "visual.photography_style",
        label: "Fotoğraf stili",
        kind: "text",
        placeholder: "Örn: Doğal ışık, sıcak tonlar, gerçek insanlar",
      },
      {
        path: "visual.image_dos",
        label: "Görselde yapılacaklar",
        kind: "list",
        hint: "Her satıra bir kural",
        placeholder: "Marka renklerini kullan\nNet ve sade kompozisyon",
      },
      {
        path: "visual.image_donts",
        label: "Görselde yapılmayacaklar",
        kind: "list",
        hint: "Her satıra bir kural",
        placeholder: "Stok fotoğraf klişeleri\nKalabalık tasarım",
      },
    ],
  },
  {
    title: "Marka Sesi",
    description: "Konuşma tonu, hook ve harekete geçirme tarzı",
    icon: MessageSquare,
    fields: [
      {
        path: "voice.tone",
        label: "Ton",
        kind: "select",
        options: TONE_OPTIONS,
        hint: "AI içerik üretirken bu tonu kullanır",
      },
      {
        path: "voice.personality",
        label: "Marka kişiliği",
        kind: "list",
        hint: "Sıfatlarla tanımlayın — her satıra bir tane",
        placeholder: "Cesur\nYenilikçi\nGüven veren",
      },
      {
        path: "voice.preferred_words",
        label: "Tercih edilen kelimeler",
        kind: "list",
        hint: "Sık kullanılmasını istediğin kelimeler",
        placeholder: "çözüm\nbirlikte\nkolay",
      },
      {
        path: "voice.avoid_words",
        label: "Kaçınılacak kelimeler",
        kind: "list",
        hint: "Asla kullanılmamasını istediğin kelimeler",
        placeholder: "ucuz\nsıradan",
      },
      {
        path: "voice.avoid_topics",
        label: "Kaçınılacak konular",
        kind: "list",
        hint: "İçerikte değinilmemesi gereken konular",
        placeholder: "Siyaset\nRakip karşılaştırması",
      },
      {
        path: "voice.example_captions",
        label: "Örnek başlıklar",
        kind: "list",
        hint: "Beğendiğin gönderi metni örnekleri — AI tarzı buradan öğrenir",
        placeholder: "Bugün küçük bir adım, yarın büyük bir fark. 🚀",
      },
      {
        path: "voice.address_form",
        label: "Hitap",
        kind: "select",
        options: ["siz", "sen"],
        hint: "Takipçiye nasıl hitap edilsin",
      },
      {
        path: "voice.hook_style",
        label: "Hook (giriş kancası) stili",
        kind: "select",
        options: HOOK_OPTIONS,
        hint: "İçeriğin ilk cümlesi hangi tarzda olsun",
      },
      {
        path: "voice.cta_templates",
        label: "CTA (harekete geçirme) tarzı",
        kind: "multiselect",
        options: CTA_OPTIONS,
        hint: "Takipçiyi ne yapmaya çağırıyoruz? Birden fazla seçilebilir.",
      },
    ],
  },
  {
    title: "Hedef Kitle",
    description: "Kime hitap ediyoruz",
    icon: Users,
    fields: [
      {
        path: "audience.primary.role",
        label: "Kitle tanımı",
        kind: "long",
        placeholder:
          "Örn: 25-40 yaş, büyüyen KOBİ sahipleri; zamanını verimli kullanmak isteyen profesyoneller",
      },
      {
        path: "audience.primary.age_range",
        label: "Yaş aralığı",
        kind: "text",
        placeholder: "Örn: 25-40",
      },
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
        hint: "Tek alanda serbestçe yazın",
        placeholder:
          "Orta-üst gelir; zaman kıtlığı yaşıyor; büyümek ama kontrolü kaybetmemek istiyor",
      },
    ],
  },
  {
    title: "İçerik Stratejisi",
    description: "Profil düzeni ve hashtag yaklaşımı",
    icon: LayoutGrid,
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
        label: "Hashtag stratejisi ve zorunlu etiketler",
        kind: "list",
        hint: "Her satıra bir strateji notu veya #etiket",
        placeholder: "#markaadi\n#sektor\nKonum etiketi her gönderide",
      },
    ],
  },
  {
    title: "İş Bağlamı",
    description: "Ürünler, değer önerisi ve rakipler",
    icon: Briefcase,
    fields: [
      {
        path: "business_context.products",
        label: "Ürünler / hizmetler",
        kind: "list",
        hint: "Her satıra bir tane",
        placeholder: "Bulut yedekleme\nEkip yönetim paneli",
      },
      {
        path: "business_context.price_segment",
        label: "Fiyat segmenti",
        kind: "select",
        options: ["ekonomik", "orta", "premium", "luks"],
      },
      {
        path: "business_context.usp",
        label: "Değer önerisi (USP)",
        kind: "long",
        hint: "Sizi rakiplerden ayıran tek cümle",
        placeholder: "Kurulumu 5 dakika; teknik bilgi gerektirmez",
      },
      {
        path: "business_context.competitors",
        label: "Rakipler",
        kind: "list",
        hint: "Her satıra bir tane",
        placeholder: "RakipA\nRakipB",
      },
      {
        path: "business_context.seo_keywords",
        label: "SEO anahtar kelimeleri",
        kind: "list",
        hint: "Her satıra bir tane",
        placeholder: "online yedekleme\nkobi yazılımı",
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

function fieldFilled(raw: unknown): boolean {
  if (Array.isArray(raw)) return raw.length > 0;
  return typeof raw === "string" ? raw.trim().length > 0 : raw != null;
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
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {BRAND_IDENTITY_SECTIONS.map((section, sIdx) => {
        const Icon = section.icon;
        const open = openIndex === sIdx;
        const filledCount = section.fields.filter((f) =>
          fieldFilled(getPath(identity, f.path))
        ).length;

        return (
          <Card key={section.title} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : sIdx)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{section.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {filledCount}/{section.fields.length}
                  </span>
                </span>
                <span className="block text-sm text-muted-foreground truncate">
                  {section.description}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="border-t p-5 grid gap-5 md:grid-cols-2">
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
                      className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}
                    >
                      <Label htmlFor={id} className="text-sm font-medium">
                        {f.label}
                      </Label>

                      {f.kind === "text" && (
                        <Input
                          id={id}
                          disabled={disabled}
                          placeholder={f.placeholder}
                          value={(raw as string) ?? ""}
                          onChange={(e) =>
                            onChange(f.path, e.target.value || null)
                          }
                        />
                      )}

                      {f.kind === "long" && (
                        <Textarea
                          id={id}
                          rows={3}
                          disabled={disabled}
                          placeholder={f.placeholder}
                          value={(raw as string) ?? ""}
                          onChange={(e) =>
                            onChange(f.path, e.target.value || null)
                          }
                        />
                      )}

                      {f.kind === "list" && (
                        <Textarea
                          id={id}
                          rows={3}
                          disabled={disabled}
                          placeholder={f.placeholder}
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
                            onChange(
                              f.path,
                              v === NONE ? [] : langOptionToArray(v)
                            )
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
                            const arr = Array.isArray(raw)
                              ? (raw as string[])
                              : [];
                            const on = arr.includes(o);
                            return (
                              <button
                                type="button"
                                key={o}
                                disabled={disabled}
                                onClick={() =>
                                  onChange(
                                    f.path,
                                    on
                                      ? arr.filter((x) => x !== o)
                                      : [...arr, o]
                                  )
                                }
                                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                                  on
                                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                                    : "border-border text-foreground hover:bg-muted hover:border-primary/40"
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
                                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                                  on
                                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                                    : "border-border text-foreground hover:bg-muted hover:border-primary/40"
                                }`}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {f.kind === "colorpalette" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(raw) ? (raw as string[]) : []).map(
                              (c, idx) => (
                                <span
                                  key={`${c}-${idx}`}
                                  className="inline-flex items-center gap-2 rounded-lg border border-border pl-1.5 pr-2 py-1.5 text-xs"
                                >
                                  <span
                                    className="h-6 w-6 rounded-md border border-border/60"
                                    style={{ backgroundColor: c }}
                                  />
                                  <span className="font-mono">{c}</span>
                                  <button
                                    type="button"
                                    aria-label="rengi kaldır"
                                    disabled={disabled}
                                    className="text-muted-foreground hover:text-destructive text-base leading-none"
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
                                Henüz renk eklenmedi
                              </span>
                            )}
                          </div>
                          <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border px-3 py-2 text-sm hover:bg-muted w-fit">
                            <span
                              className="h-4 w-4 rounded"
                              style={{
                                background:
                                  "conic-gradient(red,orange,yellow,green,blue,violet,red)",
                              }}
                            />
                            Renk ekle
                            <input
                              type="color"
                              disabled={disabled}
                              className="sr-only"
                              onChange={(e) => {
                                const arr = Array.isArray(raw)
                                  ? (raw as string[])
                                  : [];
                                const hex = e.target.value.toUpperCase();
                                if (!arr.includes(hex))
                                  onChange(f.path, [...arr, hex]);
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {f.kind === "logo" && (
                        <div className="flex items-center gap-4">
                          {typeof raw === "string" && raw ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={raw}
                              alt="logo"
                              className="h-20 w-20 rounded-lg object-contain border border-border bg-muted"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-1">
                              <ImageOff className="w-5 h-5" />
                              <span className="text-[10px]">logo yok</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border px-4 py-2.5 text-sm hover:bg-muted">
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
                              onChange={(e) =>
                                onLogoSelect(e.target.files?.[0])
                              }
                            />
                          </label>
                        </div>
                      )}

                      {f.hint && (
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          {f.hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
