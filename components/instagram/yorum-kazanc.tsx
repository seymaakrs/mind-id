"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

type SonucDurumu = {
  tur: "basari" | "hata" | "bilgi";
  mesaj: string;
  raw?: string;
};

export default function YorumKazancComponent() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [sonuc, setSonuc] = useState<SonucDurumu | null>(null);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setSonuc({
      tur: "bilgi",
      mesaj: "Yorum kazanci hesaplaniyor...",
    });

    try {
      const response = await fetch("/api/calculate-comments", {
        method: "GET",
      });

      if (!response.ok) {
        const rawHata = await response.text();
        let hataMesaji =
          rawHata.trim().length > 0
            ? rawHata
            : "Yorum kazanci hesabi basarisiz oldu.";

        try {
          const hataJson = JSON.parse(rawHata);
          if (typeof hataJson === "object" && hataJson !== null) {
            const hataObj = hataJson as { error?: unknown; details?: unknown };
            const temel =
              typeof hataObj.error === "string" ? hataObj.error : undefined;
            const detay =
              typeof hataObj.details === "string" ? hataObj.details : undefined;
            if (temel || detay) {
              hataMesaji = [temel, detay].filter(Boolean).join(": ");
            }
          }
        } catch {
          // JSON parse hatasi onemli degil
        }

        setSonuc({
          tur: "hata",
          mesaj: hataMesaji,
          raw: rawHata.trim().length > 0 ? rawHata : undefined,
        });
        return;
      }

      const responseText = await response.text();
      const trimmedResponse = responseText.trim();
      let parsedResponse: unknown = null;

      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        // Yanit JSON olmak zorunda degil
      }

      let gosterilecekMesaj = trimmedResponse;
      let rawIcerik =
        parsedResponse && typeof parsedResponse === "object"
          ? JSON.stringify(parsedResponse, null, 2)
          : trimmedResponse;

      if (parsedResponse && typeof parsedResponse === "object") {
        const sonucObj = parsedResponse as {
          message?: unknown;
          total?: unknown;
          amount?: unknown;
          raw?: unknown;
          data?: unknown;
        };

        if (
          typeof sonucObj.total === "number" ||
          typeof sonucObj.amount === "number"
        ) {
          const deger =
            typeof sonucObj.total === "number"
              ? sonucObj.total
              : (sonucObj.amount as number);
          gosterilecekMesaj = `Son 30 gunluk tahmini kazanc: ${deger}`;
        } else if (typeof sonucObj.message === "string") {
          gosterilecekMesaj = sonucObj.message;
        } else if (typeof sonucObj.raw === "string") {
          gosterilecekMesaj = sonucObj.raw;
        } else if (typeof sonucObj.data === "string") {
          gosterilecekMesaj = sonucObj.data;
        } else if (sonucObj.data !== undefined) {
          try {
            gosterilecekMesaj = JSON.stringify(sonucObj.data, null, 2);
          } catch {
            gosterilecekMesaj = String(sonucObj.data);
          }
        } else {
          try {
            gosterilecekMesaj = JSON.stringify(parsedResponse, null, 2);
          } catch {
            gosterilecekMesaj = responseText;
          }
        }

        rawIcerik =
          rawIcerik.trim().length > 0 ? rawIcerik : trimmedResponse;
      } else if (
        typeof parsedResponse === "string" &&
        parsedResponse.trim().length > 0
      ) {
        gosterilecekMesaj = parsedResponse;
      }

      if (!gosterilecekMesaj) {
        gosterilecekMesaj = "Yorum kazanci hesabi tamamlandi.";
      }

      setSonuc({
        tur: "basari",
        mesaj: gosterilecekMesaj,
        raw: rawIcerik.trim().length > 0 ? rawIcerik.trim() : undefined,
      });
    } catch (error) {
      const varsayilanMesaj =
        error instanceof Error
          ? error.message
          : "Yorum kazanci hesaplanirken beklenmedik bir hata olustu.";
      setSonuc({
        tur: "hata",
        mesaj: varsayilanMesaj,
        raw: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Yorum Kazanclarini Hesapla
        </h2>
        <p className="text-muted-foreground mt-2">
          Son 30 gunluk yorum bazli tahmini kazanci ogrenmek icin hesaplaya
          basin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son 30 Gunluk Kazanc</CardTitle>
          <CardDescription>
            Hesaplama butonuna tiklayarak guncel tahmini kazanci goruntuleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full"
            size="lg"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isCalculating ? "Hesaplaniyor..." : "Kazanci Hesapla"}
          </Button>

          {sonuc ? (
            <div className="space-y-2" aria-live="polite">
              <p
                className={`text-sm whitespace-pre-wrap break-words ${
                  sonuc.tur === "basari"
                    ? "text-green-600"
                    : sonuc.tur === "hata"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {sonuc.mesaj}
              </p>
              {sonuc.raw ? (
                <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
                  {sonuc.raw}
                </pre>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
