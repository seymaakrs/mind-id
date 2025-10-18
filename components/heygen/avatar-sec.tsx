"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Copy, Check } from "lucide-react"

type AvatarBilgisi = {
  id: string
  name: string
  previewUrl: string
}

export default function AvatarSecComponent() {
  const [groupId, setGroupId] = useState("")
  const [avatars, setAvatars] = useState<AvatarBilgisi[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [geriBildirim, setGeriBildirim] = useState<{ tur: "basari" | "hata"; mesaj: string } | null>(null)

  function cozumlenmisAvatarListesi(veri: unknown): AvatarBilgisi[] {
    function listeyiDondur(girdi: unknown): AvatarBilgisi[] {
      if (!girdi || typeof girdi !== "object") {
        return []
      }

      const muhtemelListe = (girdi as { avatar_list?: unknown }).avatar_list

      if (Array.isArray(muhtemelListe)) {
        return muhtemelListe
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null
            }

            const nesne = item as {
              avatar_id?: unknown
              avatar_name?: unknown
              preview_image_url?: unknown
            }

            const avatarId = typeof nesne.avatar_id === "string" ? nesne.avatar_id : null
            const avatarName = typeof nesne.avatar_name === "string" ? nesne.avatar_name : null
            const preview = typeof nesne.preview_image_url === "string" ? nesne.preview_image_url : ""

            if (!avatarId || !avatarName) {
              return null
            }

            return {
              id: avatarId,
              name: avatarName,
              previewUrl: preview || "/placeholder.svg",
            }
          })
          .filter((item): item is AvatarBilgisi => item !== null)
      }

      return []
    }

    if (Array.isArray(veri)) {
      return veri.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return []
        }

        const veriNesnesi = item as { data?: unknown }

        if ("data" in veriNesnesi) {
          return cozumlenmisAvatarListesi(veriNesnesi.data)
        }

        return listeyiDondur(item)
      })
    }

    if (veri && typeof veri === "object") {
      const nesne = veri as { data?: unknown; avatar_list?: unknown }

      if ("avatar_list" in nesne) {
        return listeyiDondur(nesne)
      }

      if ("data" in nesne) {
        return cozumlenmisAvatarListesi(nesne.data)
      }
    }

    return []
  }

  const handleSearch = async () => {
    const temizGroupId = groupId.trim()

    if (!temizGroupId) {
      setGeriBildirim({ tur: "hata", mesaj: "Group ID bos olamaz." })
      return
    }

    setIsLoading(true)
    setGeriBildirim(null)
    setAvatars([])

    try {
      const response = await fetch("/api/pick-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ group_id: temizGroupId }),
      })

      if (!response.ok) {
        const rawHata = await response.text()
        let hataMesaji = rawHata || "Avatar arama istegi basarisiz oldu."

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

        setGeriBildirim({ tur: "hata", mesaj: hataMesaji })
        return
      }

      const responseText = await response.text()
      console.log("[v0] Avatar arama yaniti:", responseText)

      let parsedResponse: unknown = null

      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = null
      }

      const avatarListesi = cozumlenmisAvatarListesi(parsedResponse)

      if (avatarListesi.length === 0) {
        setGeriBildirim({
          tur: "hata",
          mesaj: "Avatar listesi bulunamadi. Group ID degerini kontrol edin.",
        })
        return
      }

      setAvatars(avatarListesi)
      setGeriBildirim({ tur: "basari", mesaj: "Avatarlar basariyla getirildi." })
    } catch (error) {
      setGeriBildirim({
        tur: "hata",
        mesaj: error instanceof Error ? error.message : "Avatar ararken baglanti hatasi olustu.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Avatar Sec</h2>
        <p className="text-muted-foreground mt-2">HeyGen avatarlarini goruntuleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avatar Ara</CardTitle>
          <CardDescription>Group ID ile avatar aramasi yapin</CardDescription>
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
          <Button onClick={handleSearch} disabled={isLoading || !groupId.trim()} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? "Araniyor..." : "Avatar Ara"}
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

