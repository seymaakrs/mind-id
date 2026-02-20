"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Plus,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { FormInvite } from "@/types/form-invite";

export default function InviteLinksComponent() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<FormInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [creating, setCreating] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getAuthToken = useCallback(async () => {
    const firebaseUser = (await import("@/lib/firebase/config")).auth?.currentUser;
    return firebaseUser?.getIdToken() || null;
  }, []);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("/api/form-invite", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.invites) {
        setInvites(data.invites);
      }
    } catch (err) {
      console.error("Davet linkleri yüklenirken hata:", err);
      setError("Davet linkleri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("/api/form-invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: label.trim() || undefined,
          expiresInDays: parseInt(expiresInDays),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDialogOpen(false);
        setLabel("");
        setExpiresInDays("7");
        await loadInvites();
      } else {
        setError(data.error || "Davet linki oluşturulamadı.");
      }
    } catch (err) {
      console.error("Davet linki oluşturulurken hata:", err);
      setError("Davet linki oluşturulurken bir hata oluştu.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (inviteId: string) => {
    const url = `${window.location.origin}/form/${inviteId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInviteStatus = (invite: FormInvite) => {
    if (invite.used) {
      return { label: "Kullanıldı", variant: "secondary" as const, icon: CheckCircle2 };
    }
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);
    if (now > expiresAt) {
      return { label: "Süresi Doldu", variant: "destructive" as const, icon: XCircle };
    }
    return { label: "Aktif", variant: "default" as const, icon: Clock };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Davet Linkleri</h2>
            <p className="text-muted-foreground">
              Müşterilerinize işletme bilgi formu gönderin
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvites} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Davet Linki
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Davet Linki Oluştur</DialogTitle>
            <DialogDescription>
              Müşterinize göndermek için yeni bir işletme bilgi formu linki oluşturun.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-label">Etiket (Opsiyonel)</Label>
              <Input
                id="invite-label"
                placeholder="Örn: Acme Corp için"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Geçerlilik Süresi</Label>
              <Select
                value={expiresInDays}
                onValueChange={setExpiresInDays}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Gün</SelectItem>
                  <SelectItem value="3">3 Gün</SelectItem>
                  <SelectItem value="7">7 Gün</SelectItem>
                  <SelectItem value="14">14 Gün</SelectItem>
                  <SelectItem value="30">30 Gün</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              İptal
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Oluştur"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : invites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Henüz davet linki oluşturulmamış.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => {
            const status = getInviteStatus(invite);
            const StatusIcon = status.icon;

            return (
              <Card key={invite.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {invite.label || "Etiketsiz"}
                        </span>
                        <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-x-3">
                        <span>
                          Oluşturan: {invite.createdBy}
                        </span>
                        <span>
                          Son kullanma: {new Date(invite.expiresAt).toLocaleDateString("tr-TR")}
                        </span>
                        {invite.usedAt && (
                          <span>
                            Kullanılma: {new Date(invite.usedAt).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(invite.id)}
                      disabled={invite.used || new Date() > new Date(invite.expiresAt)}
                    >
                      {copiedId === invite.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Linki Kopyala
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
