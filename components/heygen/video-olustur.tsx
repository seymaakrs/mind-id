"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Video } from "lucide-react"

export default function VideoOlusturComponent() {
  const [avatarId, setAvatarId] = useState("")
  const [voiceId, setVoiceId] = useState("")
  const [script, setScript] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = () => {
    setIsCreating(true)
    console.log("[v0] Video oluşturuluyor:", { avatarId, voiceId, script })
    // API çağrısı buraya eklenecek
    setTimeout(() => {
      setIsCreating(false)
      setAvatarId("")
      setVoiceId("")
      setScript("")
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Video Oluştur</h2>
        <p className="text-muted-foreground mt-2">HeyGen ile video oluşturun</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Oluşturma</CardTitle>
          <CardDescription>Avatar ve ses seçerek video oluşturun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="avatarId">Avatar ID</Label>
            <Input
              id="avatarId"
              placeholder="Avatar ID girin..."
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voiceId">Voice ID</Label>
            <Input
              id="voiceId"
              placeholder="Voice ID girin..."
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="script">Video Metni (Opsiyonel)</Label>
            <Textarea
              id="script"
              placeholder="Video için metin girin..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating || !avatarId || !voiceId} className="w-full" size="lg">
            <Video className="w-5 h-5 mr-2" />
            {isCreating ? "Video Oluşturuluyor..." : "Video Oluştur"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
