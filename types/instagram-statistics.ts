// Instagram content types
export type InstagramContentType = "reels" | "image" | "carousel";

// Metrics per content type
export interface InstagramContentTypeMetrics {
  count: number;
  reach: number;
  likes: number;
  saves: number;
}

// Top performing post
export interface InstagramTopPost {
  url: string;
  type: InstagramContentType;
  reach: number;
  engagement_rate: number;
}

// Weekly aggregated metrics
export interface InstagramWeeklyMetrics {
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  total_likes: number;
  total_comments: number;
  total_saves: number;
  total_shares: number;
  total_views: number;
  avg_engagement_rate: number;
  by_content_type: Record<InstagramContentType, InstagramContentTypeMetrics>;
  top_posts: InstagramTopPost[];
}

// Week over week comparison
export interface InstagramWeekOverWeek {
  reach_change: string;        // "+18%", "-5%"
  engagement_change: string;   // "+5%", "-2%"
  trend: "positive" | "negative" | "neutral";
}

// AI-generated summary structure
export interface InstagramSummary {
  insights: string[];          // ["Türkçe bulgu 1", "Türkçe bulgu 2"]
  recommendations: string[];   // ["Türkçe öneri 1", "Türkçe öneri 2"]
  week_over_week: InstagramWeekOverWeek;
}

// Full weekly stats document from Firestore
export interface InstagramWeeklyStats {
  week_id: string;           // "week-2026-05"
  week_number: number;
  year: number;
  date_range: { start: string; end: string };
  metrics: InstagramWeeklyMetrics;
  summary: InstagramSummary | null;    // AI-generated analysis
  analyzed_at: string | null;
  analyzed_by: string | null;
  created_at: string;
  created_by: string;
}

// Week option for dropdown selector
export interface InstagramWeekOption {
  week_id: string;
  week_number: number;
  year: number;
  label: string;  // "Hafta 5 (27 Oca - 2 Sub 2026)"
  date_range: { start: string; end: string };
}

// Content type display info
export const CONTENT_TYPE_INFO: Record<InstagramContentType, { label: string; color: string }> = {
  reels: {
    label: "Reels",
    color: "#E1306C",
  },
  image: {
    label: "Gorsel",
    color: "#833AB4",
  },
  carousel: {
    label: "Carousel",
    color: "#F77737",
  },
};
