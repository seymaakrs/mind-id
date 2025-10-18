"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function IcerikUretComponent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [geriBildirim, setGeriBildirim] = useState<{ tur: "basari" | "hata"; mesaj: string } | null>(null)
  const [kaynaklar] = useState([
    { id: 1, baslik: "Teknoloji Haberleri", url: "https://example.com/tech" },
    { id: 2, baslik: "Yapay Zeka Gelismeleri", url: "https://example.com/ai" },
    { id: 3, baslik: "Sosyal Medya Trendleri", url: "https://example.com/social" },
  ])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeriBildirim(null)

    try {
      const response = await fetch("/api/create-content", {
        method: "POST",
      })

      if (!response.ok) {
        const rawHata = await response.text()
        let hataMesaji = rawHata || "Icerik olusturma istegi basarisiz oldu."

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
        mesaj: error instanceof Error ? error.message : "Icerik olusturulurken baglanti hatasi olustu.",
      })
    } finally {
      setIsGenerating(false)
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
          <CardDescription>Bu liste gelecekte dinamik olarak guncellenecek.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kaynaklar.map((kaynak) => (
              <div key={kaynak.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="font-medium">{kaynak.baslik}</div>
                <div className="text-sm text-muted-foreground mt-1">{kaynak.url}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Icerik Uretme Otomasyonu</CardTitle>
          <CardDescription>Eklediginiz kaynaklardan otomatik olarak icerik olusturun.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
            <Sparkles className="w-5 h-5 mr-2" />
            {isGenerating ? "Icerik uretiliyor..." : "Icerik uretmeyi baslat"}
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
