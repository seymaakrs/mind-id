"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export default function BlogPaylasComponent() {
  const [isPublishing, setIsPublishing] = useState(false)
  const [bloglar] = useState([
    { id: 1, baslik: "Yapay Zeka ve İş Dünyası: 2024 Trendleri" },
    { id: 2, baslik: "Sosyal Medya Pazarlamasında Başarı İçin 10 İpucu" },
    { id: 3, baslik: "Dijital Dönüşümün İşletmelere Etkileri" },
    { id: 4, baslik: "İçerik Pazarlaması Stratejileri ve Uygulamaları" },
  ])

  const handlePublish = (blogId: number) => {
    setIsPublishing(true)
    console.log("[v0] Blog yayınlanıyor, ID:", blogId)
    // API çağrısı buraya eklenecek
    setTimeout(() => {
      setIsPublishing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Blog Paylaş</h2>
        <p className="text-muted-foreground mt-2">Yeni blog yazısı yayınlayın</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yayınlanabilecek Bloglar</CardTitle>
          <CardDescription>Hazır blog yazılarınızı yayınlayın (Dinamik olarak güncellenecek)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bloglar.map((blog) => (
              <div key={blog.id} className="p-4 border rounded-lg space-y-3">
                <h3 className="font-semibold text-lg">{blog.baslik}</h3>
                <Button onClick={() => handlePublish(blog.id)} disabled={isPublishing} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  {isPublishing ? "Yayınlanıyor..." : "Blog Yazısını Yayınla"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
