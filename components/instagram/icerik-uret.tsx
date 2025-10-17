"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function IcerikUretComponent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [kaynaklar] = useState([
    { id: 1, baslik: "Teknoloji Haberleri", url: "https://example.com/tech" },
    { id: 2, baslik: "Yapay Zeka Gelişmeleri", url: "https://example.com/ai" },
    { id: 3, baslik: "Sosyal Medya Trendleri", url: "https://example.com/social" },
  ])

  const handleGenerate = () => {
    setIsGenerating(true)
    console.log("[v0] İçerik üretimi başlatılıyor...")
    // API çağrısı buraya eklenecek
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">İçerik Üret</h2>
        <p className="text-muted-foreground mt-2">Instagram için otomatik içerik üretin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İçeriği Üretilecek Kaynaklar</CardTitle>
          <CardDescription>Bu kaynaklardan içerik üretilecek (Dinamik olarak güncellenecek)</CardDescription>
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
          <CardTitle>İçerik Üretme Otomasyonu</CardTitle>
          <CardDescription>Eklediğiniz kaynaklardan otomatik olarak Instagram içeriği üretin</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
            <Sparkles className="w-5 h-5 mr-2" />
            {isGenerating ? "İçerik Üretiliyor..." : "İçerik Üretmeyi Başlat"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
