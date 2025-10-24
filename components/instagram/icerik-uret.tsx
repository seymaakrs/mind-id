"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Kaynak = {
  row_number: number
  link: string
  process: string
  status: string
  type: string
  drive_link: string
  doc_id: string
  ready_for_insta: string
  ready_for_blog: string
  parent_folder_link: string
  parent_folder_id: string
  posted_on_insta: string
  posted_for_blog: string
}

const KAYNAK_ALANLARI: Array<keyof Kaynak> = [
  "row_number",
  "link",
  "process",
  "status",
  "type",
  "drive_link",
  "doc_id",
  "ready_for_insta",
  "ready_for_blog",
  "parent_folder_link",
  "parent_folder_id",
  "posted_on_insta",
  "posted_for_blog",
]

export default function IcerikUretComponent() {
  const [kaynaklar, setKaynaklar] = useState<Kaynak[]>([])
  const [kaynaklarYukleniyor, setKaynaklarYukleniyor] = useState(false)
  const [kaynaklarHata, setKaynaklarHata] = useState<string | null>(null)
  const [kaynaklarBilgi, setKaynaklarBilgi] = useState<string | null>(null)
  const [icerikDurumlari, setIcerikDurumlari] = useState<
    Record<number, { durum: "yukleniyor" | "basari" | "hata"; mesaj?: string }>
  >({})

  const youtubeEmbedUrl = (url: string): string | null => {
    if (!url) {
      return null
    }

    try {
      const { hostname, searchParams, pathname } = new URL(url)
      const videoIdParam = searchParams.get("v")

      if (hostname.includes("youtube.com") && videoIdParam) {
        return `https://www.youtube.com/embed/${videoIdParam}`
      }

      if (hostname.includes("youtu.be")) {
        const videoIdFromPath = pathname.startsWith("/") ? pathname.slice(1) : pathname
        if (videoIdFromPath) {
          return `https://www.youtube.com/embed/${videoIdFromPath}`
        }
      }
    } catch {
      return null
    }

    return null
  }

  const handleFetchResources = async () => {
    const hamBaseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!hamBaseUrl) {
      setKaynaklarHata("NEXT_PUBLIC_BASE_URL ortami tanimlanmamis.")
      return
    }

    const baseUrl = hamBaseUrl.endsWith("/") ? hamBaseUrl.slice(0, -1) : hamBaseUrl
    const endpoint = `${baseUrl}/get-resources`

    setKaynaklarYukleniyor(true)
    setKaynaklarHata(null)
    setKaynaklarBilgi(null)

    try {
      const response = await fetch(endpoint, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`Kaynaklar yuklenemedi (HTTP ${response.status}).`)
      }

      const data: unknown = await response.json()

      const toKaynak = (value: unknown): Kaynak | null => {
        if (typeof value !== "object" || value === null) {
          return null
        }

        const kayit = value as Record<string, unknown>
        const tumAlanlarVar = KAYNAK_ALANLARI.every((key) => key in kayit)

        if (!tumAlanlarVar) {
          return null
        }

        return {
          row_number: Number(kayit.row_number ?? 0),
          link: String(kayit.link ?? ""),
          process: String(kayit.process ?? ""),
          status: String(kayit.status ?? ""),
          type: String(kayit.type ?? ""),
          drive_link: String(kayit.drive_link ?? ""),
          doc_id: String(kayit.doc_id ?? ""),
          ready_for_insta: String(kayit.ready_for_insta ?? ""),
          ready_for_blog: String(kayit.ready_for_blog ?? ""),
          parent_folder_link: String(kayit.parent_folder_link ?? ""),
          parent_folder_id: String(kayit.parent_folder_id ?? ""),
          posted_on_insta: String(kayit.posted_on_insta ?? ""),
          posted_for_blog: String(kayit.posted_for_blog ?? ""),
        }
      }

      if (!Array.isArray(data)) {
        throw new Error("Beklenmeyen yanit formati alindi.")
      }

      const dogrulanmisKaynaklar = data
        .map(toKaynak)
        .filter((item): item is Kaynak => item !== null)

      if (dogrulanmisKaynaklar.length === 0) {
        setKaynaklar([])
        setKaynaklarBilgi("Kaynak bulunamadi.")
        return
      }

      setKaynaklar(dogrulanmisKaynaklar)
    } catch (error) {
      setKaynaklar([])
      setKaynaklarHata(
        error instanceof Error ? error.message : "Kaynaklar cekilirken beklenmeyen bir hata olustu."
      )
    } finally {
      setKaynaklarYukleniyor(false)
    }
  }

  const handleCreateContent = async (kaynak: Pick<Kaynak, "row_number" | "link" | "type">) => {
    const hamBaseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!hamBaseUrl) {
      setIcerikDurumlari((prev) => ({
        ...prev,
        [kaynak.row_number]: {
          durum: "hata",
          mesaj: "NEXT_PUBLIC_BASE_URL ortami tanimlanmamis.",
        },
      }))
      return
    }

    const baseUrl = hamBaseUrl.endsWith("/") ? hamBaseUrl.slice(0, -1) : hamBaseUrl
    const endpoint = `${baseUrl}/create-content`

    setIcerikDurumlari((prev) => ({
      ...prev,
      [kaynak.row_number]: { durum: "yukleniyor" },
    }))

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: kaynak.link,
          type: kaynak.type,
        }),
      })

      if (!response.ok) {
        const hataMesaji = `Icerik uretme istegi basarisiz oldu (HTTP ${response.status}).`
        throw new Error(hataMesaji)
      }

      const yanitMetni = await response.text()
      const mesaj =
        yanitMetni && yanitMetni.trim().length > 0 ? yanitMetni.trim() : "Icerik uretme istegi basariyla iletildi."

      setIcerikDurumlari((prev) => ({
        ...prev,
        [kaynak.row_number]: {
          durum: "basari",
          mesaj,
        },
      }))
    } catch (error) {
      setIcerikDurumlari((prev) => ({
        ...prev,
        [kaynak.row_number]: {
          durum: "hata",
          mesaj:
            error instanceof Error
              ? error.message
              : "Icerik uretme istegi gonderilirken beklenmeyen bir hata olustu.",
        },
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Icerik Uret</h2>
        <p className="text-muted-foreground mt-2">Instagram icin otomatik icerik uretebilirsiniz.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Icerik Uretilecek Kaynaklar</CardTitle>
          <CardDescription>Kaynaklari goruntulemek icin asagidaki butonu kullanabilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {kaynaklar.length > 0 ? `${kaynaklar.length} kaynak yuklendi.` : "Kaynaklar henuz yuklenmedi."}
            </p>
            <Button onClick={handleFetchResources} disabled={kaynaklarYukleniyor} variant="outline">
              {kaynaklarYukleniyor ? "Kaynaklar yukleniyor..." : "Kaynaklari cek"}
            </Button>
          </div>
          {kaynaklarHata ? (
            <p className="text-sm text-destructive" aria-live="assertive">
              {kaynaklarHata}
            </p>
          ) : null}
          {kaynaklarBilgi && !kaynaklarHata ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {kaynaklarBilgi}
            </p>
          ) : null}
          {kaynaklar.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kaynaklar.map((kaynak) => {
                const embedUrl = youtubeEmbedUrl(kaynak.link)
                const icerikDurumu = icerikDurumlari[kaynak.row_number]
                const icerikYukleniyor = icerikDurumu?.durum === "yukleniyor"

                return (
                  <div
                    key={`${kaynak.row_number}-${kaynak.link}`}
                    className="flex flex-col gap-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-base">Satir {kaynak.row_number}</div>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={icerikYukleniyor}
                        onClick={() => handleCreateContent(kaynak)}
                      >
                        {icerikYukleniyor ? "Icerik uretiliyor..." : "Icerik uret"}
                      </Button>
                    </div>
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={`YouTube videosu - Satir ${kaynak.row_number}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      ) : (
                        <p className="flex h-full items-center justify-center text-sm text-muted-foreground p-4 text-center">
                          Video onizlemesi icin gecerli bir YouTube baglantisi bulunamadi.
                        </p>
                      )}
                    </div>
                    {icerikDurumu && icerikDurumu.mesaj ? (
                      <p
                        className={`text-sm ${
                          icerikDurumu.durum === "basari" ? "text-green-600" : "text-destructive"
                        }`}
                        aria-live="polite"
                      >
                        {icerikDurumu.mesaj}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

