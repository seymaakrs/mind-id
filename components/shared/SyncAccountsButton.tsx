"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type SyncResult = {
  platform: string;
  id: string;
  username?: string;
};

type Props = {
  businessId: string;
  lateProfileId?: string;
  disabled?: boolean;
  onSyncComplete?: (accounts: SyncResult[]) => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function SyncAccountsButton({
  businessId,
  lateProfileId,
  disabled = false,
  onSyncComplete,
  variant = "outline",
  size = "default",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    accounts?: SyncResult[];
  } | null>(null);

  const handleSync = async () => {
    if (!lateProfileId) {
      setResult({
        success: false,
        message: "Late Profile ID tanimli degil. Lutfen once Late Profile ID girin.",
      });
      setDialogOpen(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setDialogOpen(true);

    try {
      const response = await fetch("/api/sync-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || "Senkronizasyon basarisiz oldu",
        });
        return;
      }

      setResult({
        success: true,
        message: data.message,
        accounts: data.accounts,
      });

      if (onSyncComplete && data.accounts) {
        onSyncComplete(data.accounts);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setResult({
        success: false,
        message: "Bir hata olustu. Lutfen tekrar deneyin.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
      instagram: "Instagram",
      facebook: "Facebook",
      twitter: "Twitter",
      tiktok: "TikTok",
      youtube: "YouTube",
      linkedin: "LinkedIn",
    };
    return labels[platform.toLowerCase()] || platform;
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Senkronize Ediliyor...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Hesaplari Senkronize Et
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Senkronize Ediliyor
                </>
              ) : result?.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Senkronizasyon Basarili
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Senkronizasyon Basarisiz
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {loading
                ? "Hesaplar Late API uzerinden senkronize ediliyor..."
                : result?.message}
            </DialogDescription>
          </DialogHeader>

          {result?.success && result.accounts && result.accounts.length > 0 && (
            <div className="space-y-3 py-4">
              <p className="text-sm font-medium">Senkronize Edilen Hesaplar:</p>
              <div className="space-y-2">
                {result.accounts.map((account, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getPlatformLabel(account.platform)}
                      </span>
                      {account.username && (
                        <span className="text-sm text-muted-foreground">
                          @{account.username}
                        </span>
                      )}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Kapat
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
