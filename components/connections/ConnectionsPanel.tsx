"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Youtube,
  Linkedin,
  MessageCircle,
  ExternalLink,
  Loader2,
  Plug,
  Unplug,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import { SyncAccountsButton } from "@/components/shared/SyncAccountsButton";
import { useBusinesses } from "@/hooks/useBusinesses";
import { authenticatedFetch } from "@/lib/api-client";
import type {
  Business,
  ConnectionPlatform,
  ConnectionState,
  ConnectionStatus,
} from "@/types/firebase";

const PLATFORMS: Array<{
  id: ConnectionPlatform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "twitter", label: "Twitter", icon: Twitter },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

// Zernio paneli ana URL'i — tek bir resmi OAuth deep-link pattern'i henüz doğrulanmadı,
// bu yüzden yeni sekmede Zernio Connections sayfasına yönlendiriyoruz ve kullanıcıya
// hangi profile için bağlanması gerektiğini söylüyoruz. (Bkz. rapor — varsayım.)
const ZERNIO_PANEL_BASE = process.env.NEXT_PUBLIC_ZERNIO_PANEL_URL || "https://zernio.com";

function buildZernioConnectUrl(
  platform: ConnectionPlatform,
  zernioProfileId: string | undefined,
): string {
  if (!zernioProfileId) return `${ZERNIO_PANEL_BASE}/connections`;
  const params = new URLSearchParams({
    profileId: zernioProfileId,
    redirectTo:
      typeof window !== "undefined" ? window.location.href : `${ZERNIO_PANEL_BASE}/connections`,
  });
  return `${ZERNIO_PANEL_BASE}/connect/${platform}?${params.toString()}`;
}

