"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  Sparkles,
  Database,
  RotateCcw,
} from "lucide-react";
import { useBusinesses } from "@/hooks";
import type { Business } from "@/types/firebase";

type TabFilter = "approved" | "archived" | "deleted";

interface BusinessListComponentProps {
  onBusinessSelect?: (business: Business) => void;
}

export default function BusinessListComponent({ onBusinessSelect }: BusinessListComponentProps) {
  const {
    allBusinesses: businesses,
    loading,
    error,
    loadBusinesses,
    editBusiness,
    removeBusiness,
    restoreBusiness,
  } = useBusinesses();

  const [activeTab, setActiveTab] = useState<TabFilter>("approved");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const approvedBusinesses = businesses.filter(
    (b) => !b.status || b.status === "approved"
  );
  const archivedBusinesses = businesses.filter((b) => b.status === "archived");
  const deletedBusinesses = businesses.filter((b) => b.status === "deleted");

  const filterBySearch = (list: Business[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.name?.toLowerCase().includes(q));
  };

  const visibleApproved = filterBySearch(approvedBusinesses);
  const visibleArchived = filterBySearch(archivedBusinesses);
  const visibleDeleted = filterBySearch(deletedBusinesses);

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

  const handleRestore = async (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    setActionLoading(business.id);
    try {
      await restoreBusiness(business.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    loadBusinesses();
  };

  const isLoading = loading;

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
                {archivedBusinesses.length > 0 && ` · ${archivedBusinesses.length} arşiv`}
                {deletedBusinesses.length > 0 && ` · ${deletedBusinesses.length} veri hazinesi`}
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
          { key: "archived", label: "Arşiv", count: archivedBusinesses.length, icon: Archive },
          { key: "deleted", label: "Veri Hazinesi", count: deletedBusinesses.length, icon: Database },
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
        visibleDeleted.length === 0 ? (
          <EmptyState text={searchQuery ? "Eşleşen kayıt yok." : "Veri Hazinesi boş. Sildiğin işletmelerin verisi burada güvenle saklanır."} />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-lg px-3 py-2">
              Buradaki işletmeler silinmedi; tüm verileri (marka kimliği, raporlar, görseller) sunucuda korunuyor. İstediğin zaman geri yükleyebilirsin.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleDeleted.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  deleted
                  actionLoading={actionLoading === business.id}
                  onClick={() => handleBusinessClick(business)}
                  onRestore={(e) => handleRestore(e, business)}
                />
              ))}
            </div>
          </div>
        )
      )}
      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Veri Hazinesi'ne taşı
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{confirmDelete?.name}</span> listeden kaldırılıp
            <span className="font-medium text-foreground"> Veri Hazinesi</span>'ne taşınacak. Hiçbir veri silinmez —
            marka kimliği, raporlar ve görseller sunucuda korunur. İstediğin zaman geri yükleyebilirsin.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={!!actionLoading}>
              Vazgeç
            </Button>
            <Button onClick={handleDelete} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Database className="w-4 h-4 mr-1" />Veri Hazinesi'ne taşı</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
  deleted,
  actionLoading,
  onClick,
  onArchive,
  onUnarchive,
  onRestore,
  onDelete,
}: {
  business: Business;
  archived?: boolean;
  deleted?: boolean;
  actionLoading: boolean;
  onClick: () => void;
  onArchive?: (e: React.MouseEvent) => void;
  onUnarchive?: (e: React.MouseEvent) => void;
  onRestore?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <Card
      className={`group relative cursor-pointer overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/40 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200 ${
        archived || deleted ? "opacity-70" : ""
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
            {deleted ? (
              <DropdownMenuItem onClick={onRestore}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Geri yükle
              </DropdownMenuItem>
            ) : (
              <>
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
              </>
            )}
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
          {deleted && (
            <p className="text-[10px] text-center uppercase tracking-wider text-primary/70">
              Veri Hazinesi
            </p>
          )}
          {archived && !deleted && (
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
