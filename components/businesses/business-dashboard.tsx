"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Building2,
  Info,
  FolderOpen,
  Calendar,
  Brain,
  BarChart3,
  Clock,
} from "lucide-react";
import { useBusinesses } from "@/hooks";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import {
  BusinessDetailsTab,
  BusinessMediaTab,
  ContentPlansTab,
  AgentMemoryTab,
  StatisticsTab,
  JobsTab,
} from "./tabs";
import type { Business } from "@/types/firebase";

interface BusinessDashboardProps {
  initialBusinessId?: string;
  onBusinessChange?: (business: Business | null) => void;
}

type TabValue = "details" | "media" | "plans" | "memory" | "jobs" | "stats";

export default function BusinessDashboard({
  initialBusinessId,
  onBusinessChange,
}: BusinessDashboardProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(initialBusinessId || "");
  const [activeTab, setActiveTab] = useState<TabValue>("details");

  const { businesses, loading: loadingBusinesses } = useBusinesses();

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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Isletme Secin:</label>
            {loadingBusinesses ? (
              <div className="flex items-center gap-2 text-muted-foreground">
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
                className="w-full max-w-md"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Content */}
      {selectedBusinessId && selectedBusiness ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details" className="gap-2">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Detaylar</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Icerikler</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Planlar</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Hafiza</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Gorevler</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Istatistikler</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="details" className="m-0">
              <BusinessDetailsTab
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

            <TabsContent value="stats" className="m-0">
              <StatisticsTab businessId={selectedBusinessId} />
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
    </div>
  );
}
