"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    FileText,
    Trash2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Instagram,
    Eye,
    BarChart3,
    Share2,
    Bookmark,
    TrendingUp,
    Lightbulb,
    ExternalLink,
    Clock,
    Shield,
    XCircle,
    CheckCircle2,
    ArrowUpRight,
    AlertTriangle,
} from "lucide-react";
import { useReports } from "@/hooks";
import { REPORT_TYPE_LABELS } from "@/types/reports";
import type { Report, InstagramReport, SwotReport } from "@/types/reports";

interface ReportsTabProps {
    businessId: string;
}

// Type guard
const isInstagramReport = (report: Report): report is InstagramReport => {
    return report.type === "instagram_weekly";
};

const isSwotReport = (report: Report): report is SwotReport => {
    return report.type === "swot";
};

// Helper components for Instagram Report
const StatCard = ({ label, value, icon: Icon, subValue }: { label: string, value: string | number, icon: any, subValue?: string }) => (
    <div className="bg-background border rounded-lg p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase">{label}</span>
            <Icon className="w-4 h-4 opacity-70" />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
    </div>
);

const FormatStat = ({ type, data }: { type: string, data: InstagramReport["by_type"]["reels"] }) => (
    <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border">
        <div className="flex items-center justify-between">
            <span className="font-semibold capitalize text-sm">{type}</span>
            <Badge variant="outline" className="text-xs">{data.count} Post</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
                <span className="text-muted-foreground block">Erisim</span>
                <span className="font-medium">{data.reach}</span>
            </div>
            <div>
                <span className="text-muted-foreground block">Goruntulenme</span>
                <span className="font-medium">{data.views}</span>
            </div>
            {data.interactions > 0 && (
                <div className="col-span-2">
                    <span className="text-muted-foreground block">Etkilesim</span>
                    <span className="font-medium">{data.interactions}</span>
                </div>
            )}
        </div>
    </div>
);

const InstagramReportView = ({ report }: { report: InstagramReport }) => {
    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Toplam Erisim"
                    value={report.totals.reach}
                    icon={TrendingUp}
                />
                <StatCard
                    label="Goruntulenme"
                    value={report.totals.views}
                    icon={Eye}
                />
                <StatCard
                    label="Etkilesim"
                    value={report.totals.interactions}
                    icon={BarChart3}
                />
                <StatCard
                    label="Toplam Paylasim"
                    value={report.total_posts}
                    icon={Instagram}
                    subValue={report.date_range}
                />
            </div>

            {/* Content Formats Breakdown */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Format Performansi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormatStat type="Reels" data={report.by_type.reels} />
                    <FormatStat type="Image" data={report.by_type.image} />
                    <FormatStat type="Carousel" data={report.by_type.carousel} />
                </div>
            </div>

            {/* Insights and Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Lightbulb className="w-4 h-4" />
                        Gozlemler & Icgoru
                    </h4>
                    <ul className="space-y-2">
                        {report.insights.map((insight, i) => (
                            <li key={i} className="text-sm flex gap-2 items-start bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded">
                                <span className="text-blue-500 mt-0.5">•</span>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        Oneriler
                    </h4>
                    <ul className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm flex gap-2 items-start bg-green-50/50 dark:bg-green-900/10 p-2 rounded">
                                <span className="text-green-500 mt-0.5">•</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Additional Info */}
            {report.best_posting_time && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                    <Clock className="w-4 h-4" />
                    <span>En iyi paylasim saati: <span className="font-medium text-foreground">{report.best_posting_time}</span></span>
                </div>
            )}

            {/* Top Posts */}
            {/* Top Posts section can be added here if we want to list them, but summary is good for now. */}

        </div>
    );
};

const SwotSection = ({ title, items, icon: Icon, colorClass, bgClass }: { title: string, items: { title: string, description: string }[], icon: any, colorClass: string, bgClass: string }) => (
    <div className={`rounded-lg border p-4 ${bgClass}`}>
        <div className={`flex items-center gap-2 mb-3 ${colorClass}`}>
            <Icon className="w-5 h-5" />
            <h4 className="font-semibold">{title}</h4>
        </div>
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="text-sm">
                    <span className="font-medium block mb-0.5">{item.title}</span>
                    <span className="text-muted-foreground">{item.description}</span>
                </li>
            ))}
        </ul>
    </div>
);

