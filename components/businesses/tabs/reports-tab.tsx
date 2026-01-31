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
    Quote,
    Code,
    Link,
    Tag,
    Globe,
    Search,
    Image,
    LinkIcon,
    Heading,
    Target,
    Users,
    Info,
    CircleAlert,
    FileWarning,
} from "lucide-react";
import { useReports } from "@/hooks";
import { REPORT_TYPE_LABELS } from "@/types/reports";
import type { Report, InstagramReport, SwotReport, CustomReport, SeoReport, Block } from "@/types/reports";

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

const isCustomReport = (report: Report): report is CustomReport => {
    return report.type === "custom";
};

const isSeoReport = (report: Report): report is SeoReport => {
    return report.type === "seo";
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

// Block renderer for custom reports
const BlockRenderer = ({ block }: { block: Block }) => {
    switch (block.type) {
        case "text":
            return <p className="text-sm leading-relaxed text-muted-foreground">{block.content}</p>;

        case "heading":
            if (block.level === 1) {
                return <h2 className="text-xl font-bold mt-6 mb-3">{block.content}</h2>;
            } else if (block.level === 2) {
                return <h3 className="text-lg font-semibold mt-5 mb-2">{block.content}</h3>;
            } else {
                return <h4 className="text-base font-medium mt-4 mb-2">{block.content}</h4>;
            }

        case "list":
            const ListTag = block.ordered ? "ol" : "ul";
            return (
                <ListTag className={`space-y-1 my-3 ${block.ordered ? "list-decimal" : "list-disc"} list-inside`}>
                    {block.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                </ListTag>
            );

        case "table":
            return (
                <div className="overflow-x-auto my-4 border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {block.headers.map((header, i) => (
                                    <th key={i} className="px-4 py-2 text-left font-semibold border-b">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, i) => (
                                <tr key={i} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-2 text-muted-foreground">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case "quote":
            return (
                <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-muted/20 rounded-r-lg">
                    <div className="flex items-start gap-2">
                        <Quote className="w-4 h-4 text-primary/70 flex-shrink-0 mt-0.5" />
                        <p className="text-sm italic text-muted-foreground">{block.content}</p>
                    </div>
                </blockquote>
            );

        case "code":
            return (
                <div className="my-4">
                    {block.language && (
                        <div className="flex items-center gap-2 bg-muted/70 px-3 py-1 rounded-t-lg border border-b-0">
                            <Code className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{block.language}</span>
                        </div>
                    )}
                    <pre className={`bg-muted/50 p-4 ${block.language ? "rounded-b-lg rounded-t-none" : "rounded-lg"} border overflow-x-auto`}>
                        <code className="text-sm font-mono">{block.content}</code>
                    </pre>
                </div>
            );

        case "divider":
            return <hr className="my-6 border-muted" />;

        default:
            return null;
    }
};

// Custom report view component
const CustomReportView = ({ report }: { report: CustomReport }) => {
    return (
        <article className="space-y-4">
            {/* Summary */}
            {report.summary && (
                <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.summary}
                    </p>
                </div>
            )}

            {/* Content Blocks */}
            <div className="space-y-2">
                {report.blocks.map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                ))}
            </div>

            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-4 border-t">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                        {report.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Sources */}
            {report.sources && report.sources.length > 0 && (
                <div className="pt-4 border-t space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        Kaynaklar
                    </h4>
                    <ul className="space-y-1">
                        {report.sources.map((url, i) => (
                            <li key={i}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    {url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
};

// Score indicator component for SEO
const ScoreIndicator = ({ score, label, size = "md" }: { score: number, label?: string, size?: "sm" | "md" | "lg" }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-green-500 border-green-500/30 bg-green-500/10";
        if (s >= 60) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
        if (s >= 40) return "text-orange-500 border-orange-500/30 bg-orange-500/10";
        return "text-red-500 border-red-500/30 bg-red-500/10";
    };

    const sizeClasses = {
        sm: "w-10 h-10 text-sm",
        md: "w-14 h-14 text-lg",
        lg: "w-20 h-20 text-2xl",
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`${sizeClasses[size]} ${getScoreColor(score)} rounded-full border-2 flex items-center justify-center font-bold`}>
                {score}
            </div>
            {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
    );
};

// Issue badge component
const IssueBadge = ({ type }: { type: "error" | "warning" | "info" }) => {
    const config = {
        error: { icon: XCircle, className: "bg-red-500/10 text-red-500 border-red-500/30", label: "Hata" },
        warning: { icon: FileWarning, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", label: "Uyari" },
        info: { icon: Info, className: "bg-blue-500/10 text-blue-500 border-blue-500/30", label: "Bilgi" },
    };
    const { icon: Icon, className, label } = config[type];
    return (
        <Badge variant="outline" className={`text-xs ${className}`}>
            <Icon className="w-3 h-3 mr-1" />
            {label}
        </Badge>
    );
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: "high" | "medium" | "low" }) => {
    const config = {
        high: "bg-red-500/10 text-red-500 border-red-500/30",
        medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
        low: "bg-green-500/10 text-green-500 border-green-500/30",
    };
    const labels = { high: "Yuksek", medium: "Orta", low: "Dusuk" };
    return (
        <Badge variant="outline" className={`text-xs ${config[priority]}`}>
            {labels[priority]}
        </Badge>
    );
};

// Category badge component
const CategoryBadge = ({ category }: { category: "primary" | "secondary" | "long_tail" | "local" }) => {
    const labels = { primary: "Birincil", secondary: "Ikincil", long_tail: "Uzun Kuyruk", local: "Yerel" };
    return (
        <Badge variant="secondary" className="text-xs">
            {labels[category]}
        </Badge>
    );
};

// SEO Report view component
const SeoReportView = ({ report }: { report: SeoReport }) => {
    const analysis = report.business_website_analysis;

    return (
        <div className="space-y-6">
            {/* Overall Score & Summary */}
            <div className="flex flex-col md:flex-row gap-4">
                {report.overall_score !== undefined && (
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border min-w-fit">
                        <ScoreIndicator score={report.overall_score} label="Genel Skor" size="lg" />
                    </div>
                )}
                {report.summary && (
                    <div className="flex-1 p-4 bg-muted/30 rounded-lg border">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Ozet
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {report.summary}
                        </p>
                    </div>
                )}
            </div>

            {/* Data Sources */}
            {report.data_sources && (
                <div className="flex gap-2">
                    {report.data_sources.business_website && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                            <Globe className="w-3 h-3 mr-1" />
                            Web Sitesi
                        </Badge>
                    )}
                    {report.data_sources.competitors && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                            <Users className="w-3 h-3 mr-1" />
                            Rakipler
                        </Badge>
                    )}
                    {report.data_sources.web_search && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                            <Search className="w-3 h-3 mr-1" />
                            Web Aramasi
                        </Badge>
                    )}
                </div>
            )}

            {/* Business Website Analysis */}
            {analysis && (
            <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2 text-primary">
                    <Globe className="w-5 h-5" />
                    Web Sitesi Analizi
                    {analysis.seo_score !== undefined && <ScoreIndicator score={analysis.seo_score} size="sm" />}
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Meta Tags */}
                    {analysis.meta_tags && (
                    <div className="p-4 rounded-lg border bg-card">
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            Meta Etiketleri
                        </h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground">Title:</span>
                                <span className="text-right max-w-[60%] truncate" title={analysis.meta_tags.title || "Yok"}>
                                    {analysis.meta_tags.title || <span className="text-red-500">Yok</span>}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Title Uzunlugu:</span>
                                <span className={(analysis.meta_tags.title_length ?? 0) >= 50 && (analysis.meta_tags.title_length ?? 0) <= 60 ? "text-green-500" : "text-yellow-500"}>
                                    {analysis.meta_tags.title_length ?? 0} karakter
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground">Description:</span>
                                <span className="text-right max-w-[60%] truncate" title={analysis.meta_tags.description || "Yok"}>
                                    {analysis.meta_tags.description ? "Var" : <span className="text-red-500">Yok</span>}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Description Uzunlugu:</span>
                                <span className={(analysis.meta_tags.description_length ?? 0) >= 150 && (analysis.meta_tags.description_length ?? 0) <= 160 ? "text-green-500" : "text-yellow-500"}>
                                    {analysis.meta_tags.description_length ?? 0} karakter
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Canonical:</span>
                                <span>{analysis.meta_tags.canonical ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">OG Tags:</span>
                                <span>{analysis.meta_tags.og_title ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</span>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Headings */}
                    {analysis.headings && (
                    <div className="p-4 rounded-lg border bg-card">
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Heading className="w-4 h-4 text-muted-foreground" />
                            Baslik Yapisi
                        </h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">H1 Sayisi:</span>
                                <span className={analysis.headings.has_single_h1 ? "text-green-500" : "text-yellow-500"}>
                                    {analysis.headings.h1_count ?? 0} {analysis.headings.has_single_h1 ? <CheckCircle2 className="w-3 h-3 inline ml-1" /> : <AlertTriangle className="w-3 h-3 inline ml-1" />}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">H2 Sayisi:</span>
                                <span>{analysis.headings.h2?.length ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">H3 Sayisi:</span>
                                <span>{analysis.headings.h3?.length ?? 0}</span>
                            </div>
                            {analysis.headings.h1 && analysis.headings.h1.length > 0 && (
                                <div className="pt-2 border-t">
                                    <span className="text-muted-foreground text-xs block mb-1">H1 Icerigi:</span>
                                    <span className="text-xs">{analysis.headings.h1[0]}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Images */}
                    {analysis.images && (
                    <div className="p-4 rounded-lg border bg-card">
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Image className="w-4 h-4 text-muted-foreground" />
                            Gorseller
                        </h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Gorsel:</span>
                                <span>{analysis.images.total_images ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Alt Metinli:</span>
                                <span className="text-green-500">{analysis.images.images_with_alt ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Alt Metinsiz:</span>
                                <span className={(analysis.images.images_without_alt ?? 0) > 0 ? "text-red-500" : "text-green-500"}>
                                    {analysis.images.images_without_alt ?? 0}
                                </span>
                            </div>
                            {(analysis.images.images_without_alt ?? 0) > 0 && (
                                <div className="pt-2 border-t">
                                    <span className="text-xs text-yellow-500 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {analysis.images.images_without_alt} gorsel alt metni eksik
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Links */}
                    {analysis.links && (
                    <div className="p-4 rounded-lg border bg-card">
                        <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-muted-foreground" />
                            Baglantilar
                        </h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Toplam Link:</span>
                                <span>{analysis.links.total_links ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ic Linkler:</span>
                                <span className="text-blue-500">{analysis.links.internal_links ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dis Linkler:</span>
                                <span className="text-purple-500">{analysis.links.external_links ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nofollow:</span>
                                <span>{analysis.links.nofollow_links ?? 0}</span>
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Schema & Content Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg border bg-card text-center">
                        <div className="text-2xl font-bold">{analysis.word_count ?? 0}</div>
                        <div className="text-xs text-muted-foreground">Kelime Sayisi</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-card text-center">
                        <div className="text-2xl font-bold flex items-center justify-center">
                            {analysis.schema_markup?.has_schema ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-500" />
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">Schema Markup</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-card text-center col-span-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                            {(analysis.schema_markup?.schema_types?.length ?? 0) > 0 ? (
                                analysis.schema_markup!.schema_types.map((type, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                        {type}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">Schema bulunamadi</span>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Schema Turleri</div>
                    </div>
                </div>
            </div>
            )}

            {/* Competitors Analysis */}
            {(report.competitors?.length ?? 0) > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-purple-500">
                        <Users className="w-5 h-5" />
                        Rakip Analizi ({report.competitors.length} rakip)
                    </h4>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold border-b">Domain</th>
                                    <th className="px-4 py-2 text-center font-semibold border-b">SEO Skoru</th>
                                    <th className="px-4 py-2 text-center font-semibold border-b">Kelime</th>
                                    <th className="px-4 py-2 text-center font-semibold border-b">Schema</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.competitors!.map((comp, i) => (
                                    <tr key={i} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="font-medium">{comp.domain}</div>
                                            {comp.title && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={comp.title}>
                                                    {comp.title}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <ScoreIndicator score={comp.seo_score ?? 0} size="sm" />
                                        </td>
                                        <td className="px-4 py-2 text-center text-muted-foreground">
                                            {comp.word_count ?? 0}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {comp.has_schema ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Keyword Recommendations */}
            {(report.keyword_recommendations?.length ?? 0) > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-blue-500">
                        <Target className="w-5 h-5" />
                        Anahtar Kelime Onerileri ({report.keyword_recommendations!.length})
                    </h4>
                    <div className="grid gap-3">
                        {report.keyword_recommendations!.map((kw, i) => (
                            <div key={i} className="p-3 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{kw.keyword}</span>
                                        <CategoryBadge category={kw.category} />
                                        <PriorityBadge priority={kw.priority} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{kw.notes}</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="text-center">
                                        <div className="font-medium text-foreground">{kw.competitor_usage}</div>
                                        <div>Rakip Kullanimm</div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {kw.search_intent === "informational" ? "Bilgilendirme" :
                                         kw.search_intent === "transactional" ? "Islem" : "Navigasyon"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Technical Issues */}
            {(report.technical_issues?.length ?? 0) > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-orange-500">
                        <CircleAlert className="w-5 h-5" />
                        Teknik Sorunlar ({report.technical_issues!.length})
                    </h4>
                    <div className="space-y-3">
                        {report.technical_issues!.map((issue, i) => (
                            <div key={i} className={`p-4 rounded-lg border ${
                                issue.type === "error" ? "bg-red-500/5 border-red-500/20" :
                                issue.type === "warning" ? "bg-yellow-500/5 border-yellow-500/20" :
                                "bg-blue-500/5 border-blue-500/20"
                            }`}>
                                <div className="flex items-start gap-3">
                                    <IssueBadge type={issue.type} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{issue.issue}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            <span className="font-medium">Oneri:</span> {issue.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Recommendations */}
            {(report.content_recommendations?.length ?? 0) > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-green-500">
                        <Lightbulb className="w-5 h-5" />
                        Icerik Onerileri
                    </h4>
                    <div className="grid gap-2">
                        {report.content_recommendations!.map((rec, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 rounded-md bg-green-500/5 border border-green-500/20">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-bold mt-0.5">
                                    {i + 1}
                                </span>
                                <span className="text-sm">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analyzed URLs */}
            {(report.competitor_urls?.length ?? 0) > 0 && (
                <div className="pt-4 border-t space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                        <Link className="w-4 h-4" />
                        Analiz Edilen URL'ler
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {report.competitor_urls!.map((url, i) => {
                            let hostname = url;
                            try {
                                hostname = new URL(url).hostname;
                            } catch {
                                // URL parsing failed, use raw url
                            }
                            return (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1 bg-muted/30 px-2 py-1 rounded"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    {hostname}
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
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
                                            <Badge variant={report.type === "swot" ? "default" : report.type === "instagram_weekly" ? "secondary" : report.type === "custom" || report.type === "seo" ? "outline" : "outline"} className={report.type === "custom" ? "bg-purple-500/10 text-purple-500 border-purple-500/30" : report.type === "seo" ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" : ""}>
                                                {REPORT_TYPE_LABELS[report.type] || report.type}
                                            </Badge>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{report.title}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(isCustomReport(report) ? report.created_at : isSeoReport(report) ? report.created_at : report.createdAt)}</p>
                                                {isCustomReport(report) && report.summary && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{report.summary}</p>
                                                )}
                                                {isCustomReport(report) && report.tags && report.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1.5">
                                                        {report.tags.slice(0, 3).map((tag, i) => (
                                                            <Badge key={i} variant="secondary" className="text-[10px] py-0 h-4">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        {report.tags.length > 3 && (
                                                            <span className="text-[10px] text-muted-foreground">+{report.tags.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
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
                                                ) : isCustomReport(report) ? (
                                                    <CustomReportView report={report} />
                                                ) : isSeoReport(report) ? (
                                                    <SeoReportView report={report} />
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
