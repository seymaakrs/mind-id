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
  // Platform IDs (synced from Late API)
  instagram_id?: string;
  facebook_id?: string;
  twitter_id?: string;
  tiktok_id?: string;
  youtube_id?: string;
  linkedin_id?: string;
  // Allow any other platform_id fields
  [key: `${string}_id`]: string | undefined;
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

// SEO Summary (businesses/{businessId}/seo/summary)
export interface SeoSummary {
  overall_score: number;        // 0-100, genel SEO skoru
  business_seo_score: number;   // 0-100, işletme sitesinin skoru
  top_keywords: string[];       // En önemli 10 anahtar kelime
  main_issues: string[];        // Düzeltilmesi gereken sorunlar (max 5)
  competitor_count: number;     // Analiz edilen rakip sayısı
  competitor_avg_score: number; // Rakiplerin ort. SEO skoru
  last_report_id: string;       // "seo-20260131-abc123" (reports/ referansı)
  last_analysis_date: string;   // ISO datetime
  updated_at: string;           // ISO datetime
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
