"use client";

import { Image, FileText, Calendar, CheckCircle, Instagram, Paperclip, X } from "lucide-react";
import type { ReferenceItem, ReferenceType } from "@/types/references";
import { REFERENCE_TYPE_LABELS } from "@/types/references";

interface ReferenceTrayProps {
  references: ReferenceItem[];
  onRemove: (type: ReferenceType, id: string) => void;
  onAddClick: () => void;
  disabled?: boolean;
}

const TYPE_ICONS: Record<ReferenceType, React.ElementType> = {
  media: Image,
  instagram_post: Instagram,
  content_plan: Calendar,
  report: FileText,
  task_result: CheckCircle,
};

export function ReferenceTray({ references, onRemove, onAddClick, disabled }: ReferenceTrayProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 py-1.5">
      {references.map((ref) => {
        const Icon = TYPE_ICONS[ref.type];
        return (
          <div
            key={`${ref.type}-${ref.id}`}
            className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full bg-muted/80 border border-border text-xs max-w-[160px]"
          >
            {/* Thumbnail or icon */}
            {ref.thumbnail ? (
              <img
                src={ref.thumbnail}
                alt=""
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            ) : (
              <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
            )}

            {/* Label */}
            <span className="truncate text-[11px] text-foreground/80 max-w-[100px]">
              {ref.label ?? REFERENCE_TYPE_LABELS[ref.type]}
            </span>

            {/* Remove */}
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(ref.type, ref.id)}
                className="shrink-0 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add button */}
      {!disabled && (
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border hover:border-primary hover:text-primary transition-colors text-[11px] text-muted-foreground"
        >
          <Paperclip className="w-3 h-3" />
          Referans Ekle
        </button>
      )}
    </div>
  );
}
