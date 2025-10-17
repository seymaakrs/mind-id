"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export default function KaynakEkleComponent() {
  const [kaynak, setKaynak] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Kaynak ekleniyor:", kaynak)
    // API çağrısı buraya eklenecek
    setKaynak("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kaynak Ekle</h2>
        <p className="text-muted-foreground mt-2">Instagram için yeni kaynak ekleyin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Kaynak</CardTitle>
          <CardDescription>Instagram içerik üretimi için kullanılacak kaynağı ekleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kaynak">Kaynak URL veya Bilgi</Label>
              <Input
                id="kaynak"
                placeholder="Kaynak bilgisini girin..."
                value={kaynak}
                onChange={(e) => setKaynak(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Kaynağı Onayla
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
