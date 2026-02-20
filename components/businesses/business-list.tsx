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
import { Building2, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Globe, Eye } from "lucide-react";
import { useBusinesses } from "@/hooks";
import { PROFILE_LABELS } from "@/lib/constants/business";
import type { Business } from "@/types/firebase";
import type { FormSubmission } from "@/types/form-invite";

type TabFilter = "approved" | "pending";

interface BusinessListComponentProps {
  onBusinessSelect?: (business: Business) => void;
}

export default function BusinessListComponent({ onBusinessSelect }: BusinessListComponentProps) {
  const {
    businesses,
    loading,
    error,
    loadBusinesses,
  } = useBusinesses();

  const [activeTab, setActiveTab] = useState<TabFilter>("approved");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

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

  const handleBusinessClick = (business: Business) => {
    if (onBusinessSelect) {
      onBusinessSelect(business);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">İşletme Listesi</h2>
            <p className="text-muted-foreground">
              {approvedBusinesses.length} işletme kayıtlı
              {submissions.length > 0 && `, ${submissions.length} başvuru bekliyor`}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("approved")}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Onaylanmış ({approvedBusinesses.length})
        </Button>
        <Button
          variant={activeTab === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("pending")}
        >
          <Clock className="w-4 h-4 mr-1" />
          Bekleyen ({submissions.length})
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "approved" ? (
        // Approved businesses
        approvedBusinesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Henüz kayıtlı işletme bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {approvedBusinesses.map((business) => (
              <Card
                key={business.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleBusinessClick(business)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {business.logo ? (
                      <img
                        src={business.logo}
                        alt={business.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold text-center truncate" title={business.name}>
                    {business.name}
                  </h3>
                  {business.colors && business.colors.length > 0 && (
                    <div className="flex justify-center gap-1">
                      {business.colors.slice(0, 6).map((color, index) => (
                        <div
                          key={index}
                          className="w-5 h-5 rounded-full border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      {business.colors.length > 6 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{business.colors.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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