const SwotReportView = ({ report }: { report: SwotReport }) => {
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-muted/30 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Ozet
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {report.summary}
                </p>

                {report.data_sources && (
                    <div className="flex gap-2 mt-3">
                        {Object.entries(report.data_sources).map(([source, used]) => (
                            used && (
                                <Badge key={source} variant="outline" className="text-[10px] font-normal">
                                    {source === "web_search" ? "Web Aramasi" : source === "website" ? "Web Sitesi" : "Profil Verisi"}
                                </Badge>
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* SWOT Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SwotSection
                    title="Guclu Yonler"
                    items={report.strengths}
                    icon={CheckCircle2}
                    colorClass="text-green-600 dark:text-green-400"
                    bgClass="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20"
                />
                <SwotSection
                    title="Zayif Yonler"
                    items={report.weaknesses}
                    icon={XCircle}
                    colorClass="text-red-600 dark:text-red-400"
                    bgClass="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
                />
                <SwotSection
                    title="Firsatlar"
                    items={report.opportunities}
                    icon={ArrowUpRight}
                    colorClass="text-blue-600 dark:text-blue-400"
                    bgClass="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                />
                <SwotSection
                    title="Tehditler"
                    items={report.threats}
                    icon={AlertTriangle}
                    colorClass="text-orange-600 dark:text-orange-400"
                    bgClass="bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20"
                />
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Stratejik Oneriler
                </h4>
                <div className="grid gap-2">
                    {report.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 items-start p-3 rounded-md bg-secondary/20">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                                {i + 1}
                            </span>
                            <span className="text-sm">{rec}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export function ReportsTab({ businessId }: ReportsTabProps) {
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

    const {
        reports,
        loading: loadingReports,
        error: reportsError,
        fetchReports,
        removeReport,
    } = useReports();

    // Fetch reports when businessId changes
    useEffect(() => {
        if (businessId) {
            fetchReports(businessId);
        }
    }, [businessId, fetchReports]);

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm("Bu raporu silmek istediginize emin misiniz?")) return;
        await removeReport(businessId, reportId);
    };

    const toggleExpandReport = (reportId: string) => {
        setExpandedReportId((prev) => (prev === reportId ? null : reportId));
    };

    // Helper to format date
    const formatDate = (createdAt: unknown): string => {
        if (!createdAt) return "-";
        let date: Date | null = null;
        if (typeof createdAt === "object" && "toDate" in createdAt && typeof (createdAt as { toDate: () => Date }).toDate === "function") {
            date = (createdAt as { toDate: () => Date }).toDate();
        } else if (typeof createdAt === "object" && "seconds" in createdAt) {
            date = new Date((createdAt as { seconds: number }).seconds * 1000);
        } else if (typeof createdAt === "string" || createdAt instanceof Date) {
            date = new Date(createdAt as string | Date);
        }
        if (!date) return "-";
        return date.toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Raporlar ve Analizler</h3>
                    <p className="text-sm text-muted-foreground">
                        Isletme icin olusturulan raporlar ve analizler
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchReports(businessId)}
                        disabled={loadingReports}
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingReports ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Reports List */}
            <Card>
                <CardHeader>
                    <CardTitle>Raporlar</CardTitle>
                    <CardDescription>
                        {reports.length} rapor bulundu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reportsError && (
                        <p className="text-sm text-destructive mb-4">{reportsError}</p>
                    )}

                    {loadingReports ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Henuz rapor bulunmuyor.</p>
                            <p className="text-sm mt-2">SWOT Analizi veya Instagram Analizi yaparak baslayabilirsiniz.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((report) => (
                                <div key={report.id} className="border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => toggleExpandReport(report.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant={report.type === "swot" ? "default" : report.type === "instagram_weekly" ? "secondary" : "outline"}>
                                                {REPORT_TYPE_LABELS[report.type] || report.type}
                                            </Badge>
                                            <div>
                                                <p className="font-medium">{report.title}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteReport(report.id);
                                                }}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            {expandedReportId === report.id ? (
                                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    {expandedReportId === report.id && (
                                        <div className="px-4 pb-4 border-t bg-muted/10 animate-in slide-in-from-top-2 duration-200">
                                            <div className="pt-4">
                                                {isInstagramReport(report) ? (
                                                    <InstagramReportView report={report} />
                                                ) : isSwotReport(report) ? (
                                                    <SwotReportView report={report} />
                                                ) : (
                                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                                        <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-md border font-mono">
                                                            {report.content || "Icerik bulunamadi."}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
