"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export default function BlogPaylasComponent() {
  const [isPublishing, setIsPublishing] = useState(false)
  const [geriBildirim, setGeriBildirim] = useState<{ tur: "basari" | "hata"; mesaj: string } | null>(null)
  // const [bloglar] = useState([
  //   { id: 1, baslik: "Yapay Zeka ve Is Dunyasi: 2024 Trendleri" },
  //   { id: 2, baslik: "Sosyal Medya Pazarlamasinda Basari Icin 10 Ipucu" },
  //   { id: 3, baslik: "Dijital Donusumun Isletmelere Etkileri" },
  //   { id: 4, baslik: "Icerik Pazarlamasi Stratejileri ve Uygulamalari" },
  // ])

  const handlePublish = async () => {
    setIsPublishing(true)
    setGeriBildirim(null)

    try {
      const response = await fetch("/api/post-blog", {
        method: "POST",
      })

      if (!response.ok) {
        const rawHata = await response.text()
        let hataMesaji = rawHata || "Blog yayinlama istegi basarisiz oldu."

        try {
          const hataJson = JSON.parse(rawHata)
          if (typeof hataJson === "object" && hataJson !== null) {
            const hataObj = hataJson as { error?: unknown; details?: unknown }
            const temel = typeof hataObj.error === "string" ? hataObj.error : undefined
            const detay = typeof hataObj.details === "string" ? hataObj.details : undefined
            if (temel || detay) {
              hataMesaji = [temel, detay].filter(Boolean).join(": ")
            }
          }
        } catch {
          // JSON parse hatasi onemli degil
        }

        setGeriBildirim({
          tur: "hata",
          mesaj: hataMesaji,
        })
        return
      }

      const responseText = await response.text()
      let parsedResponse: unknown = null

      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        // Yanit JSON olmak zorunda degil
      }

      let webhookMesaji = responseText.trim()

      if (parsedResponse && typeof parsedResponse === "object") {
        const sonucObj = parsedResponse as { raw?: unknown; data?: unknown }
        if (typeof sonucObj.raw === "string" && sonucObj.raw.trim().length > 0) {
          webhookMesaji = sonucObj.raw
        } else if (typeof sonucObj.data === "string") {
          webhookMesaji = sonucObj.data
        } else if (sonucObj.data !== undefined) {
          try {
            webhookMesaji = JSON.stringify(sonucObj.data, null, 2)
          } catch {
            webhookMesaji = String(sonucObj.data)
          }
        } else {
          try {
            webhookMesaji = JSON.stringify(parsedResponse, null, 2)
          } catch {
            webhookMesaji = responseText
          }
        }
      } else if (typeof parsedResponse === "string" && parsedResponse.trim().length > 0) {
        webhookMesaji = parsedResponse
      }

      const gosterilecekMesaj =
        typeof webhookMesaji === "string" && webhookMesaji.trim().length > 0
          ? webhookMesaji
          : "Webhook bos yanit dondurdu."

      setGeriBildirim({
        tur: "basari",
        mesaj: gosterilecekMesaj,
      })
    } catch (error) {
      setGeriBildirim({
        tur: "hata",
        mesaj: error instanceof Error ? error.message : "Blog yayinlanirken baglanti hatasi olustu.",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Blog Paylas</h2>
        <p className="text-muted-foreground mt-2">Yeni blog yazisini yayinlayin.</p>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Yayinlanabilecek Bloglar</CardTitle>
          <CardDescription>Hazir blog yazilarinizi yayinlayin (dinamik olarak guncellenecek).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bloglar.map((blog) => (
              <div key={blog.id} className="p-4 border rounded-lg space-y-3">
                <h3 className="font-semibold text-lg">{blog.baslik}</h3>
                <Button onClick={() => handlePublishBlog(blog.id)} disabled={isPublishing} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  {isPublishing ? "Yayinlaniyor..." : "Blog Yazinizi Yayinla"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Blog Yazisini Yayinla</CardTitle>
          <CardDescription>Hazirlanan blogu tek tikla yayinlayin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handlePublish} disabled={isPublishing} className="w-full" size="lg">
            <FileText className="w-4 h-4 mr-2" />
            {isPublishing ? "Blog yayinlaniyor..." : "Blog Yazisi Yayinla"}
          </Button>
          {geriBildirim ? (
            <p
              className={`text-sm whitespace-pre-wrap break-words ${
                geriBildirim.tur === "basari" ? "text-green-600" : "text-destructive"
              }`}
              aria-live="polite"
            >
              {geriBildirim.mesaj}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
