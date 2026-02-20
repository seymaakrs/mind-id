"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useBusinesses } from "@/hooks";
import type { Business } from "@/types/firebase";

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
    editBusiness,
    removeBusiness,
  } = useBusinesses();

  const [activeTab, setActiveTab] = useState<TabFilter>("approved");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const approvedBusinesses = businesses.filter(
    (b) => !b.status || b.status === "approved"
  );
  const pendingBusinesses = businesses.filter((b) => b.status === "pending");

  const filteredBusinesses =
    activeTab === "approved" ? approvedBusinesses : pendingBusinesses;

  const handleBusinessClick = (business: Business) => {
    if (onBusinessSelect) {
      onBusinessSelect(business);
    }
  };

  const handleApprove = async (e: React.MouseEvent, businessId: string) => {
    e.stopPropagation();
    setActionLoading(businessId);
    try {
      await editBusiness(businessId, { status: "approved" } as Partial<Business>);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, businessId: string) => {
    e.stopPropagation();
    if (!confirm("Bu işletmeyi silmek istediğinize emin misiniz?")) return;
    setActionLoading(businessId);
    try {
      await removeBusiness(businessId);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">İşletme Listesi</h2>
            <p className="text-muted-foreground">
              {businesses.length} işletme kayıtlı
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadBusinesses} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
          Bekleyen ({pendingBusinesses.length})
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {activeTab === "pending"
              ? "Bekleyen işletme bulunmuyor."
              : "Henüz kayıtlı işletme bulunmuyor."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBusinesses.map((business) => (
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
                {business.status === "pending" && (
                  <Badge variant="secondary" className="w-full justify-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Onay Bekliyor
                  </Badge>
                )}
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
                {activeTab === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={actionLoading === business.id}
                      onClick={(e) => handleApprove(e, business.id)}
                    >
                      {actionLoading === business.id ? (
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
                      disabled={actionLoading === business.id}
                      onClick={(e) => handleReject(e, business.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reddet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
