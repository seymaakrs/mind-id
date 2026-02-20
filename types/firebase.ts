import { Timestamp } from 'firebase/firestore';

// Base document type
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Admin users
export interface AdminUser extends BaseDocument {
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'editor';
}

// Business profile - structured profile data
export interface BusinessProfile {
  // Kimlik
  slogan?: string;
  industry?: string;
  sub_category?: string;
  market_position?: string;
  location_city?: string;

  // Marka Sesi
  tone?: string;
  language?: string;
  formality?: string;
  emoji_usage?: string;
  caption_style?: string;

  // Görsel
  aesthetic?: string;
  photography_style?: string;
  color_mood?: string;
  visual_mood?: string;

  // Hedef Kitle
  target_age_range?: string;
  target_gender?: string;
  target_description?: string;
  target_interests?: string[];

  // Değerler
  brand_values?: string[];
  unique_points?: string[];
  brand_story_short?: string;

  // Sosyal Medya
  hashtags_brand?: string[];
  hashtags_industry?: string[];
  hashtags_location?: string[];
  content_pillars?: string[];

  // Kurallar
  avoid_topics?: string[];
  seasonal_content?: boolean;
  promo_frequency?: string;

  // Kullanıcının eklediği ekstra alanlar
  extras?: Record<string, string>;
}

// Business type with profile
export interface Business extends BaseDocument {
  name: string; // Zorunlu alan - işletme adı
  logo: string; // Zorunlu alan - logo URL (Storage path)
  colors: string[]; // Zorunlu alan - renk paleti (hex kodları)
  website?: string; // İşletme web sitesi
  late_profile_id?: string; // Late Profile ID
  profile: BusinessProfile; // İşletme profil bilgileri
  status?: 'pending' | 'approved'; // undefined = approved (backward compat)
  submitted_via?: string; // invite token ID (for public form submissions)
  // Platform IDs (synced from Late API)
  instagram_id?: string;
  facebook_id?: string;
  twitter_id?: string;
  tiktok_account_id?: string;
  youtube_id?: string;
  linkedin_account_id?: string;
  // Allow any other platform ID fields
  [key: `${string}_id` | `${string}_account_id`]: string | undefined;
}

// Business media (subcollection: businesses/{business_id}/media)
export interface BusinessMedia {
  id: string;
  type: 'image' | 'video';
  storage_path: string;
  public_url: string;
  file_name: string;
  created_at: string;
  prompt_summary: string;
  metadata?: Record<string, unknown>;
}

// Activity log
export interface ActivityLog extends BaseDocument {
  userId: string;
  userEmail: string;
  action: string;
  collection: string;
  documentId?: string;
  details?: Record<string, unknown>;
}

// Instagram post (subcollection: businesses/{business_id}/instagram_posts)
export interface InstagramPost {
  id: string; // Document ID = Instagram post ID
  permalink?: string; // Instagram post permalink (cached)
  owner_username?: string; // Instagram username
  owner_id?: string; // Instagram user ID
  fetched_at?: string; // When permalink was fetched
  // Additional fields that might exist
  caption?: string;
  media_type?: string;
  timestamp?: string;
}

// Agent error types
export type AgentErrorType =
  | 'api_error'
  | 'validation_error'
  | 'timeout'
  | 'rate_limit'
  | 'not_found'
  | 'permission'
  | 'unknown';

export type AgentErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Agent error (collection: errors)
export interface AgentError {
  id: string;
  business_id: string;
  agent: string; // "image_agent", "marketing_agent", etc.
  task: string; // Ne yapmaya çalışıyordu
  error_message: string;
  error_type: AgentErrorType;
  severity: AgentErrorSeverity;
  context?: Record<string, unknown> | null;
  created_at: string;
  resolved: boolean;
  resolved_at?: string | null;
  resolution_note?: string | null;
}

// GEO Analysis sub-types
export interface GeoCrawlerAccess {
  score: number;
  max: number;
  bots_allowed: string[];
  bots_blocked: string[];
  bots_not_mentioned: string[];
}

export interface GeoContentStructure {
  score: number;
  max: number;
  has_faq_section: boolean;
  faq_schema: boolean;
  tables_count: number;
  lists_count: number;
  question_headings_count: number;
}

export interface GeoCitationData {
  score: number;
  max: number;
  external_citations: number;
  citation_density_per_1k: number;
  statistics_count: number;
  statistics_density_per_1k: number;
}

export interface GeoAiDiscovery {
  score: number;
  max: number;
  has_llms_txt: boolean;
  geo_schema_types_present: string[];
  geo_schema_types_missing: string[];
  freshness_signals: string[];
}

export interface GeoRecommendation {
  category: string;
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
}

export interface GeoAnalysis {
  ai_crawler_access: GeoCrawlerAccess;
  content_structure: GeoContentStructure;
  citation_data: GeoCitationData;
  ai_discovery: GeoAiDiscovery;
  recommendations?: GeoRecommendation[];
}

export interface ScoreBreakdownRecommendation {
  category: string;
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
}

export interface ScoreBreakdown {
  total_score: number;
  raw_score: number;
  breakdown: Record<string, unknown>;
  penalties: unknown[];
  recommendations?: ScoreBreakdownRecommendation[];
}

// SEO Summary (businesses/{businessId}/seo/summary)
export interface SeoSummary {
  overall_score: number;        // 0-100, genel SEO skoru
  business_seo_score: number;   // 0-100, işletme sitesinin skoru
  top_keywords: string[];       // En önemli 10 anahtar kelime
  main_issues: string[];        // Düzeltilmesi gereken sorunlar (max 5)
  competitor_count: number;     // Analiz edilen rakip sayısı
  competitor_avg_score: number; // Rakiplerin ort. SEO skoru
  last_report_id: string | null; // "seo-20260131-abc123" (reports/ referansı)
  last_analysis_date: string;   // ISO datetime
  updated_at: string;           // ISO datetime
  serp_visibility_score?: number | null; // 0-100, SERP görünürlük skoru
  geo_readiness_score?: number | null;   // 0-100, GEO hazırlık skoru
  geo_analysis?: GeoAnalysis | null;     // 4 kategorili GEO analiz detayı
  score_breakdown?: ScoreBreakdown | null; // Skor kırılımı ve öneriler
}

// SEO Keywords (businesses/{businessId}/seo/keywords)
export type SeoKeywordCategory = "primary" | "secondary" | "long_tail" | "local";
export type SeoSearchIntent = "informational" | "transactional" | "navigational";
export type SeoKeywordPriority = "high" | "medium" | "low";

export interface SeoKeywordItem {
  keyword: string;          // "istanbul web tasarım"
  category: SeoKeywordCategory;
  search_intent: SeoSearchIntent;
  priority: SeoKeywordPriority;
  competitor_usage: number; // Kaç rakip kullanıyor
  notes: string;            // Ek notlar
}

export interface SeoKeywords {
  items: SeoKeywordItem[];
  total_count: number;
  source: string;           // "seo_analysis"
  report_id: string | null; // İlişkili rapor ID'si
  updated_at: string;       // ISO datetime
}
