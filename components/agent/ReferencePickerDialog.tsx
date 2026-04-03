"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Image as ImageIcon, FileText, Calendar, CheckCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBusinessMedia, useReports, useContentPlans } from "@/hooks";
import { getBusinessTasks } from "@/lib/firebase/firestore";
import { useReferenceQueue } from "@/contexts/ReferenceQueueContext";
import {
  mediaToReference,
  reportToReference,
  contentPlanToReference,
  taskToReference,
  REFERENCE_TYPE_LABELS,
} from "@/types/references";
import { REPORT_TYPE_LABELS } from "@/types/reports";
import { PLAN_STATUS_LABELS } from "@/types/content-plan";
import type { ReferenceItem } from "@/types/references";
import type { Task } from "@/types/tasks";

interface ReferencePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

type TabType = "media" | "reports" | "content_plans" | "tasks";

export function ReferencePickerDialog({ open, onOpenChange, businessId }: ReferencePickerDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("media");
  const [selectedInDialog, setSelectedInDialog] = useState<ReferenceItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const { hasReference, addReferences } = useReferenceQueue();
  const { filteredMedia, loading: loadingMedia, loadMedia } = useBusinessMedia();
  const { reports, loading: loadingReports, fetchReports } = useReports();
  const { plans, loading: loadingPlans, fetchPlans } = useContentPlans();

  // Load data when dialog opens or tab changes
  useEffect(() => {
    if (!open || !businessId) return;
    if (activeTab === "media") loadMedia(businessId);
    if (activeTab === "reports") fetchReports(businessId);
    if (activeTab === "content_plans") fetchPlans(businessId);
    if (activeTab === "tasks") {
      setLoadingTasks(true);
      getBusinessTasks(businessId)
        .then((all) => {
          const completed = all
            .filter((t) => t.status === "completed" || t.status === "failed")
            .sort((a, b) => {
              const aT = (a.createdAt as unknown as { seconds: number })?.seconds ?? 0;
              const bT = (b.createdAt as unknown as { seconds: number })?.seconds ?? 0;
              return bT - aT;
            });
          setTasks(completed);
        })
        .catch(() => setTasks([]))
        .finally(() => setLoadingTasks(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, businessId]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) setSelectedInDialog([]);
  }, [open]);

  const isSelectedInDialog = (type: string, id: string) =>
    selectedInDialog.some((r) => r.type === type && r.id === id);

  const toggleItem = useCallback((item: ReferenceItem) => {
    // Already in global queue — skip
    if (hasReference(item.type, item.id)) return;

    setSelectedInDialog((prev) => {
      const exists = prev.some((r) => r.type === item.type && r.id === item.id);
      if (exists) return prev.filter((r) => !(r.type === item.type && r.id === item.id));
      return [...prev, item];
    });
  }, [hasReference]);

  const handleAdd = () => {
    if (selectedInDialog.length > 0) {
      addReferences(selectedInDialog);
    }
    onOpenChange(false);
  };

  const tabLabels: Record<TabType, string> = {
    media: REFERENCE_TYPE_LABELS.media,
    reports: REFERENCE_TYPE_LABELS.report,
    content_plans: REFERENCE_TYPE_LABELS.content_plan,
    tasks: REFERENCE_TYPE_LABELS.task_result,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
          <DialogTitle>Referans Ekle</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-6 border-b border-border shrink-0 overflow-x-auto">
            <TabsList className="h-9 bg-transparent p-0 gap-0 w-max">
              {(Object.keys(tabLabels) as TabType[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs"
                >
                  {tabLabels[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {/* Medya */}
            <TabsContent value="media" className="mt-0">
              {loadingMedia ? (
                <LoadingSpinner />
              ) : filteredMedia.length === 0 ? (
                <EmptyState label="Medya bulunamadi." />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {filteredMedia.map((m) => {
                    const ref = mediaToReference(m, businessId);
                    const inQueue = hasReference("media", m.id);
                    const selected = isSelectedInDialog("media", m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleItem(ref)}
                        disabled={inQueue}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                          inQueue
                            ? "border-primary/50 opacity-50 cursor-default"
                            : selected
                              ? "border-primary"
                              : "border-transparent hover:border-border"
                        }`}
                      >
                        {m.type === "image" ? (
                          <img src={m.public_url} alt={m.file_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">Video</span>
                          </div>
                        )}
                        {(selected || inQueue) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Raporlar */}
            <TabsContent value="reports" className="mt-0">
              {loadingReports ? (
                <LoadingSpinner />
              ) : reports.length === 0 ? (
                <EmptyState label="Rapor bulunamadi." />
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => {
                    const ref = reportToReference(r, businessId);
                    const inQueue = hasReference("report", r.id);
                    const selected = isSelectedInDialog("report", r.id);
                    return (
                      <PickerItem
                        key={r.id}
                        icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                        label={r.title}
                        badge={REPORT_TYPE_LABELS[r.type]}
                        inQueue={inQueue}
                        selected={selected}
                        onToggle={() => toggleItem(ref)}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* İçerik Planları */}
            <TabsContent value="content_plans" className="mt-0">
              {loadingPlans ? (
                <LoadingSpinner />
              ) : plans.length === 0 ? (
                <EmptyState label="Icerik plani bulunamadi." />
              ) : (
                <div className="space-y-2">
                  {plans.map((p) => {
                    const ref = contentPlanToReference(p, businessId);
                    const inQueue = hasReference("content_plan", p.plan_id);
                    const selected = isSelectedInDialog("content_plan", p.plan_id);
                    return (
                      <PickerItem
                        key={p.plan_id}
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        label={`${p.start_date} — ${p.end_date}`}
                        badge={PLAN_STATUS_LABELS[p.status]}
                        inQueue={inQueue}
                        selected={selected}
                        onToggle={() => toggleItem(ref)}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Geçmiş Görevler */}
            <TabsContent value="tasks" className="mt-0">
              {loadingTasks ? (
                <LoadingSpinner />
              ) : tasks.length === 0 ? (
                <EmptyState label="Tamamlanmis gorev bulunamadi." />
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => {
                    const ref = taskToReference(t, businessId);
                    const inQueue = hasReference("task_result", t.id);
                    const selected = isSelectedInDialog("task_result", t.id);
                    const date = (t.createdAt as unknown as { seconds: number })?.seconds
                      ? new Date((t.createdAt as unknown as { seconds: number }).seconds * 1000).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                      : "";
                    return (
                      <PickerItem
                        key={t.id}
                        icon={<CheckCircle className="w-4 h-4 text-muted-foreground" />}
                        label={t.task}
                        badge={date}
                        inQueue={inQueue}
                        selected={selected}
                        onToggle={() => toggleItem(ref)}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground">
            {selectedInDialog.length > 0
              ? `${selectedInDialog.length} oge secildi`
              : "Eklemek istediginiz ogeleri secin"}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Iptal
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={selectedInDialog.length === 0}>
              Ekle {selectedInDialog.length > 0 && `(${selectedInDialog.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs text-muted-foreground text-center py-12">{label}</p>
  );
}

interface PickerItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  inQueue: boolean;
  selected: boolean;
  onToggle: () => void;
}

function PickerItem({ icon, label, badge, inQueue, selected, onToggle }: PickerItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={inQueue}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
        inQueue
          ? "border-primary/30 bg-primary/5 opacity-60 cursor-default"
          : selected
            ? "border-primary bg-primary/5"
            : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        {badge && <span className="text-[10px] text-muted-foreground">{badge}</span>}
      </div>
      {(selected || inQueue) && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {!selected && !inQueue && (
        <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
      )}
    </button>
  );
}
