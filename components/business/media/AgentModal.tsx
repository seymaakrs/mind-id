"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Video, Send, Loader2, Clock, Calendar } from "lucide-react";
import type { BusinessMedia } from "@/types/firebase";
import type { JobType } from "@/types/jobs";
import { JOB_TYPE_LABELS } from "@/types/jobs";

type ProgressMessage = {
  event: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

type Props = {
  open: boolean;
  media: BusinessMedia | null;
  mediaList?: BusinessMedia[]; // For bulk selection
  taskInput: string;
  response: string | null;
  loading: boolean;
  error: string | null;
  progressMessages?: ProgressMessage[];
  onClose: () => void;
  onTaskInputChange: (value: string) => void;
  onSend: (jobType: JobType, scheduledAt?: Date) => void;
};

export function AgentModal({
  open,
  media,
  mediaList,
  taskInput,
  response,
  loading,
  error,
  progressMessages,
  onClose,
  onTaskInputChange,
  onSend,
}: Props) {
  // Job type selection state
  const [jobType, setJobType] = useState<JobType>("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [plannedHour, setPlannedHour] = useState(9);
  const [plannedMinute, setPlannedMinute] = useState(0);

  // Support both single media and multiple media
  const items = mediaList && mediaList.length > 0 ? mediaList : media ? [media] : [];

  if (items.length === 0) return null;

  const isBulk = items.length > 1;

  const handleSend = () => {
    if (jobType === "planned") {
      if (!scheduledDate) {
        alert("Lütfen bir tarih seçin.");
        return;
      }
      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(plannedHour, plannedMinute, 0, 0);

      if (scheduledAt <= new Date()) {
        alert("Planlanan tarih/saat geçmiş olamaz.");
        return;
      }
      onSend(jobType, scheduledAt);
    } else {
      onSend(jobType);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setJobType("immediate");
    setScheduledDate("");
    setPlannedHour(9);
    setPlannedMinute(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && !isOpen && handleClose()}>
      <DialogContent className="w-[95vw] max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent&apos;a Gönder
            {isBulk && (
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} içerik seçildi)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Media preview - grid for multiple, single card for one */}
          {isBulk ? (
            <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg max-h-40 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="aspect-square bg-background rounded overflow-hidden">
                  {item.type === "image" ? (
                    <img
                      src={item.public_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 p-3 bg-muted rounded-lg">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-background rounded overflow-hidden flex-shrink-0">
                {items[0].type === "image" ? (
                  <img
                    src={items[0].public_url}
                    alt={items[0].file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-medium truncate" title={items[0].file_name}>{items[0].file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {items[0].type === "image" ? "Görsel" : "Video"}
                </p>
                {items[0].prompt_summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {items[0].prompt_summary}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="agent-task">
              {isBulk
                ? `Bu ${items.length} içerikle ne yapmak istiyorsunuz?`
                : "Bu içerikle ne yapmak istiyorsunuz?"
              }
            </Label>
            <Textarea
              id="agent-task"
              placeholder={isBulk
                ? "Örn: Bu görselleri kullanarak Instagram carousel postu oluştur..."
                : "Örn: Bu görseli kullanarak Instagram postu oluştur..."
              }
              value={taskInput}
              onChange={(e) => onTaskInputChange(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Job Type Selection */}
          <div className="space-y-2">
            <Label>Görev Tipi</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={jobType === "immediate" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setJobType("immediate")}
                disabled={loading}
              >
                <Clock className="w-4 h-4 mr-2" />
                {JOB_TYPE_LABELS.immediate}
              </Button>
              <Button
                type="button"
                variant={jobType === "planned" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setJobType("planned")}
                disabled={loading}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {JOB_TYPE_LABELS.planned}
              </Button>
            </div>
          </div>

          {/* Planned Job Date/Time Options */}
          {jobType === "planned" && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Saat</Label>
                <Select
                  value={String(plannedHour)}
                  onValueChange={(v) => setPlannedHour(Number(v))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {String(i).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dakika</Label>
                <Select
                  value={String(plannedMinute)}
                  onValueChange={(v) => setPlannedMinute(Number(v))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        :{String(m).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Progress Messages */}
          {loading && progressMessages && progressMessages.length > 0 && (
            <div className="p-3 rounded-md bg-muted font-mono text-xs max-h-[150px] overflow-y-auto space-y-1">
              {progressMessages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground">
                    [{new Date(msg.timestamp).toLocaleTimeString()}]
                  </span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {response && (
            <div className="space-y-2">
              <Label>Agent Yanıtı</Label>
              <div className="p-3 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap break-words text-sm">{response}</pre>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {response ? "Kapat" : "İptal"}
            </Button>
            {!response && (
              <Button
                onClick={handleSend}
                disabled={!taskInput.trim() || loading || (jobType === "planned" && !scheduledDate)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {jobType === "immediate" ? "Gönderiliyor..." : "Kaydediliyor..."}
                  </>
                ) : jobType === "immediate" ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gönder
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Planla
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
