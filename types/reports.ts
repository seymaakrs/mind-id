import { Timestamp } from "firebase/firestore";

// Report types
export type ReportType = "swot" | "competitor" | "market" | "general" | "instagram_weekly" | "custom";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    swot: "SWOT Analizi",
    competitor: "Rakip Analizi",
    market: "Pazar Analizi",
    general: "Genel Rapor",
    instagram_weekly: "Instagram Haftalık Rapor",
    custom: "Özel Rapor",
};

// Base report interface
export interface Report {
    id: string;
    businessId: string;
    type: ReportType;
    title: string;
    content?: string; // Markdown or plain text (optional for structured reports)
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    metadata?: Record<string, unknown>;
}

// SWOT specific types
interface SwotItem {
    title: string;
    description: string;
}

// SWOT specific report
export interface SwotReport extends Report {
    type: "swot";
    strengths: SwotItem[];
    weaknesses: SwotItem[];
    opportunities: SwotItem[];
    threats: SwotItem[];
    summary: string;
    recommendations: string[];
    data_sources?: {
        profile: boolean;
        website: boolean;
        web_search: boolean;
    };
}

// Instagram stats helper
interface InstagramTypeStats {
    count: number;
    reach: number;
    views: number;
    interactions: number;
    notes?: string;
}

// Instagram Weekly Report
export interface InstagramReport extends Report {
    type: "instagram_weekly";
    date_range: string;
    total_posts: number;
    totals: {
        reach: number;
        views: number;
        interactions: number;
        shares: number;
        saved: number;
    };
    by_type: {
        reels: InstagramTypeStats;
        image: InstagramTypeStats;
        carousel: InstagramTypeStats;
    };
    top_posts: Array<{
        id: string;
        type: string;
        reach: number;
        views: number;
        permalink: string;
    }>;
    insights: string[];
    recommendations: string[];
    best_posting_time?: string;
}

// Block types for custom reports
export type Block =
    | { type: "text"; content: string }
    | { type: "heading"; content: string; level: 1 | 2 | 3 }
    | { type: "list"; items: string[]; ordered?: boolean }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "quote"; content: string }
    | { type: "code"; content: string; language?: string }
    | { type: "divider" };

// Custom Report with block-based content
export interface CustomReport extends Report {
    type: "custom";
    summary: string;
    created_at: string; // ISO timestamp (primary date field for custom reports)
    created_by: "agent" | "user";
    blocks: Block[];
    tags?: string[];
    sources?: string[];
}

// Create report data (without id and timestamps)
export type CreateReportData = {
    type: ReportType;
    title: string;
    content?: string;
    metadata?: Record<string, unknown>;
    // Allow extra fields for structured reports
    [key: string]: unknown;
};
