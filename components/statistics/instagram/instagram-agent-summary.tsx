"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Clock, User, Lightbulb, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";
import type { InstagramWeeklyStats } from "@/types/instagram-statistics";

interface InstagramAgentSummaryProps {
  stats: InstagramWeeklyStats;
  loading?: boolean;
}

export function InstagramAgentSummary({
  stats,
  loading,
}: InstagramAgentSummaryProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Analiz Ozeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasSummary = stats.summary &&
    (stats.summary.insights?.length > 0 || stats.summary.recommendations?.length > 0);

  // Get trend icon and color
  const getTrendIcon = (trend: string | undefined) => {
    switch (trend) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "negative":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string | undefined) => {
    switch (trend) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI Analiz Ozeti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasSummary ? (
          <div className="space-y-6">
            {/* Week over week comparison */}
            {stats.summary.week_over_week && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {getTrendIcon(stats.summary.week_over_week.trend)}
                    <span className="text-sm text-muted-foreground">Reach Degisimi</span>
                  </div>
                  <p className={`text-2xl font-bold ${getTrendColor(stats.summary.week_over_week.trend)}`}>
                    {stats.summary.week_over_week.reach_change}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {getTrendIcon(stats.summary.week_over_week.trend)}
                    <span className="text-sm text-muted-foreground">Engagement Degisimi</span>
                  </div>
                  <p className={`text-2xl font-bold ${getTrendColor(stats.summary.week_over_week.trend)}`}>
                    {stats.summary.week_over_week.engagement_change}
                  </p>
                </div>
              </div>
            )}

            {/* Insights */}
            {stats.summary.insights && stats.summary.insights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Bulgular
                </h4>
                <ul className="space-y-2">
                  {stats.summary.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {stats.summary.recommendations && stats.summary.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Oneriler
                </h4>
                <ul className="space-y-2">
                  {stats.summary.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 mt-0.5">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            {(stats.analyzed_at || stats.analyzed_by) && (
              <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
                {stats.analyzed_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(stats.analyzed_at).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
                {stats.analyzed_by && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{stats.analyzed_by}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Analiz bekleniyor...
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              AI agent bu haftanin analiz ozetini henuz olusturmadi.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
