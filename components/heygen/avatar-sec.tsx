"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Copy, Check } from "lucide-react"

export default function AvatarSecComponent() {
  const [groupId, setGroupId] = useState("")
  const [avatars, setAvatars] = useState<Array<{ id: string; name: string; previewUrl: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSearch = () => {
    setIsLoading(true)
    console.log("[v0] Avatar aranıyor, Group ID:", groupId)
    // API çağrısı buraya eklenecek
    setTimeout(() => {
      // Örnek veri - avatar name, preview image, avatar id
      setAvatars([
        { id: "avatar-abc123", name: "Professional Male", previewUrl: "/professional-male-avatar.png" },
        { id: "avatar-def456", name: "Business Woman", previewUrl: "/business-woman-avatar.png" },
        { id: "avatar-ghi789", name: "Casual Speaker", previewUrl: "/casual-speaker-avatar.jpg" },
        { id: "avatar-jkl012", name: "Tech Expert", previewUrl: "/tech-expert-avatar.png" },
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
        <h2 className="text-3xl font-bold tracking-tight">Avatar Seç</h2>
        <p className="text-muted-foreground mt-2">HeyGen avatarlarını görüntüleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avatar Ara</CardTitle>
          <CardDescription>Group ID ile avatar arama yapın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupId">Group ID</Label>
            <Input
              id="groupId"
              placeholder="Group ID girin"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading || !groupId} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? "Aranıyor..." : "Avatar Ara"}
          </Button>
        </CardContent>
      </Card>

      {avatars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avatarlar</CardTitle>
            <CardDescription>Bulunan avatarlar ve ID'leri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {avatars.map((avatar) => (
                <div key={avatar.id} className="p-4 border rounded-lg hover:bg-accent transition-colors space-y-3">
                  <img
                    src={avatar.previewUrl || "/placeholder.svg"}
                    alt={avatar.name}
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <div>
                    <div className="font-semibold text-lg">{avatar.name}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{avatar.id}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(avatar.id)}
                        className="shrink-0"
                      >
                        {copiedId === avatar.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
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
