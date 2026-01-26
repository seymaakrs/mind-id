"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ProviderStats, PROVIDER_INFO } from "@/types/statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendingBarChartProps {
  data: ProviderStats[];
  loading?: boolean;
}

export function SpendingBarChart({ data, loading }: SpendingBarChartProps) {
  // Transform data for bar chart
  const chartData = data.map((stat) => ({
    provider: stat.provider,
    label: PROVIDER_INFO[stat.provider].label,
    totalSpend: stat.summary.currentPeriodSpend,
    color: PROVIDER_INFO[stat.provider].color,
  }));

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: { label: string; totalSpend: number; color: string } }[];
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-lg font-semibold" style={{ color: item.color }}>
            ${item.totalSpend.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Karsilastirmasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Yukleniyor...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Karsilastirmasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Veri bulunamadi</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API Karsilastirmasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalSpend" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
