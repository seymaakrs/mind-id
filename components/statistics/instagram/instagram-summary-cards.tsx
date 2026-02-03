"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  PlayCircle,
  FileImage,
  TrendingUp,
} from "lucide-react";
import type { InstagramWeeklyStats } from "@/types/instagram-statistics";

interface InstagramSummaryCardsProps {
  stats: InstagramWeeklyStats;
  loading?: boolean;
}

// Format large numbers for display
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString("tr-TR");
}

// Format percentage
function formatPercent(value: number): string {
  return `%${value.toFixed(2)}`;
}

export function InstagramSummaryCards({
  stats,
  loading,
}: InstagramSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { metrics } = stats;

  const cards = [
    {
      label: "Toplam Paylasim",
      value: formatNumber(metrics.total_posts),
      icon: FileImage,
      color: "#E1306C",
      subtitle: "Bu hafta",
    },
    {
      label: "Erisim",
      value: formatNumber(metrics.total_reach),
      icon: Eye,
      color: "#833AB4",
      subtitle: "Toplam",
    },
    {
      label: "Gosterim",
      value: formatNumber(metrics.total_impressions),
      icon: PlayCircle,
      color: "#405DE6",
      subtitle: "Toplam",
    },
    {
      label: "Begeni",
      value: formatNumber(metrics.total_likes),
      icon: Heart,
      color: "#FD1D1D",
      subtitle: "Toplam",
    },
    {
      label: "Yorum",
      value: formatNumber(metrics.total_comments),
      icon: MessageCircle,
      color: "#F77737",
      subtitle: "Toplam",
    },
    {
      label: "Kaydetme",
      value: formatNumber(metrics.total_saves),
      icon: Bookmark,
      color: "#FCAF45",
      subtitle: "Toplam",
    },
    {
      label: "Paylasim",
      value: formatNumber(metrics.total_shares),
      icon: Share2,
      color: "#C13584",
      subtitle: "Toplam",
    },
    {
      label: "Ort. Etkilesim",
      value: formatPercent(metrics.avg_engagement_rate),
      icon: TrendingUp,
      color: "#10a37f",
      subtitle: "Etkilesim orani",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Date range header */}
      <div className="text-sm text-muted-foreground">
        {stats.date_range.start} - {stats.date_range.end}
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
