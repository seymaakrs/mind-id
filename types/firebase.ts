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
  instagram_account_id: string; // Zorunlu alan - Instagram hesap ID'si
  instagram_access_token: string; // Zorunlu alan - Instagram erişim token'ı
  client_id?: string; // Facebook App ID
  client_secret?: string; // Facebook App Secret
  profile: BusinessProfile; // İşletme profil bilgileri
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
