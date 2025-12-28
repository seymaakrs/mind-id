"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Download, Video, Image as ImageIcon } from "lucide-react";
import type { BusinessMedia } from "@/types/firebase";

type Props = {
  media: BusinessMedia | null;
  onClose: () => void;
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export function MediaDetailModal({ media, onClose }: Props) {
  if (!media) return null;

  return (
    <Dialog open={!!media} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {media.type === "image" ? (
              <ImageIcon className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            {media.file_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {media.type === "image" ? (
              <img
                src={media.public_url}
                alt={media.file_name}
                className="max-w-full max-h-[500px] object-contain"
              />
            ) : (
              <video
                src={media.public_url}
                controls
                className="max-w-full max-h-[500px]"
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Dosya Adı:</span>
                <span className="text-muted-foreground">{media.file_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Oluşturulma:</span>
                <span className="text-muted-foreground">{formatDate(media.created_at)}</span>
              </div>
            </div>
            {media.prompt_summary && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Açıklama:</p>
                <p className="text-sm text-muted-foreground">{media.prompt_summary}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => window.open(media.public_url, "_blank")}>
              <Download className="w-4 h-4 mr-2" />
              İndir / Aç
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
