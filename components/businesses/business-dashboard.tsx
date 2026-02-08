"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Info,
  FolderOpen,
  Calendar,
  Brain,
  BarChart3,
  Clock,
  ListChecks,
  Instagram,
  FileBarChart,
  Sparkles,
  Target,
  Globe,
  Search,
  Wrench,
} from "lucide-react";
import { useBusinesses, useAgentTask } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import {
  BusinessDetailsTab,
  BusinessMediaTab,
  ContentPlansTab,
  AgentMemoryTab,
  StatisticsTab,
  JobsTab,
  TasksTab,
  InstagramPostsTab,
  ReportsTab,
  SeoTab,
} from "./tabs";
import type { Business } from "@/types/firebase";

interface BusinessDashboardProps {
  initialBusinessId?: string;
  onBusinessChange?: (business: Business | null) => void;
}

type TabValue = "details" | "media" | "plans" | "memory" | "jobs" | "tasks" | "stats" | "instagram" | "reports" | "seo";

export default function BusinessDashboard({
  initialBusinessId,
  onBusinessChange,
}: BusinessDashboardProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(initialBusinessId || "");
  const [activeTab, setActiveTab] = useState<TabValue>("details");

  const { user } = useAuth();
  const { businesses, loading: loadingBusinesses } = useBusinesses();

  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    loading: analyzing,
    error: analysisError,
    progressMessages,
    sendTask,
    reset: resetAgent,
  } = useAgentTask();

  // Functions
  const handleOpenAnalyze = () => {
    setWebsiteUrl("");
    resetAgent();
    setHata(null);
    setAnalyzeDialogOpen(true);
  };



  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      setHata("Web sitesi URL'si zorunludur.");
      return;
    }
    setHata(null);
    const taskPrompt = `Bu isletmenin web sitesini analiz et ve profil bilgilerini guncelle: ${websiteUrl}`;
    const result = await sendTask({
      task: taskPrompt,
      businessId: selectedBusinessId,
      createdBy: user?.displayName || user?.email || undefined,
      extras: { website_url: websiteUrl },
    });
    if (result) {
      setAnalyzeDialogOpen(false);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleSwotAnalysis = async () => {
    if (analyzing) return;

    resetAgent();
    setHata(null);

    // Switch to reports tab immediately to show loading state or results
    setActiveTab("reports");

    const taskPrompt = `Bu isletme icin SWOT analizi yap.`;

    // Note: We don't wait for result here because sendTask handles the async process
    // and we want to show the reports tab where the user can see new reports appearing
    await sendTask({
      task: taskPrompt,
      businessId: selectedBusinessId,
      createdBy: user?.displayName || user?.email || undefined,
      extras: { analysis_type: "swot" },
    });

    // Refresh reports list
    setRefreshKey((prev) => prev + 1);
  };

  const handleSeoAnalysis = async () => {
    if (analyzing) return;

    resetAgent();
    setHata(null);

    // Switch to reports tab immediately to show loading state or results
    setActiveTab("reports");

    const taskPrompt = `Isletmenin websitesini inceleyerek SEO analizi yap.`;

    await sendTask({
      task: taskPrompt,
      businessId: selectedBusinessId,
      createdBy: user?.displayName || user?.email || undefined,
      extras: { analysis_type: "seo" },
    });

    // Refresh reports list
    setRefreshKey((prev) => prev + 1);
  };

  // Sync with initialBusinessId when it changes
  useEffect(() => {
    if (initialBusinessId && initialBusinessId !== selectedBusinessId) {
      setSelectedBusinessId(initialBusinessId);
    }
  }, [initialBusinessId]);

  // Find selected business
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId) || null;

  // Notify parent when business changes
  useEffect(() => {
    onBusinessChange?.(selectedBusiness);
  }, [selectedBusiness, onBusinessChange]);

  const handleBusinessSelect = (id: string) => {
    setSelectedBusinessId(id);
    // Reset to details tab when business changes
    setActiveTab("details");
  };

  const handleBusinessUpdated = (updated: Business) => {
    // The businesses list will be updated via the hook
    onBusinessChange?.(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold">Isletme Dashboard</h2>
          <p className="text-muted-foreground">
            Isletme bilgilerini, iceriklerini ve planlarini yonetin
          </p>
        </div>
      </div>

      {/* Business Selector */}
      {/* Business Selector & Quick Stats */}
      <Card className="border-muted bg-muted/10">
        <CardContent className="p-6">
          <div className="flex flex-col xl:flex-row gap-6 xl:items-center justify-between">
            {/* Left: Selector */}
            <div className="flex flex-col gap-3 w-full max-w-md">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Aktif Isletme
              </label>
              {loadingBusinesses ? (
                <div className="flex items-center gap-2 text-muted-foreground h-10 px-3 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Yukleniyor...</span>
                </div>
              ) : (
                <BusinessSelector
                  businesses={businesses}
                  loading={loadingBusinesses}
                  selectedId={selectedBusinessId}
                  onSelect={handleBusinessSelect}
                  showPreview
                  className="w-full"
                />
              )}
            </div>

            {/* Right: Tools */}
            {selectedBusiness && (
              <div className="flex flex-col gap-2 mt-4 xl:mt-0">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Wrench className="w-3 h-3" />
                  Araclar
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Website Analysis Action */}
                  <div
                    className="bg-background border rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 shadow-sm cursor-pointer hover:bg-accent transition-colors group"
                    onClick={handleOpenAnalyze}
                  >
                    <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors shrink-0">
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-semibold whitespace-nowrap">Site Analizi</p>
                      <p className="text-xs sm:text-sm font-medium text-primary flex items-center gap-1">
                        Analiz Et <Sparkles className="w-3 h-3 shrink-0 hidden sm:inline" />
                      </p>
                    </div>
                  </div>

                  {/* SEO Analysis Action */}
                  <div
                    className={`bg-background border rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 shadow-sm cursor-pointer hover:bg-accent transition-colors group ${analyzing ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={handleSeoAnalysis}
                  >
                    <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors shrink-0">
                      {analyzing ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-semibold whitespace-nowrap">SEO</p>
                      <p className="text-xs sm:text-sm font-medium text-primary truncate">
                        {analyzing ? "Analiz..." : "Analiz Et"}
                      </p>
                    </div>
                  </div>

                  {/* SWOT Analysis Action */}
                  <div
                    className={`bg-background border rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 shadow-sm cursor-pointer hover:bg-accent transition-colors group ${analyzing ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={handleSwotAnalysis}
                  >
                    <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors shrink-0">
                      {analyzing ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 animate-spin" />
                      ) : (
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-semibold">SWOT</p>
                      <p className="text-xs sm:text-sm font-medium text-primary truncate">
                        {analyzing ? "Analiz..." : "Analiz Et"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Content */}
      {selectedBusinessId && selectedBusiness ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          {/* Desktop: Grid layout */}
          <TabsList className="hidden md:grid w-full grid-cols-10">
            <TabsTrigger value="details" className="gap-2">
              <Info className="w-4 h-4" />
              <span>Detaylar</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>Icerikler</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span>Planlar</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-2">
              <Brain className="w-4 h-4" />
              <span>Hafiza</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Clock className="w-4 h-4" />
              <span>Gorevler</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListChecks className="w-4 h-4" />
              <span>Gecmis</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Istatistikler</span>
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileBarChart className="w-4 h-4" />
              <span>Raporlar</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="w-4 h-4" />
              <span>SEO</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2 scrollbar-thin">
            <TabsList className="inline-flex w-max gap-1">
              <TabsTrigger value="details" className="min-w-[44px] px-3">
                <Info className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="media" className="min-w-[44px] px-3">
                <FolderOpen className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="plans" className="min-w-[44px] px-3">
                <Calendar className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="memory" className="min-w-[44px] px-3">
                <Brain className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="jobs" className="min-w-[44px] px-3">
                <Clock className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="tasks" className="min-w-[44px] px-3">
                <ListChecks className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="stats" className="min-w-[44px] px-3">
                <BarChart3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="instagram" className="min-w-[44px] px-3">
                <Instagram className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="reports" className="min-w-[44px] px-3">
                <FileBarChart className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="seo" className="min-w-[44px] px-3">
                <Search className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="details" className="m-0">
              <BusinessDetailsTab
                key={`details-${refreshKey}`}
                business={selectedBusiness}
                onUpdated={handleBusinessUpdated}
              />
            </TabsContent>

            <TabsContent value="media" className="m-0">
              <BusinessMediaTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="plans" className="m-0">
              <ContentPlansTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="memory" className="m-0">
              <AgentMemoryTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="jobs" className="m-0">
              <JobsTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="tasks" className="m-0">
              <TasksTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="stats" className="m-0">
              <StatisticsTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="instagram" className="m-0">
              <InstagramPostsTab businessId={selectedBusinessId} />
            </TabsContent>

            <TabsContent value="reports" className="m-0">
              <ReportsTab key={`reports-${refreshKey}`} businessId={selectedBusinessId} businessName={selectedBusiness?.name} />
            </TabsContent>

            <TabsContent value="seo" className="m-0">
              <SeoTab businessId={selectedBusinessId} businessName={selectedBusiness?.name} />
            </TabsContent>
          </div>
        </Tabs>
      ) : selectedBusinessId && !selectedBusiness ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Dashboard&apos;i kullanmak icin bir isletme secin.</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Dialog */}
      <Dialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Web Sitesi Analizi
            </DialogTitle>
            <DialogDescription>
              Web sitesini analiz ederek profil bilgilerini otomatik doldurun.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Web Sitesi URL'si *</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={analyzing}
              />
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

            {(analysisError || hata) && (
              <p className="text-sm text-destructive">{analysisError || hata}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAnalyzeDialogOpen(false)}
              disabled={analyzing}
            >
              Iptal
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analiz Et
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}
