import type { Timestamp } from "firebase/firestore";

export interface BusinessUnderstanding {
  summary: string;
  strengths: string[];
  audience: string;
  voice_tone: string;
}

export interface ContentInsights {
  best_performing_types: string[];
  best_posting_times: string[];
  effective_hashtags: string[];
  caption_styles_that_work: string[];
}

export interface MemoryNote {
  note: string;
  added_at: Timestamp | string;
}

export interface AdminNote {
  note: string;
  priority: "low" | "medium" | "high";
  added_at: Timestamp | string;
  active: boolean;
}

export interface AgentMemory {
  business_understanding: BusinessUnderstanding;
  content_insights: ContentInsights;
  learned_patterns: string[];
  notes: MemoryNote[];
  admin_notes: AdminNote[];
  last_updated: Timestamp | string;
  last_compacted?: Timestamp | string;
  cleared_at?: Timestamp | string;
}

export const PRIORITY_COLORS: Record<AdminNote["priority"], string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  high: "bg-red-500/10 text-red-500 border-red-500/30",
};

export const PRIORITY_LABELS: Record<AdminNote["priority"], string> = {
  low: "Dusuk",
  medium: "Orta",
  high: "Yuksek",
};
