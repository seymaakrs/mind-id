"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    FileText,
    Trash2,
    RefreshCw,
    Target,
    Sparkles,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useReports, useAgentTask } from "@/hooks";
import { REPORT_TYPE_LABELS } from "@/types/reports";
import type { Report } from "@/types/reports";

interface ReportsTabProps {
    businessId: string;
}

export function ReportsTab({ businessId }: ReportsTabProps) {
    const [swotDialogOpen, setSwotDialogOpen] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

    const {
        reports,
        loading: loadingReports,
        error: reportsError,
        fetchReports,
        removeReport,
    } = useReports();

    const {
        loading: analyzing,
        error: analysisError,
        progressMessages,
        sendTask,
        reset: resetAgent,
    } = useAgentTask();

    // Fetch reports when businessId changes
    useEffect(() => {
        if (businessId) {
            fetchReports(businessId);
        }
    }, [businessId, fetchReports]);

    const handleOpenSwotDialog = () => {
        setWebsiteUrl("");
        resetAgent();
        setSwotDialogOpen(true);
    };

    const handleSwotAnalysis = async () => {
        const taskPrompt = websiteUrl.trim()
            ? `Bu isletme icin SWOT analizi yap. Web sitesi: ${websiteUrl}`
            : `Bu isletme icin SWOT analizi yap.`;

        const result = await sendTask({
            task: taskPrompt,
            businessId,
            extras: websiteUrl.trim() ? { website_url: websiteUrl, analysis_type: "swot" } : { analysis_type: "swot" },
        });

        if (result) {
            setSwotDialogOpen(false);
            // Refresh reports list
            await fetchReports(businessId);
        }
    };

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
                    <Button variant="outline" onClick={handleOpenSwotDialog} disabled={analyzing}>
                        <Target className="w-4 h-4 mr-2" />
                        SWOT Analizi
                    </Button>
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

            {/* SWOT Analysis Dialog */}
            <Dialog open={swotDialogOpen} onOpenChange={setSwotDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            SWOT Analizi
                        </DialogTitle>
                        <DialogDescription>
                            Isletme icin guclu/zayif yonler, firsatlar ve tehditler analizi yapilacak.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="swotUrl">Web Sitesi URL (Opsiyonel)</Label>
                            <Input
                                id="swotUrl"
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://example.com"
                                disabled={analyzing}
                            />
                            <p className="text-xs text-muted-foreground">
                                Web sitesi girilirse, site icerigi de analiz edilir.
                            </p>
                        </div>

                        {analyzing && progressMessages.length > 0 && (
                            <div className="p-3 rounded-md bg-muted font-mono text-xs max-h-[150px] overflow-y-auto space-y-1">
                                {progressMessages.map((msg, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-muted-foreground">
                                            [{new Date(msg.timestamp).toLocaleTimeString()}]
                                        </span>
                                        <span>{msg.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {analysisError && (
                            <p className="text-sm text-destructive">{analysisError}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSwotDialogOpen(false)}
                            disabled={analyzing}
                        >
                            Iptal
                        </Button>
                        <Button onClick={handleSwotAnalysis} disabled={analyzing}>
                            {analyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analiz Ediliyor...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Analizi Baslat
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            <p className="text-sm mt-2">SWOT Analizi yaparak baslayabilirsiniz.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((report) => (
                                <div key={report.id} className="border rounded-lg overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                                        onClick={() => toggleExpandReport(report.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant={report.type === "swot" ? "default" : "secondary"}>
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
                                                className="text-destructive hover:text-destructive"
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
                                        <div className="px-4 pb-4 border-t bg-muted/30">
                                            <div className="pt-4 prose prose-sm max-w-none dark:prose-invert">
                                                <pre className="whitespace-pre-wrap text-sm bg-background p-3 rounded-md">
                                                    {report.content}
                                                </pre>
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
