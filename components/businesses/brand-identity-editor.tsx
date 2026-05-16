"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, CheckCircle2, AlertCircle, Fingerprint } from "lucide-react";
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
import {
  emptyBrandIdentity,
  type BrandIdentity,
} from "@/lib/brandIdentity";

type Durum = "bosta" | "yukleniyor" | "kaydediliyor" | "basarili" | "hata";

const NONE = "__none__";

// Bölüm/alan tanımları — şema ile birebir aynı anahtarlar.
type FieldKind = "text" | "long" | "list" | "number" | "select";
interface FieldDef {
  path: string; // "basics.name" | "audience.primary.role"
  label: string;
  kind: FieldKind;
  options?: string[]; // select için
  hint?: string;
}

const SECTIONS: { title: string; description: string; fields: FieldDef[] }[] = [
  {
    title: "Temel Bilgiler",
    description: "Markanın kimlik bilgileri",
    fields: [
      { path: "basics.name", label: "Marka adı", kind: "text" },
      { path: "basics.tagline", label: "Slogan", kind: "text" },
      { path: "basics.industry", label: "Sektör", kind: "text" },
      { path: "basics.founded_year", label: "Kuruluş yılı", kind: "number" },
      { path: "basics.languages", label: "Diller", kind: "list", hint: "Her satıra bir tane (örn: tr, en)" },
      { path: "basics.keywords", label: "Anahtar kelimeler", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
  {
    title: "Görsel Kimlik",
    description: "Renkler, logo ve görsel stil",
    fields: [
      { path: "visual.primary_colors", label: "Ana renkler (hex)", kind: "list", hint: "Örn: #FF0000 — her satıra bir tane" },
      { path: "visual.secondary_colors", label: "İkincil renkler (hex)", kind: "list", hint: "Her satıra bir tane" },
      { path: "visual.logo_url", label: "Logo URL", kind: "text" },
      { path: "visual.font_family", label: "Yazı tipi", kind: "text" },
      { path: "visual.visual_style", label: "Görsel stil", kind: "text" },
      { path: "visual.photography_style", label: "Fotoğraf stili", kind: "text" },
      { path: "visual.image_dos", label: "Görselde yapılacaklar", kind: "list", hint: "Her satıra bir tane" },
      { path: "visual.image_donts", label: "Görselde yapılmayacaklar", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
  {
    title: "Marka Sesi",
    description: "Ton, dil ve iletişim tarzı",
    fields: [
      { path: "voice.tone", label: "Ton", kind: "text" },
      { path: "voice.personality", label: "Kişilik", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.preferred_words", label: "Tercih edilen kelimeler", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.avoid_words", label: "Kaçınılacak kelimeler", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.avoid_topics", label: "Kaçınılacak konular", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.example_captions", label: "Örnek başlıklar", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.cta_style", label: "CTA stili", kind: "select", options: ["soft", "hard", "quirky", "informative"] },
      { path: "voice.address_form", label: "Hitap", kind: "select", options: ["siz", "sen"] },
      { path: "voice.emoji_usage", label: "Emoji kullanımı", kind: "select", options: ["bol", "az", "yok", "secili"] },
      { path: "voice.hook_style", label: "Hook (kanca) stili", kind: "text" },
      { path: "voice.cta_templates", label: "CTA şablonları", kind: "list", hint: "Her satıra bir tane" },
      { path: "voice.agent_role", label: "Ajan rolü", kind: "long" },
    ],
  },
  {
    title: "Hedef Kitle",
    description: "Birincil kitle ve coğrafya",
    fields: [
      { path: "audience.primary.role", label: "Kitle tanımı", kind: "long" },
      { path: "audience.primary.age_range", label: "Yaş aralığı", kind: "text" },
      { path: "audience.primary.gender", label: "Cinsiyet", kind: "text" },
      { path: "audience.primary.ses", label: "Sosyoekonomik seviye", kind: "text" },
      { path: "audience.primary.pain_points", label: "Sorun noktaları", kind: "list", hint: "Her satıra bir tane" },
      { path: "audience.primary.motivations", label: "Motivasyonlar / ilgi alanları", kind: "list", hint: "Her satıra bir tane" },
      { path: "audience.geo", label: "Coğrafya", kind: "list", hint: "Her satıra bir tane" },
      { path: "audience.languages", label: "Diller", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
  {
    title: "İçerik Stratejisi",
    description: "İçerik sütunları ve paylaşım planı",
    fields: [
      { path: "content_strategy.pillars", label: "İçerik sütunları", kind: "list", hint: "Her satıra bir tane" },
      { path: "content_strategy.posting_cadence", label: "Paylaşım sıklığı", kind: "text" },
      { path: "content_strategy.hashtag_strategy", label: "Hashtag stratejisi", kind: "long" },
      { path: "content_strategy.required_hashtags", label: "Zorunlu hashtag'ler", kind: "list", hint: "Her satıra bir tane" },
    ],
  },
  {
    title: "İş Bağlamı",
    description: "Ürünler, rakipler ve değer önerisi",
    fields: [
      { path: "business_context.products", label: "Ürünler / hizmetler", kind: "list", hint: "Her satıra bir tane" },
      { path: "business_context.price_segment", label: "Fiyat segmenti", kind: "select", options: ["ekonomik", "orta", "premium", "luks"] },
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

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setDurum("yukleniyor");
    setMesaj("");
    try {
      const existing = await getBrandIdentity(id);
      setIdentity(existing ?? emptyBrandIdentity(id, "manual"));
      setDurum("bosta");
    } catch {
      setDurum("hata");
      setMesaj("Marka kimliği yüklenemedi.");
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
                  return (
                    <div
                      key={f.path}
                      className={`space-y-1.5 ${f.kind === "long" || f.kind === "list" ? "md:col-span-2" : ""}`}
                    >
                      <Label htmlFor={id}>{f.label}</Label>
                      {f.kind === "text" && (
                        <Input
                          id={id}
                          value={(raw as string) ?? ""}
                          onChange={(e) =>
                            update(f.path, e.target.value || null)
                          }
                        />
                      )}
                      {f.kind === "number" && (
                        <Input
                          id={id}
                          type="number"
                          value={raw == null ? "" : String(raw)}
                          onChange={(e) =>
                            update(
                              f.path,
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      )}
                      {f.kind === "long" && (
                        <Textarea
                          id={id}
                          rows={3}
                          value={(raw as string) ?? ""}
                          onChange={(e) =>
                            update(f.path, e.target.value || null)
                          }
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
                          value={(raw as string) ?? NONE}
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
            <Button
              onClick={handleSave}
              disabled={durum === "kaydediliyor"}
              size="lg"
            >
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
            {durum === "hata" && (
              <span className="flex items-center gap-1.5 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" /> {mesaj}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
