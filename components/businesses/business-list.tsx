"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Eye,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  Sparkles,
} from "lucide-react";
import { useBusinesses } from "@/hooks";
import { PROFILE_LABELS } from "@/lib/constants/business";
import type { Business } from "@/types/firebase";
import type { FormSubmission } from "@/types/form-invite";

type TabFilter = "approved" | "pending" | "archived";

interface BusinessListComponentProps {
  onBusinessSelect?: (business: Business) => void;
}

export default function BusinessListComponent({ onBusinessSelect }: BusinessListComponentProps) {
  const {
    businesses,
    loading,
    error,
    loadBusinesses,
    editBusiness,
    removeBusiness,
  } = useBusinesses();

  const [activeTab, setActiveTab] = useState<TabFilter>("approved");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Submissions state
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const getAuthToken = useCallback(async () => {
    const firebaseUser = (await import("@/lib/firebase/config")).auth?.currentUser;
    return firebaseUser?.getIdToken() || null;
  }, []);

  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("/api/form-submission?status=submitted", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Başvurular yüklenirken hata:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const approvedBusinesses = businesses.filter(
    (b) => !b.status || b.status === "approved"
  );
  const archivedBusinesses = businesses.filter((b) => b.status === "archived");

  const filterBySearch = (list: Business[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.name?.toLowerCase().includes(q));
  };

  const visibleApproved = filterBySearch(approvedBusinesses);
  const visibleArchived = filterBySearch(archivedBusinesses);

  const handleBusinessClick = (business: Business) => {
    if (onBusinessSelect) {
      onBusinessSelect(business);
    }
  };

  const handleArchive = async (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    setActionLoading(business.id);
    try {
      await editBusiness(business.id, { status: "archived" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnarchive = async (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    setActionLoading(business.id);
    try {
      await editBusiness(business.id, { status: "approved" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    try {
      await removeBusiness(confirmDelete.id);
      setConfirmDelete(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation();
    setActionLoading(submissionId);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("/api/form-submission/approve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId }),
      });

      const result = await res.json();
      if (result.success) {
        // Remove from submissions list and reload businesses
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
        loadBusinesses();
      }
    } catch (err) {
      console.error("Onaylama hatası:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation();
    if (!confirm("Bu başvuruyu reddetmek istediğinize emin misiniz?")) return;
    setActionLoading(submissionId);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("/api/form-submission", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId }),
      });

      const result = await res.json();
      if (result.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      }
    } catch (err) {
      console.error("Reddetme hatası:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    loadBusinesses();
    loadSubmissions();
  };

  const isLoading = loading || submissionsLoading;

  return (
    <div className="space-y-6">
      {/* Header card with gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                İşletme Listesi
                <Sparkles className="w-4 h-4 text-primary/70" />
              </h2>
              <p className="text-sm text-muted-foreground">
                {approvedBusinesses.length} aktif
                {submissions.length > 0 && ` · ${submissions.length} bekleyen başvuru`}
                {archivedBusinesses.length > 0 && ` · ${archivedBusinesses.length} arşiv`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="İşletme ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-lg bg-background/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs - segmented control */}
      <div className="inline-flex p-1 rounded-xl bg-muted/40 border border-border/60">
        {([
          { key: "approved", label: "Onaylanmış", count: approvedBusinesses.length, icon: CheckCircle2 },
          { key: "pending", label: "Bekleyen", count: submissions.length, icon: Clock },
          { key: "archived", label: "Arşiv", count: archivedBusinesses.length, icon: Archive },
        ] as const).map(({ key, label, count, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs ${
                active ? "bg-primary/15 text-primary" : "bg-muted/60"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "approved" ? (
        visibleApproved.length === 0 ? (
          <EmptyState text={searchQuery ? "Eşleşen işletme yok." : "Henüz kayıtlı işletme bulunmuyor."} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleApproved.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                actionLoading={actionLoading === business.id}
                onClick={() => handleBusinessClick(business)}
                onArchive={(e) => handleArchive(e, business)}
                onDelete={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(business);
                }}
              />
            ))}
          </div>
        )
      ) : activeTab === "archived" ? (
        visibleArchived.length === 0 ? (
          <EmptyState text={searchQuery ? "Eşleşen arşivli işletme yok." : "Arşivde işletme bulunmuyor."} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleArchived.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                archived
                actionLoading={actionLoading === business.id}
                onClick={() => handleBusinessClick(business)}
                onUnarchive={(e) => handleUnarchive(e, business)}
                onDelete={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(business);
                }}
              />
            ))}
          </div>
        )
      ) : (
        // Pending submissions
        submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Bekleyen başvuru bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {submissions.map((submission) => {
              const data = submission.data as Record<string, unknown>;
              const name = (data?.name as string) || "İsimsiz";
              const colors = Array.isArray(data?.colors) ? data.colors as string[] : [];

              return (
                <Card
                  key={submission.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {submission.logoUrl ? (
                        <img
                          src={submission.logoUrl}
                          alt={name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-center truncate" title={name}>
                      {name}
                    </h3>
                    <Badge variant="secondary" className="w-full justify-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Onay Bekliyor
                    </Badge>
                    {colors.length > 0 && (
                      <div className="flex justify-center gap-1">
                        {colors.slice(0, 6).map((color, index) => (
                          <div
                            key={index}
                            className="w-5 h-5 rounded-full border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                    {submission.submittedAt && (
                      <p className="text-xs text-muted-foreground text-center">
                        {new Date(submission.submittedAt).toLocaleDateString("tr-TR")}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={actionLoading === submission.id}
                        onClick={(e) => handleApprove(e, submission.id)}
                      >
                        {actionLoading === submission.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Onayla
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={actionLoading === submission.id}
                        onClick={(e) => handleReject(e, submission.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reddet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              İşletmeyi sil
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{confirmDelete?.name}</span> kalıcı olarak silinecek.
            Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={!!actionLoading}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1" />Sil</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          actionLoading={actionLoading}
          onClose={() => setSelectedSubmission(null)}
          onApprove={async (e) => {
            await handleApprove(e, selectedSubmission.id);
            setSelectedSubmission(null);
          }}
          onReject={async (e) => {
            await handleReject(e, selectedSubmission.id);
            setSelectedSubmission(null);
          }}
        />
      )}
    </div>
  );
}

function SubmissionDetailModal({
  submission,
  actionLoading,
  onClose,
  onApprove,
  onReject,
}: {
  submission: FormSubmission;
  actionLoading: string | null;
  onClose: () => void;
  onApprove: (e: React.MouseEvent) => void;
  onReject: (e: React.MouseEvent) => void;
}) {
  const data = submission.data as Record<string, unknown>;
  const profile = (data?.profile as Record<string, string>) || {};
  const name = (data?.name as string) || "İsimsiz";
  const colors = Array.isArray(data?.colors) ? (data.colors as string[]) : [];
  const website = (data?.website as string) || "";
  const extras = profile.extras;
  const isActionLoading = actionLoading === submission.id;

  // Parse extras if it's a JSON string
  let extraFields: { key: string; value: string }[] = [];
  if (extras) {
    try {
      const parsed = typeof extras === "string" ? JSON.parse(extras) : extras;
      if (Array.isArray(parsed)) {
        extraFields = parsed;
      }
    } catch {
      // ignore
    }
  }

  // Group profile fields by section
  const sections: { title: string; fields: string[] }[] = [
    {
      title: "Kimlik",
      fields: ["slogan", "industry", "sub_category", "market_position", "location_city"],
    },
    {
      title: "Marka Sesi",
      fields: ["tone", "language", "formality", "emoji_usage", "caption_style"],
    },
    {
      title: "Görsel",
      fields: ["aesthetic", "photography_style", "color_mood", "visual_mood", "font", "custom_font"],
    },
    {
      title: "Hedef Kitle",
      fields: ["target_age_range", "target_gender", "target_description", "target_interests"],
    },
    {
      title: "Marka Değerleri",
      fields: ["brand_values", "unique_points", "brand_story_short"],
    },
    {
      title: "Sosyal Medya",
      fields: ["hashtags_brand", "hashtags_industry", "hashtags_location", "content_pillars"],
    },
    {
      title: "Kurallar",
      fields: ["avoid_topics", "seasonal_content", "promo_frequency"],
    },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Başvuru Detayı
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header: Logo + Name + Colors */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              {submission.logoUrl ? (
                <img
                  src={submission.logoUrl}
                  alt={name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-lg font-semibold">{name}</h3>
              {website && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {website}
                </p>
              )}
              {colors.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
              {submission.submittedAt && (
                <p className="text-xs text-muted-foreground">
                  Gönderilme: {new Date(submission.submittedAt).toLocaleString("tr-TR")}
                </p>
              )}
            </div>
          </div>

          {/* Profile sections */}
          {sections.map((section) => {
            const filledFields = section.fields.filter(
              (f) => profile[f] != null && String(profile[f]).trim() !== ""
            );
            if (filledFields.length === 0) return null;

            return (
              <div key={section.title} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {filledFields.map((field) => {
                    const value = String(profile[field]);
                    const label = PROFILE_LABELS[field] || field;
                    const isLong = value.length > 60;

                    return (
                      <div
                        key={field}
                        className={isLong ? "sm:col-span-2" : ""}
                      >
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <p className="text-sm">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Extra fields */}
          {extraFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Ekstra Alanlar
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {extraFields.map((ef, i) => (
                  <div key={i}>
                    <span className="text-xs text-muted-foreground">{ef.key}</span>
                    <p className="text-sm">{ef.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              className="flex-1"
              disabled={isActionLoading}
              onClick={onApprove}
            >
              {isActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Onayla
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isActionLoading}
              onClick={onReject}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reddet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center text-muted-foreground">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
        {text}
      </CardContent>
    </Card>
  );
}

function BusinessCard({
  business,
  archived,
  actionLoading,
  onClick,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  business: Business;
  archived?: boolean;
  actionLoading: boolean;
  onClick: () => void;
  onArchive?: (e: React.MouseEvent) => void;
  onUnarchive?: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <Card
      className={`group relative cursor-pointer overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/40 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 ${
        archived ? "opacity-70" : ""
      }`}
      onClick={onClick}
    >
      {/* Action menu */}
      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {archived ? (
              <DropdownMenuItem onClick={onUnarchive}>
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Arşivden çıkar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Arşive at
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-muted/60 to-muted/20 rounded-xl flex items-center justify-center overflow-hidden border border-border/40">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Building2 className="w-12 h-12 text-muted-foreground/60" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold truncate text-center" title={business.name}>
            {business.name}
          </h3>
          {archived && (
            <p className="text-[10px] text-center uppercase tracking-wider text-muted-foreground">
              Arşivlendi
            </p>
          )}
        </div>
        {business.colors && business.colors.length > 0 && (
          <div className="flex justify-center gap-1.5">
            {business.colors.slice(0, 6).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-border/60 ring-1 ring-background"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {business.colors.length > 6 && (
              <span className="text-xs text-muted-foreground ml-1 self-center">
                +{business.colors.length - 6}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
