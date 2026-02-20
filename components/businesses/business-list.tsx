"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useBusinesses } from "@/hooks";
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
                <Card key={submission.id}>
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
    </div>
  );
}
