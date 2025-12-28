"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bot, Video, Send, Loader2 } from "lucide-react";
import type { BusinessMedia } from "@/types/firebase";

type Props = {
  open: boolean;
  media: BusinessMedia | null;
  taskInput: string;
  response: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onTaskInputChange: (value: string) => void;
  onSend: () => void;
};

export function AgentModal({
  open,
  media,
  taskInput,
  response,
  loading,
  error,
  onClose,
  onTaskInputChange,
  onSend,
}: Props) {
  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent&apos;a Gönder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4 p-3 bg-muted rounded-lg">
            <div className="w-24 h-24 bg-background rounded overflow-hidden flex-shrink-0">
              {media.type === "image" ? (
                <img
                  src={media.public_url}
                  alt={media.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{media.file_name}</p>
              <p className="text-sm text-muted-foreground">
                {media.type === "image" ? "Görsel" : "Video"}
              </p>
              {media.prompt_summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {media.prompt_summary}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-task">Bu içerikle ne yapmak istiyorsunuz?</Label>
            <Textarea
              id="agent-task"
              placeholder="Örn: Bu görseli kullanarak Instagram postu oluştur..."
              value={taskInput}
              onChange={(e) => onTaskInputChange(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>
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
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {response ? "Kapat" : "İptal"}
            </Button>
            {!response && (
              <Button onClick={onSend} disabled={!taskInput.trim() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gönder
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
