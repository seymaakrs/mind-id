"use client";

import { TimeRange, TIME_RANGE_LABELS } from "@/types/statistics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const ranges: TimeRange[] = ["all", "30d", "7d", "1d"];

  return (
    <div className="flex items-center gap-2">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={value === range ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range)}
          className={cn(
            "transition-all",
            value === range && "shadow-sm"
          )}
        >
          {TIME_RANGE_LABELS[range]}
        </Button>
      ))}
    </div>
  );
}
