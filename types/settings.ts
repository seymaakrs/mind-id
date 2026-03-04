// Application settings types

export interface AppSettings {
  // Model settings
  imageGenerationModel: string;
  videoGenerationModel: string;
  imageAgentModel: string;
  videoAgentModel: string;
  orchestratorModel: string;
  vertexAiModel: string;
  marketingModel: string;
  webAgentModel: string;

  // Server settings
  serverUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  imageGenerationModel: "",
  videoGenerationModel: "",
  imageAgentModel: "",
  videoAgentModel: "",
  orchestratorModel: "",
  vertexAiModel: "",
  marketingModel: "",
  webAgentModel: "",
  serverUrl: "",
};

// Settings field labels
export const SETTINGS_LABELS: Record<keyof AppSettings, string> = {
  imageGenerationModel: "Resim Üretim Modeli",
  videoGenerationModel: "Video Üretim Modeli",
  imageAgentModel: "Resim Agent Modeli",
  videoAgentModel: "Video Agent Modeli",
  orchestratorModel: "Orchestrator Modeli",
  vertexAiModel: "Vertex AI Modeli",
  marketingModel: "Marketing Modeli",
  webAgentModel: "Web Agent Modeli",
  serverUrl: "Server URL",
};

// Agent instruction types

export interface PromptField {
  description: string;
  examples: (string | string[])[];
}

export interface AgentConfig {
  persona: string;
  prompt_fields: Record<string, PromptField>;
}

export interface AgentInstructions {
  image_agent: AgentConfig;
  video_agent: AgentConfig;
}

export const IMAGE_PROMPT_FIELD_KEYS = [
  "scene",
  "subject",
  "style",
  "colors",
  "mood",
  "composition",
  "lighting",
  "background",
  "text_elements",
  "additional_details",
] as const;

export const VIDEO_PROMPT_FIELD_KEYS = [
  "concept",
  "opening_scene",
  "main_action",
  "closing_scene",
  "visual_style",
  "color_palette",
  "mood_atmosphere",
  "camera_movement",
  "lighting_style",
  "pacing",
  "transitions",
  "text_overlays",
  "audio_suggestion",
  "additional_effects",
] as const;

const emptyPromptField = (): PromptField => ({ description: "", examples: [] });

const makeFields = (keys: readonly string[]): Record<string, PromptField> =>
  Object.fromEntries(keys.map((k) => [k, emptyPromptField()]));

export const DEFAULT_AGENT_INSTRUCTIONS: AgentInstructions = {
  image_agent: {
    persona: "",
    prompt_fields: makeFields(IMAGE_PROMPT_FIELD_KEYS),
  },
  video_agent: {
    persona: "",
    prompt_fields: makeFields(VIDEO_PROMPT_FIELD_KEYS),
  },
};

export const PROMPT_FIELD_LABELS: Record<string, string> = {
  // Image agent fields
  scene: "Sahne",
  subject: "Konu",
  style: "Stil",
  colors: "Renkler",
  mood: "Ruh Hali",
  composition: "Kompozisyon",
  lighting: "Aydınlatma",
  background: "Arka Plan",
  text_elements: "Metin Öğeleri",
  additional_details: "Ek Detaylar",
  // Video agent fields
  concept: "Konsept",
  opening_scene: "Açılış Sahnesi",
  main_action: "Ana Aksiyon",
  closing_scene: "Kapanış Sahnesi",
  visual_style: "Görsel Stil",
  color_palette: "Renk Paleti",
  mood_atmosphere: "Ruh Hali / Atmosfer",
  camera_movement: "Kamera Hareketi",
  lighting_style: "Aydınlatma Stili",
  pacing: "Tempo",
  transitions: "Geçişler",
  text_overlays: "Metin Katmanları",
  audio_suggestion: "Ses Önerisi",
  additional_effects: "Ek Efektler",
};

// Settings field descriptions
export const SETTINGS_DESCRIPTIONS: Record<keyof AppSettings, string> = {
  imageGenerationModel: "Resim üretimi için kullanılacak model (örn: dall-e-3, stable-diffusion-xl)",
  videoGenerationModel: "Video üretimi için kullanılacak model (örn: runway-gen2)",
  imageAgentModel: "Resim agent'ı için kullanılacak LLM modeli (örn: gpt-4-vision)",
  videoAgentModel: "Video agent'ı için kullanılacak LLM modeli (örn: gpt-4-turbo)",
  orchestratorModel: "Orchestrator için kullanılacak LLM modeli (örn: gpt-4)",
  vertexAiModel: "Google Vertex AI modeli (örn: gemini-1.5-pro, gemini-1.5-flash)",
  marketingModel: "Marketing içerik üretimi için kullanılacak model (örn: gpt-4, claude-3)",
  webAgentModel: "Web agent için kullanılacak LLM modeli (örn: gpt-4o, claude-3-sonnet)",
  serverUrl: "API sunucu adresi (örn: https://api.example.com)",
};
