"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

export default function GonderiPaylasComponent() {
  const [isSharing, setIsSharing] = useState(false)
  const [gonderiler] = useState([
    {
      id: 1,
      baslik: "Yapay Zeka ve Gelecek",
      altBaslik1: "AI teknolojileri hızla gelişiyor",
      altBaslik2: "2024'te beklenen yenilikler",
      altBaslik3: "İş dünyasına etkileri",
    },
    {
      id: 2,
      baslik: "Sosyal Medya Stratejileri",
      altBaslik1: "Etkileşim artırma yöntemleri",
      altBaslik2: "İçerik planlama ipuçları",
      altBaslik3: "Analiz ve optimizasyon",
    },
    {
      id: 3,
      baslik: "Dijital Pazarlama Trendleri",
      altBaslik1: "Video içerik önemi",
      altBaslik2: "Influencer işbirlikleri",
      altBaslik3: "ROI ölçümleme teknikleri",
    },
  ])

  const handleShare = (gonderiId: number) => {
    setIsSharing(true)
    console.log("[v0] Gönderi paylaşılıyor, ID:", gonderiId)
    // API çağrısı buraya eklenecek
    setTimeout(() => {
      setIsSharing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gönderi Paylaş</h2>
        <p className="text-muted-foreground mt-2">Instagram'da gönderi paylaşın</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paylaşılabilecek Gönderiler</CardTitle>
          <CardDescription>Hazır gönderilerinizi Instagram'da paylaşın (Dinamik olarak güncellenecek)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gonderiler.map((gonderi) => (
              <div key={gonderi.id} className="p-4 border rounded-lg space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{gonderi.baslik}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">• {gonderi.altBaslik1}</p>
                    <p className="text-sm text-muted-foreground">• {gonderi.altBaslik2}</p>
                    <p className="text-sm text-muted-foreground">• {gonderi.altBaslik3}</p>
                  </div>
                </div>
                <Button onClick={() => handleShare(gonderi.id)} disabled={isSharing} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isSharing ? "Paylaşılıyor..." : "Gönderiyi Paylaş"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
