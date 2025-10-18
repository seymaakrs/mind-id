"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export default function KaynakEkleComponent() {
  const [kaynak, setKaynak] = useState("");
  const [kaynakTuru, setKaynakTuru] = useState<"video" | "yazi">("video");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geriBildirim, setGeriBildirim] = useState<{
    tur: "basari" | "hata";
    mesaj: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kaynak.trim()) {
      console.warn("[v0] Kaynak bilgisi bos gonderilemez.");
      setGeriBildirim({
        tur: "hata",
        mesaj: "Kaynak bilgisi bos olamaz.",
      });
      return;
    }

    const payload = {
      link: kaynak.trim(),
      type: kaynakTuru,
    };

    setIsSubmitting(true);
    setGeriBildirim(null);

    try {
      const response = await fetch("/api/add-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const rawHata = await response.text();
        let hataMesaji = rawHata || "Kaynak eklenirken sunucu hatasi olustu.";

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

        console.error("[v0] Kaynak ekleme hatasi:", hataMesaji);
        setGeriBildirim({
          tur: "hata",
          mesaj: hataMesaji || "Kaynak eklenirken sunucu hatasi olustu.",
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

      console.log(
        "[v0] Kaynak basariyla eklendi:",
        parsedResponse ?? responseText
      );
      setGeriBildirim({
        tur: "basari",
        mesaj: gosterilecekMesaj,
      });

      setKaynak("");
      setKaynakTuru("video");
    } catch (error) {
      console.error("[v0] Kaynak ekleme istegi basarisiz:", error);
      setGeriBildirim({
        tur: "hata",
        mesaj:
          error instanceof Error
            ? error.message
            : "Kaynak gonderilirken baglanti hatasi olustu.",
      });
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kaynak Ekle</h2>
        <p className="text-muted-foreground mt-2">
          Instagram icin yeni kaynak ekleyin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Kaynak</CardTitle>
          <CardDescription>
            Instagram icerik uretimi icin kullanilacak kaynagi ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-end sm:gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="kaynak">Kaynak URL veya Bilgi</Label>
                <Input
                  id="kaynak"
                  placeholder="Kaynak bilgisini girin..."
                  value={kaynak}
                  onChange={(e) => setKaynak(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:w-40">
                <Label htmlFor="kaynak-turu">Kaynak Turu</Label>
                <select
                  id="kaynak-turu"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={kaynakTuru}
                  onChange={(event) =>
                    setKaynakTuru(event.target.value as "video" | "yazi")
                  }
                >
                  <option value="video">video</option>
                  <option value="article">yazi</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? "Gonderiliyor..." : "Kaynagi Onayla"}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
