"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Loader2,
  Bot,
  Clock,
  Server,
  FileWarning,
} from "lucide-react";
import { useErrorNotifications } from "@/contexts/ErrorNotificationContext";
import type { AgentError, AgentErrorSeverity, AgentErrorType } from "@/types/firebase";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG: Record<
  AgentErrorSeverity,
  { icon: typeof AlertCircle; color: string; bgColor: string; label: string }
> = {
  low: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Dusuk",
  },
  medium: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Orta",
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    label: "Yuksek",
  },
  critical: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Kritik",
  },
};

const ERROR_TYPE_LABELS: Record<AgentErrorType, string> = {
  api_error: "API Hatasi",
  validation_error: "Dogrulama Hatasi",
  timeout: "Zaman Asimi",
  rate_limit: "Istek Limiti",
  not_found: "Bulunamadi",
  permission: "Yetki Hatasi",
  unknown: "Bilinmeyen",
};

const AGENT_LABELS: Record<string, string> = {
  image_agent: "Gorsel Agent",
  marketing_agent: "Pazarlama Agent",
  content_agent: "Icerik Agent",
  social_agent: "Sosyal Medya Agent",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Az once";
  if (diffMins < 60) return `${diffMins} dk once`;
  if (diffHours < 24) return `${diffHours} saat once`;
  return `${diffDays} gun once`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ErrorItem({
  error,
  onClick,
}: {
  error: AgentError;
  onClick: () => void;
}) {
  const config = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.medium;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors",
        config.bgColor
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {AGENT_LABELS[error.agent] || error.agent}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {ERROR_TYPE_LABELS[error.error_type] || error.error_type}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatTimeAgo(error.created_at)}
            </span>
          </div>
          <p className="text-sm font-medium truncate">{error.error_message}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {error.task}
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorDetailDialog({
  error,
  open,
  onOpenChange,
  onResolve,
}: {
  error: AgentError | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (id: string, resolved: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!error) return null;

  const config = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.medium;
  const Icon = config.icon;

  const handleAction = async (resolved: boolean) => {
    setLoading(true);
    await onResolve(error.id, resolved);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", config.color)} />
            Hata Detaylari
          </DialogTitle>
          <DialogDescription>
            {AGENT_LABELS[error.agent] || error.agent} tarafindan bildirilen hata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Hata Mesaji */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Hata Mesaji
            </label>
            <p className="text-sm font-medium">{error.error_message}</p>
          </div>

          {/* Gorev */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Yapilmaya Calisilan Gorev
            </label>
            <p className="text-sm">{error.task}</p>
          </div>

          {/* Bilgiler Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Hata Tipi */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <FileWarning className="w-3 h-3" />
                Hata Tipi
              </label>
              <Badge variant="outline">
                {ERROR_TYPE_LABELS[error.error_type] || error.error_type}
              </Badge>
            </div>

            {/* Onem Derecesi */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Onem Derecesi
              </label>
              <Badge className={cn(config.bgColor, config.color, "border-0")}>
                {config.label}
              </Badge>
            </div>

            {/* Agent */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Server className="w-3 h-3" />
                Agent
              </label>
              <p className="text-sm">{AGENT_LABELS[error.agent] || error.agent}</p>
            </div>

            {/* Tarih */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Tarih
              </label>
              <p className="text-sm">{formatDate(error.created_at)}</p>
            </div>
          </div>

          {/* Context (varsa) */}
          {error.context && Object.keys(error.context).length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Ek Bilgiler
              </label>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleAction(false)}
            disabled={loading}
          >
            Cozulmedi
          </Button>
          <Button
            onClick={() => handleAction(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Hata Cozuldu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ErrorNotificationBell() {
  const { errors, unreadCount, loading, resolveError } = useErrorNotifications();
  const [open, setOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<AgentError | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const criticalCount = errors.filter((e) => e.severity === "critical").length;
  const hasErrors = unreadCount > 0;

  const handleErrorClick = (error: AgentError) => {
    setSelectedError(error);
    setDetailOpen(true);
  };

  const handleResolve = async (id: string, resolved: boolean) => {
    if (resolved) {
      await resolveError(id);
    }
    // Cozulmedi secildiginde sadece dialog kapatilir, bir sey yapilmaz
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative",
              criticalCount > 0 && "text-red-500 hover:text-red-500"
            )}
          >
            <Bell className="w-5 h-5" />
            {hasErrors && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1",
                  criticalCount > 0
                    ? "bg-red-500 text-white"
                    : "bg-orange-500 text-white"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[380px] p-0"
          sideOffset={8}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold">Bildirimler</span>
            </div>
            {hasErrors && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} aktif
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : errors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bot className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Aktif bildirim bulunmuyor</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              {errors.map((error) => (
                <ErrorItem
                  key={error.id}
                  error={error}
                  onClick={() => handleErrorClick(error)}
                />
              ))}
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>

      <ErrorDetailDialog
        error={selectedError}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onResolve={handleResolve}
      />
    </>
  );
}
