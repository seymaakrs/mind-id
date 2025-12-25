"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { getBusinesses } from "@/lib/firebase/firestore";
import type { Business } from "@/types/firebase";
import IsletmeDetay from "./isletme-detay";

export default function IsletmeListeleComponent() {
  const [isletmeler, setIsletmeler] = useState<Business[]>([]);
  const [selectedIsletme, setSelectedIsletme] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  // İşletmeleri yükle
  const loadIsletmeler = async () => {
    setLoading(true);
    setHata(null);
    try {
      const data = await getBusinesses();
      setIsletmeler(data);
    } catch (error) {
      console.error("İşletmeler yüklenirken hata:", error);
      setHata("İşletmeler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // İşletme silindikten sonra listeyi güncelle
  const handleDeleted = (id: string) => {
    setIsletmeler(isletmeler.filter((i) => i.id !== id));
    setSelectedIsletme(null);
  };

  useEffect(() => {
    loadIsletmeler();
  }, []);

  // Detay görünümü
  if (selectedIsletme) {
    return (
      <IsletmeDetay
        isletme={selectedIsletme}
        onBack={() => setSelectedIsletme(null)}
        onDeleted={handleDeleted}
      />
    );
  }

  // Liste görünümü
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">İşletme Listesi</h2>
            <p className="text-muted-foreground">
              {isletmeler.length} işletme kayıtlı
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadIsletmeler} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {hata && (
        <p className="text-sm text-destructive">{hata}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : isletmeler.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Henüz kayıtlı işletme bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isletmeler.map((isletme) => (
            <Card
              key={isletme.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedIsletme(isletme)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Logo */}
                <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {isletme.logo ? (
                    <img
                      src={isletme.logo}
                      alt={isletme.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>

                {/* İsim */}
                <h3 className="font-semibold text-center truncate" title={isletme.name}>
                  {isletme.name}
                </h3>

                {/* Renk paleti */}
                {isletme.colors && isletme.colors.length > 0 && (
                  <div className="flex justify-center gap-1">
                    {isletme.colors.slice(0, 6).map((color, index) => (
                      <div
                        key={index}
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {isletme.colors.length > 6 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{isletme.colors.length - 6}
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
