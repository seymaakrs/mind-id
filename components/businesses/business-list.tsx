"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, RefreshCw } from "lucide-react";
import { useBusinesses } from "@/hooks";
import type { Business } from "@/types/firebase";

interface BusinessListComponentProps {
  onBusinessSelect?: (business: Business) => void;
}

export default function BusinessListComponent({ onBusinessSelect }: BusinessListComponentProps) {
  const {
    businesses,
    loading,
    error,
    loadBusinesses,
  } = useBusinesses();

  const handleBusinessClick = (business: Business) => {
    if (onBusinessSelect) {
      onBusinessSelect(business);
    }
  };

  // Liste görünümü
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">İşletme Listesi</h2>
            <p className="text-muted-foreground">
              {businesses.length} işletme kayıtlı
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadBusinesses} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Henüz kayıtlı işletme bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {businesses.map((business) => (
            <Card
              key={business.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleBusinessClick(business)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={business.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-semibold text-center truncate" title={business.name}>
                  {business.name}
                </h3>
                {business.colors && business.colors.length > 0 && (
                  <div className="flex justify-center gap-1">
                    {business.colors.slice(0, 6).map((color, index) => (
                      <div
                        key={index}
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {business.colors.length > 6 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{business.colors.length - 6}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
