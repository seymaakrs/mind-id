import type { BusinessMedia } from "@/types/firebase";
import type { Report } from "@/types/reports";
import type { ContentPlan } from "@/types/content-plan";
import type { Task } from "@/types/tasks";

export type ReferenceType =
  | "media"
  | "instagram_post"
  | "content_plan"
  | "report"
  | "task_result";

// API'ye gönderilen minimal tip (backend Reference modeli ile eşleşir)
export interface Reference {
  type: ReferenceType;
  id: string;
  url?: string | null;
  label?: string | null;
}

// Client-side display için genişletilmiş tip (API'ye gönderilmez)
export interface ReferenceItem extends Reference {
  businessId: string;
  thumbnail?: string | null;
}

export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  media: "Medya",
  instagram_post: "Instagram",
  content_plan: "Icerik Plani",
  report: "Rapor",
  task_result: "Gorev Sonucu",
};

// Firestore entity → ReferenceItem dönüşüm helper'ları

export function mediaToReference(media: BusinessMedia, businessId: string): ReferenceItem {
  return {
    type: "media",
    id: media.id,
    url: media.public_url,
    label: media.file_name || media.prompt_summary || "Medya",
    businessId,
    thumbnail: media.type === "image" ? media.public_url : null,
  };
}

export function reportToReference(report: Report, businessId: string): ReferenceItem {
  return {
    type: "report",
    id: report.id,
    url: null,
    label: report.title || `Rapor #${report.id.slice(0, 6)}`,
    businessId,
    thumbnail: null,
  };
}

export function contentPlanToReference(plan: ContentPlan, businessId: string): ReferenceItem {
  return {
    type: "content_plan",
    id: plan.plan_id,
    url: null,
    label: `${plan.start_date} - ${plan.end_date}`,
    businessId,
    thumbnail: null,
  };
}

export function taskToReference(task: Task, businessId: string): ReferenceItem {
  return {
    type: "task_result",
    id: task.id,
    url: null,
    label: task.task.slice(0, 60) + (task.task.length > 60 ? "..." : ""),
    businessId,
    thumbnail: null,
  };
}
