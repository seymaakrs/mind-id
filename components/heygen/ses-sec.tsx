"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Copy, Check } from "lucide-react"

export default function SesSecComponent() {
  const [voices, setVoices] = useState<Array<{ id: string; name: string; language: string; gender: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSearch = () => {
    setIsLoading(true)
    console.log("[v0] Ses aranıyor...")
    // API çağrısı buraya eklenecek
    setTimeout(() => {
      // Örnek veri
      setVoices([
        { id: "voice-tr-m-001", name: "Türkçe Erkek Ses 1", language: "Türkçe", gender: "Erkek" },
        { id: "voice-tr-f-001", name: "Türkçe Kadın Ses 1", language: "Türkçe", gender: "Kadın" },
        { id: "voice-en-m-001", name: "English Male Voice 1", language: "English", gender: "Male" },
        { id: "voice-en-f-001", name: "English Female Voice 1", language: "English", gender: "Female" },
        { id: "voice-tr-m-002", name: "Türkçe Erkek Ses 2", language: "Türkçe", gender: "Erkek" },
      ])
      setIsLoading(false)
    }, 1500)
  }

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ses Seç</h2>
        <p className="text-muted-foreground mt-2">HeyGen seslerini görüntüleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ses Ara</CardTitle>
          <CardDescription>Mevcut sesleri görüntülemek için arama yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? "Aranıyor..." : "Ses Ara"}
          </Button>
        </CardContent>
      </Card>

      {voices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sesler</CardTitle>
            <CardDescription>Bulunan sesler ve ID'leri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voices.map((voice) => (
                <div key={voice.id} className="p-4 border rounded-lg hover:bg-accent transition-colors space-y-2">
                  <div className="font-semibold">{voice.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {voice.language} • {voice.gender}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{voice.id}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(voice.id)} className="shrink-0">
                      {copiedId === voice.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
