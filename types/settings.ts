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
  serverUrl: "Server URL",
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
  serverUrl: "API sunucu adresi (örn: https://api.example.com)",
};
