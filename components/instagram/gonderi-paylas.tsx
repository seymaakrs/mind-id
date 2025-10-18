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
import { Send } from "lucide-react";

type Gonderi = {
  id: number;
  baslik: string;
  altBaslik1: string;
  altBaslik2: string;
  altBaslik3: string;
};

export default function GonderiPaylasComponent() {
  const [isSharing, setIsSharing] = useState(false);
  const [isGlobalSharing, setIsGlobalSharing] = useState(false);
  const [geriBildirim, setGeriBildirim] = useState<{
    tur: "basari" | "hata";
    mesaj: string;
  } | null>(null);
  const [gonderiler] = useState<Gonderi[]>([
    {
      id: 1,
      baslik: "Yapay Zeka ve Gelecek",
      altBaslik1: "AI teknolojileri hizla gelisiyor",
      altBaslik2: "2024'te beklenen yenilikler",
      altBaslik3: "Is dunyasina etkileri",
    },
    {
      id: 2,
      baslik: "Sosyal Medya Stratejileri",
      altBaslik1: "Etkilesim artirma yontemleri",
      altBaslik2: "Icerik planlama ipuclari",
      altBaslik3: "Analiz ve optimizasyon",
    },
    {
      id: 3,
      baslik: "Dijital Pazarlama Trendleri",
      altBaslik1: "Video icerigin onemi",
      altBaslik2: "Influencer isbirlikleri",
      altBaslik3: "ROI olcumleme teknikleri",
    },
  ]);

  const handleShare = (gonderiId: number) => {
    setIsSharing(true);
    console.log("[v0] Gonderi paylasiliyor, ID:", gonderiId);
    // Burada ileride gonderi bazli paylasim istegi tetiklenecek
    setTimeout(() => {
      setIsSharing(false);
    }, 2000);
  };

  const handleGlobalShare = async () => {
    setIsGlobalSharing(true);
    setGeriBildirim(null);

    try {
      const response = await fetch("/api/instagram-post", {
        method: "POST",
      });

      if (!response.ok) {
        const rawHata = await response.text();
        let hataMesaji = rawHata || "Gonderi paylasim istegi basarisiz oldu.";

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

        setGeriBildirim({
          tur: "hata",
          mesaj: hataMesaji,
        });
        return;
      }

      const responseText = await response.text();
      let parsedResponse: unknown = null;

      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        // Yanit JSON olmak zorunda degil
      }

      let webhookMesaji = responseText.trim();

      if (parsedResponse && typeof parsedResponse === "object") {
        const sonucObj = parsedResponse as { raw?: unknown; data?: unknown };
        if (
          typeof sonucObj.raw === "string" &&
          sonucObj.raw.trim().length > 0
        ) {
          webhookMesaji = sonucObj.raw;
        } else if (typeof sonucObj.data === "string") {
          webhookMesaji = sonucObj.data;
        } else if (sonucObj.data !== undefined) {
          try {
            webhookMesaji = JSON.stringify(sonucObj.data, null, 2);
          } catch {
            webhookMesaji = String(sonucObj.data);
          }
        } else {
          try {
            webhookMesaji = JSON.stringify(parsedResponse, null, 2);
          } catch {
            webhookMesaji = responseText;
          }
        }
      } else if (
        typeof parsedResponse === "string" &&
        parsedResponse.trim().length > 0
      ) {
        webhookMesaji = parsedResponse;
      }

      const gosterilecekMesaj =
        typeof webhookMesaji === "string" && webhookMesaji.trim().length > 0
          ? webhookMesaji
          : "Webhook bos yanit dondurdu.";

      setGeriBildirim({
        tur: "basari",
        mesaj: gosterilecekMesaj,
      });
    } catch (error) {
      setGeriBildirim({
        tur: "hata",
        mesaj:
          error instanceof Error
            ? error.message
            : "Gonderi paylasilirken baglanti hatasi olustu.",
      });
    } finally {
      setIsGlobalSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gonderi Paylas</h2>
        <p className="text-muted-foreground mt-2">
          Instagram'da gonderi paylasabilirsiniz.
        </p>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Paylasilabilecek Gonderiler</CardTitle>
          <CardDescription>Hazir gonderilerinizi Instagram'da paylasabilirsiniz (dinamik olarak guncellenecek).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gonderiler.map((gonderi) => (
              <div key={gonderi.id} className="p-4 border rounded-lg space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{gonderi.baslik}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">- {gonderi.altBaslik1}</p>
                    <p className="text-sm text-muted-foreground">- {gonderi.altBaslik2}</p>
                    <p className="text-sm text-muted-foreground">- {gonderi.altBaslik3}</p>
                  </div>
                </div>
                <Button onClick={() => handleShare(gonderi.id)} disabled={isSharing} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isSharing ? "Paylasiliyor..." : "Gonderiyi Paylas"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Genel Gonderi Paylas</CardTitle>
          <CardDescription>
            Butona basarak en son hazirlanan gonderiyi paylasabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGlobalShare}
            disabled={isGlobalSharing}
            className="w-full"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            {isGlobalSharing ? "Gonderi paylasiliyor..." : "Gonderi Paylas"}
          </Button>
          {geriBildirim ? (
            <p
              className={`text-sm whitespace-pre-wrap break-words ${
                geriBildirim.tur === "basari"
                  ? "text-green-600"
                  : "text-destructive"
              }`}
              aria-live="polite"
            >
              {geriBildirim.mesaj}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
