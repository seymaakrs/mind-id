// API Provider types
export type ApiProvider =
  | "all"
  | "openai"
  | "gemini"
  | "veo"
  | "cloudconvert";

// Time range filter options
export type TimeRange = "all" | "30d" | "7d" | "1d";

// Daily spending data point
export interface DailySpending {
  date: string; // YYYY-MM-DD format
  amount: number; // USD
}

// API usage summary
export interface ApiUsageSummary {
  provider: ApiProvider;
  label: string;
  totalSpend: number; // Total USD spent
  currentPeriodSpend: number; // Spend in selected period
  trend: number; // Percentage change from previous period
  requests?: number; // Total API requests (if available)
  tokensUsed?: number; // Tokens used (for LLM APIs)
  creditsRemaining?: number; // For credit-based APIs like CloudConvert
}

// Billing account info (for Google Cloud services)
export interface BillingAccountInfo {
  name: string;
  displayName: string;
  open: boolean;
  linkedProjects: number;
  projectId: string;
}

// Provider statistics data
export interface ProviderStats {
  provider: ApiProvider;
  summary: ApiUsageSummary;
  dailyData: DailySpending[];
  loading: boolean;
  error: string | null;
  billingAccount?: BillingAccountInfo; // For Google Cloud services
  configured?: boolean; // Whether the service is configured
  note?: string; // Additional info message
}

// OpenAI specific response types
export interface OpenAICostResponse {
  object: string;
  data: OpenAICostItem[];
  has_more: boolean;
}

export interface OpenAICostItem {
  object: string;
  amount: {
    value: number;
    currency: string;
  };
  line_item?: string;
  project_id?: string;
  start_time: number;
  end_time: number;
}

// CloudConvert user info response
export interface CloudConvertUserResponse {
  data: {
    id: string;
    username: string;
    email: string;
    credits: number;
    created_at: string;
    job_count: number;
    conversion_count: number;
  };
}

// Google Cloud Billing response (simplified)
export interface GoogleBillingResponse {
  services: GoogleBillingService[];
  totalCost: number;
  currency: string;
}

export interface GoogleBillingService {
  service: string; // e.g., "Cloud AI Platform", "Firebase"
  cost: number;
  currency: string;
}

// Statistics API response wrapper
export interface StatisticsApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Chart data types for Recharts
export interface LineChartData {
  date: string;
  amount: number;
  [key: string]: string | number; // For multi-line charts
}

export interface BarChartData {
  provider: string;
  label: string;
  totalSpend: number;
  color?: string;
}

// Provider info for sidebar
export interface ProviderInfo {
  id: ApiProvider;
  label: string;
  description: string;
  color: string;
}

// Provider configuration
export const PROVIDER_INFO: Record<ApiProvider, ProviderInfo> = {
  all: {
    id: "all",
    label: "Hepsini Gor",
    description: "Tum API harcamalarinin ozeti",
    color: "hsl(var(--primary))",
  },
  openai: {
    id: "openai",
    label: "OpenAI API",
    description: "GPT modelleri ve diger OpenAI servisleri",
    color: "#10a37f",
  },
  gemini: {
    id: "gemini",
    label: "Google AI - Gemini",
    description: "Gemini Pro ve Flash modelleri",
    color: "#4285f4",
  },
  veo: {
    id: "veo",
    label: "Google AI - Veo 3.1",
    description: "Video uretim API'si",
    color: "#ea4335",
  },
  cloudconvert: {
    id: "cloudconvert",
    label: "CloudConvert",
    description: "Dosya donusturme servisi",
    color: "#ff6600",
  },
};

// Time range labels
export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  all: "Tum Zamanlar",
  "30d": "Son 30 Gun",
  "7d": "Son 7 Gun",
  "1d": "Son 1 Gun",
};
