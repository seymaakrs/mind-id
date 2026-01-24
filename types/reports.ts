import { Timestamp } from "firebase/firestore";

// Report types
export type ReportType = "swot" | "competitor" | "market" | "general";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    swot: "SWOT Analizi",
    competitor: "Rakip Analizi",
    market: "Pazar Analizi",
    general: "Genel Rapor",
};

// Base report interface
export interface Report {
    id: string;
    businessId: string;
    type: ReportType;
    title: string;
    content: string; // Markdown or plain text
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    metadata?: Record<string, unknown>;
}

// SWOT specific report
export interface SwotReport extends Report {
    type: "swot";
    metadata: {
        strengths?: string[];
        weaknesses?: string[];
        opportunities?: string[];
        threats?: string[];
    };
}

// Create report data (without id and timestamps)
export type CreateReportData = {
    type: ReportType;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
};
