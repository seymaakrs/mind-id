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

type InstagramIcerik = {
  id: string;
  name: string;
};

export default function GonderiPaylasComponent() {
  const [icerikler, setIcerikler] = useState<InstagramIcerik[]>([]);
  const [iceriklerYukleniyor, setIceriklerYukleniyor] = useState(false);
  const [iceriklerHata, setIceriklerHata] = useState<string | null>(null);
  const [paylasimDurumlari, setPaylasimDurumlari] = useState<Record<string, { durum: "yukleniyor" | "basari" | "hata"; mesaj?: string }>>({});

  const handleFetchContents = async () => {
    const hamBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!hamBaseUrl) {
      setIceriklerHata("NEXT_PUBLIC_BASE_URL ortami tanimlanmamis.");
      return;
    }

    const baseUrl = hamBaseUrl.endsWith("/") ? hamBaseUrl.slice(0, -1) : hamBaseUrl;
    const endpoint = `${baseUrl}/get-insta-contents`;

    setIceriklerYukleniyor(true);
    setIceriklerHata(null);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Instagram icerikleri yuklenemedi (HTTP ${response.status}).`);
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Beklenmeyen yanit formati alindi.");
      }

      const dogrulanmisIcerikler = data
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            return null;
          }
          const kayit = item as Record<string, unknown>;
          const id = typeof kayit.id === "string" ? kayit.id : null;
          const name = typeof kayit.name === "string" ? kayit.name : null;

          if (!id || !name) {
            return null;
          }

          return { id, name };
        })
        .filter((item): item is InstagramIcerik => item !== null);

      setIcerikler(dogrulanmisIcerikler);

      if (dogrulanmisIcerikler.length === 0) {
        setIceriklerHata("Gosterilecek instagram icerigi bulunamadi.");
      }
    } catch (error) {
      setIcerikler([]);
      setIceriklerHata(
        error instanceof Error
          ? error.message
          : "Instagram icerikleri cekilirken beklenmeyen bir hata olustu."
      );
    } finally {
      setIceriklerYukleniyor(false);
    }
  };

  const handleShareContent = async (icerik: InstagramIcerik) => {
    const hamBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!hamBaseUrl) {
      setPaylasimDurumlari((prev) => ({
        ...prev,
        [icerik.id]: {
          durum: "hata",
          mesaj: "NEXT_PUBLIC_BASE_URL ortami tanimlanmamis.",
        },
      }));
      return;
    }

    const baseUrl = hamBaseUrl.endsWith("/") ? hamBaseUrl.slice(0, -1) : hamBaseUrl;
    const endpoint = `${baseUrl}/instagram-post`;

    setPaylasimDurumlari((prev) => ({
      ...prev,
      [icerik.id]: {
        durum: "yukleniyor",
      },
    }));

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: icerik.id,
          name: icerik.name,
        }),
      });

      if (!response.ok) {
        const rawText = await response.text();
        const hataMesaji =
          rawText && rawText.trim().length > 0
            ? rawText.trim()
            : `Gonderi paylasim istegi basarisiz oldu (HTTP ${response.status}).`;
        throw new Error(hataMesaji);
      }

      const responseText = await response.text();
      const basariMesaji =
        responseText && responseText.trim().length > 0
          ? responseText.trim()
          : "Gonderi paylasim istegi iletildi.";

      setPaylasimDurumlari((prev) => ({
        ...prev,
        [icerik.id]: {
          durum: "basari",
          mesaj: basariMesaji,
        },
      }));
    } catch (error) {
      setPaylasimDurumlari((prev) => ({
        ...prev,
        [icerik.id]: {
          durum: "hata",
          mesaj:
            error instanceof Error
              ? error.message
              : "Gonderi paylasim istegi gonderilirken beklenmeyen bir hata olustu.",
        },
      }));
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

      <Card>
        <CardHeader>
          <CardTitle>Instagram Icerikleri</CardTitle>
          <CardDescription>Hazirlanan instagram iceriklerini bu alanda gorebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {icerikler.length > 0
                ? `${icerikler.length} instagram icerigi yuklendi.`
                : "Icerikler henuz yuklenmedi."}
            </p>
            <Button onClick={handleFetchContents} disabled={iceriklerYukleniyor} variant="outline">
              {iceriklerYukleniyor ? "Icerikler yukleniyor..." : "Icerikleri getir"}
            </Button>
          </div>
          {iceriklerHata ? (
            <p className="text-sm text-destructive" aria-live="assertive">
              {iceriklerHata}
            </p>
          ) : null}
          {icerikler.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {icerikler.map((icerik) => (
                <div key={icerik.id} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ID</div>
                    <div className="break-all text-sm font-mono text-muted-foreground">{icerik.id}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Baslik</div>
                    <div className="text-base font-semibold break-words">{icerik.name}</div>
                  </div>
                  <Button
                    onClick={() => handleShareContent(icerik)}
                    disabled={paylasimDurumlari[icerik.id]?.durum === "yukleniyor"}
                    size="sm"
                  >
                    {paylasimDurumlari[icerik.id]?.durum === "yukleniyor" ? "Paylasiliyor..." : "Paylas"}
                  </Button>
                  {paylasimDurumlari[icerik.id]?.mesaj ? (
                    <p
                      className={`text-sm ${
                        paylasimDurumlari[icerik.id]?.durum === "basari"
                          ? "text-green-600"
                          : "text-destructive"
                      }`}
                      aria-live="polite"
                    >
                      {paylasimDurumlari[icerik.id]?.mesaj}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
