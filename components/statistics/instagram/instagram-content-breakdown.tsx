"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Image, Layers } from "lucide-react";
import type {
  InstagramWeeklyStats,
  InstagramContentType,
} from "@/types/instagram-statistics";

interface InstagramContentBreakdownProps {
  stats: InstagramWeeklyStats;
  loading?: boolean;
}

// Content type icons
const contentIcons: Record<InstagramContentType, React.ElementType> = {
  reels: Film,
  image: Image,
  carousel: Layers,
};

// Content type display info
const contentInfo: Record<InstagramContentType, { label: string; color: string }> = {
  reels: {
    label: "Reels",
    color: "#E1306C",
  },
  image: {
    label: "Gorsel",
    color: "#833AB4",
  },
  carousel: {
    label: "Carousel",
    color: "#F77737",
  },
};

// Format large numbers
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString("tr-TR");
}

export function InstagramContentBreakdown({
  stats,
  loading,
}: InstagramContentBreakdownProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Icerik Turu Dagilimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { by_content_type } = stats.metrics;
  const contentTypes: InstagramContentType[] = ["reels", "image", "carousel"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Icerik Turu Dagilimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contentTypes.map((type) => {
            const metrics = by_content_type[type];
            const info = contentInfo[type];
            const Icon = contentIcons[type];

            // Handle case where metrics might not exist
            if (!metrics) {
              return (
                <div
                  key={type}
                  className="p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: info.color }} />
                    </div>
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Veri yok</p>
                </div>
              );
            }

            return (
              <div
                key={type}
                className="p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${info.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: info.color }} />
                  </div>
                  <div>
                    <span className="font-medium">{info.label}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({metrics.count} paylasim)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Erisim</span>
                    <span className="font-medium">{formatNumber(metrics.reach)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Begeni</span>
                    <span className="font-medium">{formatNumber(metrics.likes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kaydetme</span>
                    <span className="font-medium">{formatNumber(metrics.saves)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
