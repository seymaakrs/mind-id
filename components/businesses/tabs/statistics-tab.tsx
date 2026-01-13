"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface StatisticsTabProps {
  businessId: string;
}

export function StatisticsTab({ businessId: _businessId }: StatisticsTabProps) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium mb-2">Istatistikler</h3>
        <p className="text-muted-foreground">
          Bu ozellik yakin zamanda eklenecektir.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Post sayilari, etkilesim oranlari ve diger metrikleri burada gorebileceksiniz.
        </p>
      </CardContent>
    </Card>
  );
}
