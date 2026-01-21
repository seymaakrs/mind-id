"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Video, Bot, Check } from "lucide-react";
import type { BusinessMedia } from "@/types/firebase";

type Props = {
  media: BusinessMedia;
  onClick: () => void;
  onSendToAgent: (e: React.MouseEvent) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (media: BusinessMedia) => void;
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

export function MediaCard({ media, onClick, onSendToAgent, selectionMode, isSelected, onSelect }: Props) {
  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect(media);
    } else {
      onClick();
    }
  };

  return (
    <Card
      className={`cursor-pointer hover:border-primary/50 transition-colors overflow-hidden ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="w-full h-40 bg-muted flex items-center justify-center overflow-hidden relative">
          {media.type === "image" ? (
            <img
              src={media.public_url}
              alt={media.file_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full">
              <video src={media.public_url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Video className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
          {/* Selection checkbox */}
          {selectionMode && (
            <div
              className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center ${
                isSelected ? "bg-primary" : "bg-black/50"
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
          )}
          <span
            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
              media.type === "image"
                ? "bg-blue-500/80 text-white"
                : "bg-purple-500/80 text-white"
            }`}
          >
            {media.type === "image" ? "Görsel" : "Video"}
          </span>
        </div>
        <div className="p-3 space-y-2 min-w-0">
          <p className="text-sm font-medium truncate" title={media.file_name}>
            {media.file_name}
          </p>
          {media.prompt_summary && (
            <p
              className="text-xs text-muted-foreground line-clamp-2"
              title={media.prompt_summary}
            >
              {media.prompt_summary}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(media.created_at)}
          </div>
          {!selectionMode && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={onSendToAgent}
            >
              <Bot className="w-4 h-4 mr-2" />
              Ajana Gönder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
