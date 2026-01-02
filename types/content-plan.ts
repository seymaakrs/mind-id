// Content Plan types for businesses/{business_id}/content_calendar/{plan_id}

export type PlanStatus = "active" | "draft" | "paused" | "completed" | "cancelled";
export type PostStatus = "planned" | "created" | "posted" | "skipped";
export type ContentType = "reels" | "image" | "carousel" | "story" | "video";

export interface ContentPost {
  id: string;
  scheduled_date: string; // "YYYY-MM-DD" format
  status: PostStatus;
  content_type: ContentType;
  topic: string;
  brief: string;
  caption_draft: string | null;
  generated_media_path: string | null;
  instagram_post_id: string | null;
}

export interface ContentPlan {
  plan_id: string;
  start_date: string; // "YYYY-MM-DD" format
  end_date: string; // "YYYY-MM-DD" format
  status: PlanStatus;
  created_by: string;
  notes: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  posts: ContentPost[];
}

// UI labels
export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: "Aktif",
  draft: "Taslak",
  paused: "Duraklatıldı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  planned: "Planlandı",
  created: "Oluşturuldu",
  posted: "Paylaşıldı",
  skipped: "Atlandı",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  reels: "Reels",
  image: "Görsel",
  carousel: "Carousel",
  story: "Story",
  video: "Video",
};

// Status colors for UI
export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  active: "bg-green-500/20 text-green-500",
  draft: "bg-gray-500/20 text-gray-400",
  paused: "bg-yellow-500/20 text-yellow-500",
  completed: "bg-blue-500/20 text-blue-500",
  cancelled: "bg-red-500/20 text-red-500",
};

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  planned: "bg-purple-500/20 text-purple-500",
  created: "bg-blue-500/20 text-blue-500",
  posted: "bg-green-500/20 text-green-500",
  skipped: "bg-gray-500/20 text-gray-400",
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  reels: "bg-pink-500/20 text-pink-500",
  image: "bg-blue-500/20 text-blue-500",
  carousel: "bg-indigo-500/20 text-indigo-500",
  story: "bg-orange-500/20 text-orange-500",
  video: "bg-red-500/20 text-red-500",
};
