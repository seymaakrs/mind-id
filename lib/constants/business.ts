// Business profile form select options

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

// Market Position
export const MARKET_POSITION_OPTIONS: readonly SelectOption[] = [
  { value: "budget", label: "Budget" },
  { value: "mid-range", label: "Mid-range" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
];

// Brand Voice - Tone
export const TONE_OPTIONS: readonly SelectOption[] = [
  { value: "friendly", label: "Samimi" },
  { value: "professional", label: "Profesyonel" },
  { value: "playful", label: "Eğlenceli" },
  { value: "inspirational", label: "İlham Verici" },
  { value: "authoritative", label: "Otoriter" },
];

// Brand Voice - Language
export const LANGUAGE_OPTIONS: readonly SelectOption[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
  { value: "tr-en", label: "Türkçe + English" },
];

// Brand Voice - Formality
export const FORMALITY_OPTIONS: readonly SelectOption[] = [
  { value: "formal", label: "Resmi" },
  { value: "semi-formal", label: "Yarı Resmi" },
  { value: "informal", label: "Samimi" },
  { value: "casual", label: "Günlük" },
];

// Brand Voice - Emoji Usage
export const EMOJI_USAGE_OPTIONS: readonly SelectOption[] = [
  { value: "none", label: "Yok" },
  { value: "minimal", label: "Minimal" },
  { value: "moderate", label: "Orta" },
  { value: "heavy", label: "Yoğun" },
];

// Brand Voice - Caption Style
export const CAPTION_STYLE_OPTIONS: readonly SelectOption[] = [
  { value: "storytelling", label: "Hikaye Anlatımı" },
  { value: "informative", label: "Bilgilendirici" },
  { value: "question", label: "Soru Soran" },
  { value: "call-to-action", label: "Aksiyon Çağrısı" },
  { value: "minimal", label: "Minimal" },
];

// Visual - Aesthetic
export const AESTHETIC_OPTIONS: readonly SelectOption[] = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "vintage", label: "Vintage" },
  { value: "rustic", label: "Rustik" },
  { value: "luxurious", label: "Lüks" },
  { value: "playful", label: "Eğlenceli" },
];

// Visual - Photography Style
export const PHOTOGRAPHY_STYLE_OPTIONS: readonly SelectOption[] = [
  { value: "bright", label: "Aydınlık" },
  { value: "dark", label: "Karanlık" },
  { value: "natural", label: "Doğal" },
  { value: "studio", label: "Stüdyo" },
  { value: "lifestyle", label: "Yaşam Tarzı" },
];

// Visual - Color Mood
export const COLOR_MOOD_OPTIONS: readonly SelectOption[] = [
  { value: "warm", label: "Sıcak" },
  { value: "cool", label: "Soğuk" },
  { value: "neutral", label: "Nötr" },
  { value: "vibrant", label: "Canlı" },
  { value: "muted", label: "Pastel" },
];

// Visual - Visual Mood
export const VISUAL_MOOD_OPTIONS: readonly SelectOption[] = [
  { value: "cozy", label: "Sıcak/Samimi" },
  { value: "energetic", label: "Enerjik" },
  { value: "calm", label: "Sakin" },
  { value: "elegant", label: "Zarif" },
  { value: "edgy", label: "Keskin" },
];

// Target Audience - Gender
export const GENDER_OPTIONS: readonly SelectOption[] = [
  { value: "all", label: "Tümü" },
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
];

// Rules - Promo Frequency
export const PROMO_FREQUENCY_OPTIONS: readonly SelectOption[] = [
  { value: "never", label: "Hiç" },
  { value: "rare", label: "Nadiren" },
  { value: "occasional", label: "Ara Sıra" },
  { value: "frequent", label: "Sık" },
];

// Profile field labels for display
export const PROFILE_LABELS: Record<string, string> = {
  slogan: "Slogan",
  industry: "Sektör",
  sub_category: "Alt Kategori",
  market_position: "Pazar Konumu",
  location_city: "Şehir / Konum",
  tone: "Ses Tonu",
  language: "Dil",
  formality: "Resmiyet Düzeyi",
  emoji_usage: "Emoji Kullanımı",
  caption_style: "Caption Stili",
  aesthetic: "Estetik",
  photography_style: "Fotoğraf Stili",
  color_mood: "Renk Havası",
  visual_mood: "Görsel Hava",
  target_age_range: "Yaş Aralığı",
  target_gender: "Cinsiyet",
  target_description: "Hedef Kitle Açıklaması",
  target_interests: "İlgi Alanları",
  brand_values: "Marka Değerleri",
  unique_points: "Benzersiz Noktalar",
  brand_story_short: "Kısa Marka Hikayesi",
  hashtags_brand: "Marka Hashtagleri",
  hashtags_industry: "Sektör Hashtagleri",
  hashtags_location: "Konum Hashtagleri",
  content_pillars: "İçerik Direkleri",
  avoid_topics: "Kaçınılacak Konular",
  seasonal_content: "Mevsimsel İçerik",
  promo_frequency: "Promosyon Sıklığı",
  extras: "Ekstra Alanlar",
};

// Default values
export const DEFAULT_COLOR = "#3b82f6";
export const DEFAULT_LANGUAGE = "tr";
