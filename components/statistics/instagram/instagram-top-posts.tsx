"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Film, Image, Layers, Trophy } from "lucide-react";
import type {
  InstagramWeeklyStats,
  InstagramContentType,
} from "@/types/instagram-statistics";

interface InstagramTopPostsProps {
  stats: InstagramWeeklyStats;
  loading?: boolean;
}

// Content type icons
const contentIcons: Record<InstagramContentType, React.ElementType> = {
  reels: Film,
  image: Image,
  carousel: Layers,
};

// Content type colors
const contentColors: Record<InstagramContentType, string> = {
  reels: "#E1306C",
  image: "#833AB4",
  carousel: "#F77737",
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

// Format percentage
function formatPercent(value: number): string {
  return `%${value.toFixed(2)}`;
}

export function InstagramTopPosts({
  stats,
  loading,
}: InstagramTopPostsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            En Iyi Performans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { top_posts } = stats.metrics;

  if (!top_posts || top_posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            En Iyi Performans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Bu hafta icin en iyi paylasim verisi bulunamadi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          En Iyi Performans
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {top_posts.map((post, index) => {
            const Icon = contentIcons[post.type];
            const color = contentColors[post.type];

            return (
              <div
                key={post.url}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>

                {/* Content type icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>

                {/* Stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Erisim</p>
                      <p className="font-medium">{formatNumber(post.reach)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Etkilesim</p>
                      <p className="font-medium">{formatPercent(post.engagement_rate)}</p>
                    </div>
                  </div>
                </div>

                {/* Link to Instagram */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Gor</span>
                  </a>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
