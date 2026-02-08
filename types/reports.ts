import { Timestamp } from "firebase/firestore";

// Report types
export type ReportType = "swot" | "competitor" | "market" | "general" | "instagram_weekly" | "custom" | "seo";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    swot: "SWOT Analizi",
    competitor: "Rakip Analizi",
    market: "Pazar Analizi",
    general: "Genel Rapor",
    instagram_weekly: "Instagram Haftalık Rapor",
    custom: "Özel Rapor",
    seo: "SEO Analizi",
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

// SEO Report types
interface SeoMetaTags {
    title: string | null;
    title_length: number;
    description: string | null;
    description_length: number;
    keywords: string[];
    robots: string | null;
    canonical: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
}

interface SeoHeadings {
    h1: string[];
    h2: string[];
    h3: string[];
    h1_count: number;
    has_single_h1: boolean;
}

interface SeoImages {
    total_images: number;
    images_with_alt: number;
    images_without_alt: number;
    alt_texts: string[];
    missing_alt_srcs: string[];
}

interface SeoLinks {
    total_links: number;
    internal_links: number;
    external_links: number;
    nofollow_links: number;
}

interface SeoSchemaMarkup {
    has_schema: boolean;
    schema_types: string[];
}

interface BusinessWebsiteAnalysis {
    url: string;
    meta_tags: SeoMetaTags;
    headings: SeoHeadings;
    images: SeoImages;
    links: SeoLinks;
    schema_markup: SeoSchemaMarkup;
    word_count: number;
    seo_score: number;
}

interface SeoCompetitor {
    domain: string;
    seo_score: number;
    title: string | null;
    h1: string[];
    word_count: number;
    schema_types: string[];
    has_schema: boolean;
}

interface SeoKeywordRecommendation {
    keyword: string;
    category: "primary" | "secondary" | "long_tail" | "local";
    search_intent: "informational" | "transactional" | "navigational";
    priority: "high" | "medium" | "low";
    competitor_usage: number;
    notes: string;
}

interface SeoTechnicalIssue {
    type: "error" | "warning" | "info";
    issue: string;
    recommendation: string;
}

// SEO Report
export interface SeoReport extends Report {
    type: "seo";
    created_at: string;
    created_by: "agent";
    overall_score: number;
    summary: string;
    business_website_analysis: BusinessWebsiteAnalysis;
    competitors: SeoCompetitor[];
    competitor_urls: string[];
    keyword_recommendations: SeoKeywordRecommendation[];
    technical_issues: SeoTechnicalIssue[];
    content_recommendations: string[];
    data_sources: {
        business_website: boolean;
        competitors: boolean;
        web_search: boolean;
    };
    geo_readiness_score?: number | null;
    geo_analysis?: import("@/types/firebase").GeoAnalysis | null;
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
