// Marka Kimliği (Brand Identity) — mind-agent `src/infra/brand_identity.py`
// şemasının birebir TypeScript karşılığı. Firestore yolu:
// businesses/{businessId}/brand_identity/v1
//
// Pydantic tarafı `extra="forbid"` olduğu için alan adları AYNEN burada
// olmalı; fazladan anahtar EKLENMEMELİ. Bilinmeyen scalar = null,
// bilinmeyen liste = [].

import type { BusinessProfile } from "@/types/firebase";

export const BRAND_IDENTITY_SCHEMA_VERSION = 1;

export type CtaStyle = "soft" | "hard" | "quirky" | "informative";
export type AddressForm = "siz" | "sen";
export type EmojiUsage = "bol" | "az" | "yok" | "secili";
export type PriceSegment = "ekonomik" | "orta" | "premium" | "luks";
export type BrandIdentitySource =
  | "manual"
  | "ai_synthesis"
  | "imported"
  | "draft";

export interface BrandBasics {
  name: string | null;
  tagline: string | null;
  industry: string | null;
  founded_year: number | null;
  languages: string[];
  keywords: string[];
}

export interface BrandVisual {
  primary_colors: string[];
  secondary_colors: string[];
  logo_url: string | null;
  font_family: string | null;
  visual_style: string | null;
  photography_style: string | null;
  image_dos: string[];
  image_donts: string[];
}

export interface BrandVoice {
  tone: string | null;
  personality: string[];
  avoid_words: string[];
  preferred_words: string[];
  example_captions: string[];
  cta_style: CtaStyle | null;
  agent_role: string | null;
  address_form: AddressForm | null;
  emoji_usage: EmojiUsage | null;
  hook_style: string | null;
  cta_templates: string[];
  avoid_topics: string[];
}

export interface BrandAudiencePrimary {
  role: string | null;
  age_range: string | null;
  gender: string | null;
  ses: string | null;
  pain_points: string[];
  motivations: string[];
}

export interface BrandAudience {
  primary: BrandAudiencePrimary;
  geo: string[];
  languages: string[];
}

export interface BrandContentStrategy {
  pillars: string[];
  posting_cadence: string | null;
  hashtag_strategy: string | null;
  required_hashtags: string[];
}

export interface BrandBusinessContext {
  products: string[];
  price_segment: PriceSegment | null;
  usp: string | null;
  competitors: string[];
  seo_keywords: string[];
}

export interface BrandIdentity {
  schema_version: number;
  business_id: string;
  updated_at: string; // ISO 8601
  source: BrandIdentitySource;
  basics: BrandBasics;
  visual: BrandVisual;
  voice: BrandVoice;
  audience: BrandAudience;
  content_strategy: BrandContentStrategy;
  business_context: BrandBusinessContext;
}

const HEX_RE = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3}([0-9A-Fa-f]{2})?)?$/;

function hexOnly(colors: unknown): string[] {
  if (!Array.isArray(colors)) return [];
  return colors
    .filter((c): c is string => typeof c === "string" && HEX_RE.test(c))
    .map((c) => c.toUpperCase());
}

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Boş (formdan dolmayan) alanlar için kanonik boş kimlik. */
export function emptyBrandIdentity(
  businessId: string,
  source: BrandIdentitySource = "manual"
): BrandIdentity {
  return {
    schema_version: BRAND_IDENTITY_SCHEMA_VERSION,
    business_id: businessId,
    updated_at: new Date().toISOString(),
    source,
    basics: {
      name: null,
      tagline: null,
      industry: null,
      founded_year: null,
      languages: [],
      keywords: [],
    },
    visual: {
      primary_colors: [],
      secondary_colors: [],
      logo_url: null,
      font_family: null,
      visual_style: null,
      photography_style: null,
      image_dos: [],
      image_donts: [],
    },
    voice: {
      tone: null,
      personality: [],
      avoid_words: [],
      preferred_words: [],
      example_captions: [],
      cta_style: null,
      agent_role: null,
      address_form: null,
      emoji_usage: null,
      hook_style: null,
      cta_templates: [],
      avoid_topics: [],
    },
    audience: {
      primary: {
        role: null,
        age_range: null,
        gender: null,
        ses: null,
        pain_points: [],
        motivations: [],
      },
      geo: [],
      languages: [],
    },
    content_strategy: {
      pillars: [],
      posting_cadence: null,
      hashtag_strategy: null,
      required_hashtags: [],
    },
    business_context: {
      products: [],
      price_segment: null,
      usp: null,
      competitors: [],
      seo_keywords: [],
    },
  };
}

/**
 * Form/işletme verisinden marka kimliğini eşler (~24 alan otomatik dolar;
 * kalan alanlar boş kalır — panel editöründen elle doldurulur).
 */
export function buildBrandIdentityFromBusiness(params: {
  businessId: string;
  name?: string;
  logo?: string;
  colors?: unknown;
  profile?: BusinessProfile | Record<string, unknown>;
  source?: BrandIdentitySource;
}): BrandIdentity {
  const { businessId, name, logo, colors } = params;
  const p = (params.profile ?? {}) as BusinessProfile;
  const bi = emptyBrandIdentity(businessId, params.source ?? "manual");

  const lang = s(p.language);
  const langs = lang ? [lang.toLowerCase()] : [];

  bi.basics.name = s(name);
  bi.basics.tagline = s(p.slogan);
  bi.basics.industry = s(p.industry);
  bi.basics.languages = langs;

  bi.visual.primary_colors = hexOnly(colors);
  bi.visual.logo_url = s(logo);
  bi.visual.font_family = s(p.custom_font) ?? s(p.font);
  bi.visual.visual_style = s(p.aesthetic) ?? s(p.visual_mood);
  bi.visual.photography_style = s(p.photography_style);

  bi.voice.tone = s(p.tone);
  bi.voice.avoid_topics = arr(p.avoid_topics);
  const emoji = s(p.emoji_usage);
  if (emoji === "bol" || emoji === "az" || emoji === "yok" || emoji === "secili") {
    bi.voice.emoji_usage = emoji;
  }

  bi.audience.primary.role = s(p.target_description);
  bi.audience.primary.age_range = s(p.target_age_range);
  bi.audience.primary.gender = s(p.target_gender);
  bi.audience.primary.motivations = arr(p.target_interests);
  const city = s(p.location_city);
  bi.audience.geo = city ? [city] : [];
  bi.audience.languages = langs;

  bi.content_strategy.pillars = arr(p.content_pillars);
  bi.content_strategy.posting_cadence = s(p.promo_frequency);
  bi.content_strategy.required_hashtags = arr(p.hashtags_brand);

  const uniquePoints = arr(p.unique_points);
  bi.business_context.usp =
    uniquePoints.length > 0 ? uniquePoints.join("; ") : s(p.brand_story_short);

  return bi;
}
