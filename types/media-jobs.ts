export type MediaOperation =
  | "text_to_video"
  | "image_to_video"
  | "first_last_frame"
  | "reference_to_video"
  | "video_edit"
  | "video_reference"
  | "lipsync_audio"
  | "lipsync_text"

export type ModelTier = "v3_standard" | "v3_pro" | "o1"

export type MediaJobStatus = "pending" | "processing" | "completed" | "failed"

export interface MediaJobCreate {
  operation: MediaOperation
  model_tier: ModelTier
  prompt?: string
  negative_prompt?: string
  duration?: number
  aspect_ratio?: string
  cfg_scale?: number
  image_url?: string
  last_image_url?: string
  reference_image_urls?: string[]
  video_url?: string
  audio_url?: string
  lipsync_text?: string
  parent_job_id?: string
}

export interface MediaJob {
  id: string
  thread_id: string
  service: string
  operation: MediaOperation
  model_tier: ModelTier
  fal_model_id: string
  fal_request_id?: string
  status: MediaJobStatus
  input: Record<string, unknown>
  output_url?: string
  output_duration?: number
  error?: string
  parent_job_id?: string
  created_at: string
  updated_at: string
}
