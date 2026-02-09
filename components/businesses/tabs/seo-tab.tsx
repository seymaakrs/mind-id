"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  AlertTriangle,
  Users,
  Key,
  Target,
  Info,
  Filter,
  Bot,
  ShieldCheck,
  FileText,
  Quote,
  Radar,
  CheckCircle2,
  XCircle,
  Download,
  Lightbulb,
  ArrowRight,
  Globe,
  BarChart3,
  MinusCircle,
} from "lucide-react";
import { useSeo } from "@/hooks";
import type { SeoKeywordCategory, SeoKeywordPriority, SeoKeywordItem, GeoRecommendation, ScoreBreakdownRecommendation } from "@/types/firebase";
import { exportSeoPdf } from "@/lib/pdf/seo-pdf";

interface SeoTabProps {
  businessId: string;
  businessName?: string;
}

// Category labels
const CATEGORY_LABELS: Record<SeoKeywordCategory, string> = {
  primary: "Birincil",
  secondary: "Ikincil",
  long_tail: "Uzun Kuyruk",
  local: "Yerel",
};

// Priority labels
const PRIORITY_LABELS: Record<SeoKeywordPriority, string> = {
  high: "Yuksek",
  medium: "Orta",
  low: "Dusuk",
};

// Search intent labels
const INTENT_LABELS: Record<string, string> = {
  informational: "Bilgi",
  transactional: "Islem",
  navigational: "Navigasyon",
};

// Priority badge variants
const PRIORITY_VARIANTS: Record<SeoKeywordPriority, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

