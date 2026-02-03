"use client";

import { Calendar, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InstagramWeekOption } from "@/types/instagram-statistics";

interface InstagramWeekSelectorProps {
  weeks: InstagramWeekOption[];
  selectedWeekId: string | null;
  onWeekChange: (weekId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function InstagramWeekSelector({
  weeks,
  selectedWeekId,
  onWeekChange,
  loading,
  disabled,
}: InstagramWeekSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Haftalar yukleniyor...</span>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">Henuz istatistik verisi yok</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedWeekId || undefined}
      onValueChange={onWeekChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[280px]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="Hafta secin" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {weeks.map((week) => (
          <SelectItem key={week.week_id} value={week.week_id}>
            {week.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