function statusBadge(state: ConnectionState): { emoji: string; label: string; className: string } {
  switch (state) {
    case "connected":
      return { emoji: "🟢", label: "Bağlı", className: "bg-green-500/10 text-green-400 border-green-500/30" };
    case "expiring":
      return { emoji: "🟡", label: "Token süresi yakın", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" };
    case "disconnected":
      return { emoji: "🔴", label: "Bağlı değil", className: "bg-red-500/10 text-red-400 border-red-500/30" };
    default:
      return { emoji: "⚪", label: "Hiç bağlanmadı", className: "bg-muted text-muted-foreground border-border" };
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR");
  } catch {
    return iso;
  }
}

type Props = {
  initialBusinessId?: string;
  onBusinessChange?: (businessId: string) => void;
};

export function ConnectionsPanel({ initialBusinessId, onBusinessChange }: Props) {
  const { businesses, loading: businessesLoading } = useBusinesses();
  const [selectedId, setSelectedId] = useState<string>(initialBusinessId || "");
  const [liveBusiness, setLiveBusiness] = useState<Business | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Connect dialog state
  const [activePlatform, setActivePlatform] = useState<ConnectionPlatform | null>(null);

  // Zernio Profile ID dialog state (migration helper)
  const [profileIdDialogOpen, setProfileIdDialogOpen] = useState(false);
  const [profileIdInput, setProfileIdInput] = useState("");
  const [profileIdSaving, setProfileIdSaving] = useState(false);
  const [profileIdError, setProfileIdError] = useState<string | null>(null);

  // Auto-select first business
  useEffect(() => {
    if (!selectedId && businesses.length > 0) {
      const first = businesses[0].id;
      setSelectedId(first);
      onBusinessChange?.(first);
    }
  }, [businesses, selectedId, onBusinessChange]);

  // Real-time Firestore subscription for selected business
  useEffect(() => {
    if (!db || !selectedId) {
      setLiveBusiness(null);
      return;
    }
    const ref = doc(db, "businesses", selectedId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLiveBusiness({ id: snap.id, ...snap.data() } as Business);
      } else {
        setLiveBusiness(null);
      }
    });
    return () => unsub();
  }, [selectedId]);

  const connections = useMemo<Partial<Record<ConnectionPlatform, ConnectionStatus>>>(
    () => liveBusiness?.connections ?? {},
    [liveBusiness],
  );

  const zernioProfileId = liveBusiness?.zernio_profile_id;
  const hasLateOnly = Boolean(liveBusiness?.late_profile_id) && !zernioProfileId;

  const refreshStatus = async () => {
    if (!selectedId) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await authenticatedFetch("/api/connections/status", {
        method: "POST",
        body: JSON.stringify({ businessId: selectedId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRefreshError(data.error || "Bağlantı durumu alınamadı.");
      }
    } catch (error) {
      console.error("Connection refresh error:", error);
      setRefreshError("Bağlantı durumu alınırken hata oluştu.");
    } finally {
      setRefreshing(false);
    }
  };

  const saveZernioProfileId = async () => {
    if (!selectedId || !profileIdInput.trim()) {
      setProfileIdError("Zernio Profile ID boş olamaz.");
      return;
    }
    setProfileIdSaving(true);
    setProfileIdError(null);
    try {
      // Firestore client SDK üzerinden direkt güncelle (admin paneli, zaten auth'lu kullanıcı).
      const { updateBusiness } = await import("@/lib/firebase/firestore");
      await updateBusiness(selectedId, {
        zernio_profile_id: profileIdInput.trim(),
      });
      setProfileIdDialogOpen(false);
      setProfileIdInput("");
    } catch (error) {
      console.error("Zernio profile id save error:", error);
      setProfileIdError("Kaydedilemedi. Tekrar deneyin.");
    } finally {
      setProfileIdSaving(false);
    }
  };

  if (businessesLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="w-6 h-6" />
            Bağlantılar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            İşletmenin sosyal medya hesaplarını Zernio üzerinden bağla ve durumlarını izle.
          </p>
        </div>
        <BusinessSelector
          businesses={businesses}
          loading={businessesLoading}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            onBusinessChange?.(id);
          }}
        />
      </div>

      {!selectedId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Önce bir işletme seç.
          </CardContent>
        </Card>
      )}

      {selectedId && hasLateOnly && (
        <Card className="border-yellow-500/40 bg-yellow-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-yellow-200">Late → Zernio geçişi gerekli</p>
              <p className="text-sm text-muted-foreground">
                Bu işletmenin sadece Late Profile ID&apos;si var. Zernio&apos;ya geçmek için Zernio panelinde
                bu işletme için bir profil oluştur ve ID&apos;yi buraya gir.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setProfileIdInput("");
                  setProfileIdError(null);
                  setProfileIdDialogOpen(true);
                }}
              >
                Zernio Profile ID&apos;sini Gir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedId && !zernioProfileId && !hasLateOnly && (
        <Card className="border-yellow-500/40 bg-yellow-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Önce Zernio Profile ID gerekli</p>
              <p className="text-sm text-muted-foreground">
                Hesap bağlamak için bu işletmeye Zernio&apos;da bir profil tanımlamalısın.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setProfileIdInput("");
                  setProfileIdError(null);
                  setProfileIdDialogOpen(true);
                }}
              >
                Zernio Profile ID&apos;sini Gir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedId && zernioProfileId && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Durumu Yenile
            </Button>
            <SyncAccountsButton
              businessId={selectedId}
              zernioProfileId={zernioProfileId}
              lateProfileId={liveBusiness?.late_profile_id}
              size="sm"
            />
            <Button asChild variant="ghost" size="sm">
              <a
                href={`${ZERNIO_PANEL_BASE}/connections?profileId=${encodeURIComponent(zernioProfileId)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Zernio Panel&apos;de Aç
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </Button>
          </div>

          {refreshError && (
            <p className="text-sm text-destructive">{refreshError}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Bağlantıları</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const conn = connections[p.id];
                  const state: ConnectionState = conn?.status ?? "never";
                  const badge = statusBadge(state);
                  const isConnected = state === "connected" || state === "expiring";

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{p.label}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${badge.className}`}
                            >
                              {badge.emoji} {badge.label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-x-3">
                            {conn?.username && <span>@{conn.username}</span>}
                            <span>Son senkron: {formatDate(conn?.last_synced_at)}</span>
                            {conn?.expires_at && (
                              <span>Token: {formatDate(conn.expires_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={isConnected ? "outline" : "default"}
                          onClick={() => setActivePlatform(p.id)}
                        >
                          {isConnected ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              Yeniden Bağla
                            </>
                          ) : (
                            <>
                              <Plug className="w-3.5 h-3.5 mr-1.5" />
                              Bağla
                            </>
                          )}
                        </Button>
                        {isConnected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            title="Zernio panelinde bağlantıyı kes"
                          >
                            <a
                              href={`${ZERNIO_PANEL_BASE}/connections?profileId=${encodeURIComponent(zernioProfileId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Unplug className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Bağlantı kesilirse (token bitti / kullanıcı yetkiyi geri çekti) bu liste otomatik
            güncellenir. Yeni hesap eklediysen &quot;Durumu Yenile&quot;ye bas.
          </p>
        </>
      )}

      {/* Connect dialog */}
      <Dialog
        open={activePlatform !== null}
        onOpenChange={(open) => {
          if (!open) setActivePlatform(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activePlatform
                ? PLATFORMS.find((p) => p.id === activePlatform)?.label
                : ""}{" "}
              Bağla
            </DialogTitle>
            <DialogDescription>
              {activePlatform
                ? `${PLATFORMS.find((p) => p.id === activePlatform)?.label}'ı bağlamak için Zernio panelinde bu işletmeye yetki vermen gerek. Aşağıdaki adımları izle.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-2 text-sm list-decimal pl-5 text-muted-foreground">
            <li>&quot;Zernio Panel&apos;e Git&quot; butonuna bas — yeni sekme açılır.</li>
            <li>
              Zernio&apos;da Profile ID{" "}
              <code className="px-1 py-0.5 bg-muted rounded text-xs">{zernioProfileId}</code>{" "}
              için{" "}
              {activePlatform &&
                PLATFORMS.find((p) => p.id === activePlatform)?.label}{" "}
              hesabını bağla.
            </li>
            <li>Buraya dön ve &quot;Bağlandım, Senkronize Et&quot;e bas.</li>
          </ol>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            {activePlatform && (
              <Button asChild variant="outline">
                <a
                  href={buildZernioConnectUrl(activePlatform, zernioProfileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Zernio Panel&apos;e Git
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            )}
            <Button
              onClick={async () => {
                await refreshStatus();
                setActivePlatform(null);
              }}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Bağlandım, Senkronize Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zernio Profile ID dialog */}
      <Dialog open={profileIdDialogOpen} onOpenChange={setProfileIdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zernio Profile ID&apos;sini Gir</DialogTitle>
            <DialogDescription>
              Zernio panelinde bu işletme için oluşturduğun profilin ID&apos;sini buraya yapıştır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="zernio-profile-id-input">Zernio Profile ID</Label>
            <Input
              id="zernio-profile-id-input"
              placeholder="örn. 6789abc..."
              value={profileIdInput}
              onChange={(e) => setProfileIdInput(e.target.value)}
              disabled={profileIdSaving}
            />
            {profileIdError && (
              <p className="text-sm text-destructive">{profileIdError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProfileIdDialogOpen(false)}
              disabled={profileIdSaving}
            >
              Vazgeç
            </Button>
            <Button onClick={saveZernioProfileId} disabled={profileIdSaving}>
              {profileIdSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