// Category badge colors
const CATEGORY_COLORS: Record<SeoKeywordCategory, string> = {
  primary: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  secondary: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  long_tail: "bg-green-500/10 text-green-500 border-green-500/20",
  local: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays} gun once`;
  if (diffHours > 0) return `${diffHours} saat once`;
  if (diffMinutes > 0) return `${diffMinutes} dakika once`;
  return "Az once";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500/10";
  if (score >= 60) return "bg-yellow-500/10";
  if (score >= 40) return "bg-orange-500/10";
  return "bg-red-500/10";
}

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
};

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-500 border-red-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  low: "bg-green-500/10 text-green-500 border-green-500/30",
};

const PRIORITY_TR_LABELS: Record<string, string> = {
  high: "Yuksek",
  medium: "Orta",
  low: "Dusuk",
};

function RecommendationCard({ rec }: { rec: GeoRecommendation | ScoreBreakdownRecommendation }) {
  return (
    <div className={`p-3 rounded-lg border border-l-4 ${PRIORITY_BORDER_COLORS[rec.priority] || "border-l-muted"} bg-card`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="secondary" className="text-xs">
              {rec.category}
            </Badge>
            <Badge variant="outline" className={`text-xs ${PRIORITY_BADGE_COLORS[rec.priority] || ""}`}>
              {PRIORITY_TR_LABELS[rec.priority] || rec.priority}
            </Badge>
          </div>
          <p className="text-sm font-medium flex items-start gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            {rec.action}
          </p>
          <p className="text-xs text-muted-foreground mt-1 ml-5">
            {rec.reason}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SeoTab({ businessId, businessName }: SeoTabProps) {
  const { summary, keywords, loading, error, fetchSeoData } = useSeo();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SeoKeywordCategory | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<SeoKeywordPriority | "all">("all");

  useEffect(() => {
    if (businessId) {
      fetchSeoData(businessId);
    }
  }, [businessId, fetchSeoData]);

  // Filter keywords
  const filteredKeywords: SeoKeywordItem[] = keywords?.items?.filter((item) => {
    const matchesSearch = !searchQuery ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  }) || [];

  // Count by category and priority
  const categoryCounts: Record<SeoKeywordCategory, number> = {
    primary: 0,
    secondary: 0,
    long_tail: 0,
    local: 0,
  };
  const priorityCounts: Record<SeoKeywordPriority, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  keywords?.items?.forEach((item) => {
    categoryCounts[item.category]++;
    priorityCounts[item.priority]++;
  });

  const hasData = summary || (keywords && keywords.items?.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SEO Analizi</h3>
          <p className="text-sm text-muted-foreground">
            SEO skorlari ve anahtar kelime analizi
          </p>
        </div>
        <div className="flex gap-2">
          {hasData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSeoPdf(summary, keywords, businessName || "Isletme")}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF Indir
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSeoData(businessId)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Bu isletme icin henuz SEO analizi yapilmamis.</p>
            <p className="text-sm mt-2">
              Dashboard&apos;daki SEO Analizi butonunu kullanarak analiz baslatin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Section */}
          {summary && (
            <>
              {/* Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Overall Score */}
                <Card className={getScoreBgColor(summary.overall_score)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Genel SEO Skoru
                        </p>
                        <p className={`text-3xl font-bold ${getScoreColor(summary.overall_score)}`}>
                          {summary.overall_score}
                          <span className="text-lg text-muted-foreground">/100</span>
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${getScoreBgColor(summary.overall_score)}`}>
                        <TrendingUp className={`w-6 h-6 ${getScoreColor(summary.overall_score)}`} />
                      </div>
                    </div>
                    {summary.last_analysis_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Son analiz: {getRelativeTime(summary.last_analysis_date)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Business SEO Score */}
                <Card className={getScoreBgColor(summary.business_seo_score)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Isletme Site Skoru
                        </p>
                        <p className={`text-3xl font-bold ${getScoreColor(summary.business_seo_score)}`}>
                          {summary.business_seo_score}
                          <span className="text-lg text-muted-foreground">/100</span>
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${getScoreBgColor(summary.business_seo_score)}`}>
                        <Target className={`w-6 h-6 ${getScoreColor(summary.business_seo_score)}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Competitor Comparison */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Rakip Ortalamasi
                        </p>
                        <p className={`text-3xl font-bold ${getScoreColor(summary.competitor_avg_score)}`}>
                          {summary.competitor_avg_score}
                          <span className="text-lg text-muted-foreground">/100</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-muted">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {summary.competitor_count} rakip analiz edildi
                    </p>
                  </CardContent>
                </Card>

                {/* SERP Visibility Score */}
                {summary.serp_visibility_score != null && (
                  <Card className={getScoreBgColor(summary.serp_visibility_score)}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            SERP Gorunurluk
                          </p>
                          <p className={`text-3xl font-bold ${getScoreColor(summary.serp_visibility_score)}`}>
                            {summary.serp_visibility_score}
                            <span className="text-lg text-muted-foreground">/100</span>
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${getScoreBgColor(summary.serp_visibility_score)}`}>
                          <Globe className={`w-6 h-6 ${getScoreColor(summary.serp_visibility_score)}`} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Arama sonuc sayfasi gorunurlugu
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* GEO Readiness Score */}
                {summary.geo_readiness_score != null && (
                  <Card className={getScoreBgColor(summary.geo_readiness_score)}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            GEO Hazirlik Skoru
                          </p>
                          <p className={`text-3xl font-bold ${getScoreColor(summary.geo_readiness_score)}`}>
                            {summary.geo_readiness_score}
                            <span className="text-lg text-muted-foreground">/100</span>
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${getScoreBgColor(summary.geo_readiness_score)}`}>
                          <Bot className={`w-6 h-6 ${getScoreColor(summary.geo_readiness_score)}`} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        AI arama motoru uyumlulugu
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* GEO Analysis Breakdown */}
              {summary.geo_analysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      GEO Analiz Detaylari
                    </CardTitle>
                    <CardDescription>
                      AI arama motorlarinda alintilanabilirlik analizi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* AI Crawler Access */}
                      {summary.geo_analysis.ai_crawler_access && (
                      <div className="p-4 rounded-lg border bg-card space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            AI Bot Erisimi
                          </h5>
                          <Badge variant="outline" className={getScoreColor(
                            (summary.geo_analysis.ai_crawler_access.score / summary.geo_analysis.ai_crawler_access.max) * 100
                          )}>
                            {summary.geo_analysis.ai_crawler_access.score}/{summary.geo_analysis.ai_crawler_access.max}
                          </Badge>
                        </div>
                        {(summary.geo_analysis.ai_crawler_access.bots_allowed?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Izin Verilen:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summary.geo_analysis.ai_crawler_access.bots_allowed.map((bot, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {bot}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(summary.geo_analysis.ai_crawler_access.bots_blocked?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Engellenen:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summary.geo_analysis.ai_crawler_access.bots_blocked.map((bot, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-red-500/10 text-red-500">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {bot}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(summary.geo_analysis.ai_crawler_access.bots_not_mentioned?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Belirtilmemis:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summary.geo_analysis.ai_crawler_access.bots_not_mentioned.map((bot, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {bot}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      )}

                      {/* Content Structure */}
                      {summary.geo_analysis.content_structure && (
                      <div className="p-4 rounded-lg border bg-card space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            Icerik Yapisi
                          </h5>
                          <Badge variant="outline" className={getScoreColor(
                            (summary.geo_analysis.content_structure.score / summary.geo_analysis.content_structure.max) * 100
                          )}>
                            {summary.geo_analysis.content_structure.score}/{summary.geo_analysis.content_structure.max}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">FAQ Bolumu:</span>
                            <span>{summary.geo_analysis.content_structure.has_faq_section ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">FAQ Schema:</span>
                            <span>{summary.geo_analysis.content_structure.faq_schema ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tablo Sayisi:</span>
                            <span>{summary.geo_analysis.content_structure.tables_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Liste Sayisi:</span>
                            <span>{summary.geo_analysis.content_structure.lists_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Soru Basliklari:</span>
                            <span>{summary.geo_analysis.content_structure.question_headings_count}</span>
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Citation Data */}
                      {summary.geo_analysis.citation_data && (
                      <div className="p-4 rounded-lg border bg-card space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold flex items-center gap-2">
                            <Quote className="w-4 h-4 text-orange-500" />
                            Alinti Verileri
                          </h5>
                          <Badge variant="outline" className={getScoreColor(
                            (summary.geo_analysis.citation_data.score / summary.geo_analysis.citation_data.max) * 100
                          )}>
                            {summary.geo_analysis.citation_data.score}/{summary.geo_analysis.citation_data.max}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dis Alinti:</span>
                            <span>{summary.geo_analysis.citation_data.external_citations}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Alinti Yogunlugu (1K):</span>
                            <span>{summary.geo_analysis.citation_data.citation_density_per_1k?.toFixed(1) ?? 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Istatistik Sayisi:</span>
                            <span>{summary.geo_analysis.citation_data.statistics_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Istatistik Yogunlugu (1K):</span>
                            <span>{summary.geo_analysis.citation_data.statistics_density_per_1k?.toFixed(1) ?? 0}</span>
                          </div>
                        </div>
                      </div>
                      )}

                      {/* AI Discovery */}
                      {summary.geo_analysis.ai_discovery && (
                      <div className="p-4 rounded-lg border bg-card space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold flex items-center gap-2">
                            <Radar className="w-4 h-4 text-cyan-500" />
                            AI Kesfedilebilirlik
                          </h5>
                          <Badge variant="outline" className={getScoreColor(
                            (summary.geo_analysis.ai_discovery.score / summary.geo_analysis.ai_discovery.max) * 100
                          )}>
                            {summary.geo_analysis.ai_discovery.score}/{summary.geo_analysis.ai_discovery.max}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">llms.txt:</span>
                            <span>{summary.geo_analysis.ai_discovery.has_llms_txt ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</span>
                          </div>
                        </div>
                        {(summary.geo_analysis.ai_discovery.geo_schema_types_present?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Mevcut Schema:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summary.geo_analysis.ai_discovery.geo_schema_types_present.map((t, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(summary.geo_analysis.ai_discovery.geo_schema_types_missing?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Eksik Schema:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summary.geo_analysis.ai_discovery.geo_schema_types_missing.map((t, i) => (
                                <Badge key={i} variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(summary.geo_analysis.ai_discovery.freshness_signals?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Guncellik Sinyalleri:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summary.geo_analysis.ai_discovery.freshness_signals.map((s, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      )}
                    </div>

                    {/* GEO Recommendations */}
                    {(summary.geo_analysis.recommendations?.length ?? 0) > 0 && (
                      <div className="mt-4 space-y-3">
                        <h5 className="text-sm font-semibold flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-cyan-500" />
                          GEO Onerileri
                          <Badge variant="secondary" className="text-xs">{summary.geo_analysis.recommendations!.length}</Badge>
                        </h5>
                        <div className="grid gap-2">
                          {summary.geo_analysis.recommendations!.map((rec, i) => (
                            <RecommendationCard key={i} rec={rec} />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Score Breakdown Details */}
              {summary.score_breakdown && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Skor Kirilimi
                    </CardTitle>
                    <CardDescription>
                      Ham skor: {summary.score_breakdown.raw_score} / Toplam skor: {summary.score_breakdown.total_score}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Breakdown Categories */}
                    {summary.score_breakdown.breakdown && Object.keys(summary.score_breakdown.breakdown).length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-muted-foreground">Kategori Puanlari</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(summary.score_breakdown.breakdown).map(([key, val]) => {
                            const value = val as Record<string, unknown> | number;
                            const score = typeof value === "number" ? value : (value as Record<string, unknown>)?.score as number | undefined;
                            const max = typeof value === "object" ? (value as Record<string, unknown>)?.max as number | undefined : undefined;
                            const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

                            return (
                              <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                                <span className="text-sm truncate mr-2">{label}</span>
                                {score != null ? (
                                  <span className={`text-sm font-bold ${getScoreColor(max ? (score / max) * 100 : score)}`}>
                                    {score}{max ? `/${max}` : ""}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{JSON.stringify(val)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Penalties */}
                    {(summary.score_breakdown.penalties?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold flex items-center gap-1.5 text-red-500">
                          <MinusCircle className="w-3.5 h-3.5" />
                          Ceza Puanlari
                        </h5>
                        <div className="space-y-1.5">
                          {summary.score_breakdown.penalties.map((penalty, i) => {
                            const p = penalty as Record<string, unknown>;
                            const reason = p?.reason as string | undefined;
                            const points = p?.points as number | undefined;
                            return (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-red-500/20 bg-red-500/5">
                                <span className="text-sm">{reason || JSON.stringify(penalty)}</span>
                                {points != null && (
                                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/30">
                                    -{points}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {(summary.score_breakdown.recommendations?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold flex items-center gap-1.5 text-yellow-500">
                          <Lightbulb className="w-3.5 h-3.5" />
                          SEO Iyilestirme Onerileri
                          <Badge variant="secondary" className="text-xs">{summary.score_breakdown.recommendations!.length}</Badge>
                        </h5>
                        <div className="grid gap-2">
                          {summary.score_breakdown.recommendations!.map((rec, i) => (
                            <RecommendationCard key={i} rec={rec} />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Top Keywords & Issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Keywords */}
                {summary.top_keywords && summary.top_keywords.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        En Onemli Anahtar Kelimeler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {summary.top_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Issues */}
                {summary.main_issues && summary.main_issues.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Duzeltilmesi Gereken Sorunlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {summary.main_issues.map((issue, index) => (
                          <li
                            key={index}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-yellow-500 mt-0.5">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Keywords Section */}
          {keywords && keywords.items && keywords.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Anahtar Kelime Analizi
                </CardTitle>
                <CardDescription>
                  {keywords.total_count} anahtar kelime analiz edildi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(categoryCounts) as SeoKeywordCategory[]).map((category) => (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border ${CATEGORY_COLORS[category]} cursor-pointer transition-opacity ${categoryFilter === category ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setCategoryFilter(categoryFilter === category ? "all" : category)}
                    >
                      <p className="text-xs font-medium">{CATEGORY_LABELS[category]}</p>
                      <p className="text-xl font-bold">{categoryCounts[category]}</p>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Anahtar kelime ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => setCategoryFilter(v as SeoKeywordCategory | "all")}
                    >
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tum Kategoriler</SelectItem>
                        {(Object.keys(CATEGORY_LABELS) as SeoKeywordCategory[]).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={priorityFilter}
                      onValueChange={(v) => setPriorityFilter(v as SeoKeywordPriority | "all")}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Oncelik" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tum Oncelikler</SelectItem>
                        {(Object.keys(PRIORITY_LABELS) as SeoKeywordPriority[]).map((pri) => (
                          <SelectItem key={pri} value={pri}>
                            {PRIORITY_LABELS[pri]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Keywords Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anahtar Kelime</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Arama Amaci</TableHead>
                        <TableHead>Oncelik</TableHead>
                        <TableHead className="text-center">Rakip Kullanimi</TableHead>
                        <TableHead>Notlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKeywords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {searchQuery || categoryFilter !== "all" || priorityFilter !== "all"
                              ? "Filtrelere uyan anahtar kelime bulunamadi."
                              : "Henuz anahtar kelime verisi yok."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredKeywords.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.keyword}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={CATEGORY_COLORS[item.category]}
                              >
                                {CATEGORY_LABELS[item.category]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {INTENT_LABELS[item.search_intent] || item.search_intent}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={PRIORITY_VARIANTS[item.priority]}>
                                {PRIORITY_LABELS[item.priority]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3 text-muted-foreground" />
                                {item.competitor_usage}
                              </span>
                            </TableCell>
                            <TableCell>
                              {item.notes ? (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  {item.notes}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Results count */}
                {filteredKeywords.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {filteredKeywords.length} / {keywords.items.length} anahtar kelime gosteriliyor
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Last update info */}
          {(summary?.updated_at || keywords?.updated_at) && (
            <p className="text-xs text-muted-foreground text-right">
              Son guncelleme: {formatDate(summary?.updated_at || keywords?.updated_at || "")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
