"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Building2, Loader2 } from "lucide-react"
import { getBusinesses } from "@/lib/firebase/firestore"
import type { Business } from "@/types/firebase"

export default function AgentGorevComponent() {
  const [gorev, setGorev] = useState("")
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agentCevabi, setAgentCevabi] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  // İşletmeleri yükle
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const data = await getBusinesses()
        setBusinesses(data)
      } catch (error) {
        console.error("İşletmeler yüklenirken hata:", error)
      } finally {
        setLoadingBusinesses(false)
      }
    }
    loadBusinesses()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedGorev = gorev.trim()

    if (!trimmedGorev) {
      setHata("Gorev bos olamaz.")
      setAgentCevabi(null)
      return
    }

    if (!selectedBusinessId) {
      setHata("Lutfen bir isletme secin.")
      setAgentCevabi(null)
      return
    }

    setIsSubmitting(true)
    setHata(null)
    setAgentCevabi(null)

    try {
      const response = await fetch("/api/agent-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: trimmedGorev,
          business_id: selectedBusinessId,
          extras: {}, // Ileride kullanilacak ek veriler icin hazir
        }),
      })

      const responseText = await response.text()

      let parsedResponse: unknown = null

      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        // Yanit JSON olmak zorunda degil
      }

      if (!response.ok) {
        let hataMesaji = responseText.trim() || "Gorev gonderilemedi."

        if (parsedResponse && typeof parsedResponse === "object") {
          const errorObj = parsedResponse as { error?: unknown; details?: unknown }
          const temel = typeof errorObj.error === "string" ? errorObj.error : undefined
          const detay = typeof errorObj.details === "string" ? errorObj.details : undefined
          hataMesaji = [temel, detay].filter(Boolean).join(": ") || hataMesaji
        }

        setHata(hataMesaji)
        return
      }

      if (!parsedResponse || typeof parsedResponse !== "object") {
        setHata("Beklenmeyen yanit formati alindi.")
        return
      }

      const { output } = parsedResponse as { output?: unknown }

      if (typeof output !== "string") {
        setHata("Beklenmeyen yanit formati alindi.")
        return
      }

      setAgentCevabi(output)
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Gorev gonderilirken beklenmeyen bir hata olustu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agent</h2>
        <p className="text-muted-foreground mt-2">Agenta gondermek istediginiz gorevi yazin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gorev</CardTitle>
          <CardDescription>Isletme secin ve agenta gondermek istediginiz gorevi girin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* İşletme Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="business-select">
                İşletme Seçin <span className="text-destructive">*</span>
              </Label>
              {loadingBusinesses ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">İşletmeler yükleniyor...</span>
                </div>
              ) : businesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henüz işletme bulunmuyor. Önce bir işletme ekleyin.
                </p>
              ) : (
                <div className="space-y-2">
                  <select
                    id="business-select"
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <option value="">-- İşletme seçin --</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>

                  {/* Seçili işletme önizlemesi */}
                  {selectedBusiness && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-background rounded flex items-center justify-center overflow-hidden border">
                        {selectedBusiness.logo ? (
                          <img
                            src={selectedBusiness.logo}
                            alt={selectedBusiness.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{selectedBusiness.name}</p>
                        {selectedBusiness.colors && selectedBusiness.colors.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {selectedBusiness.colors.slice(0, 5).map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Görev Girişi */}
            <div className="space-y-2">
              <Label htmlFor="agent-gorev">
                Agenta gondermek istediginiz gorev <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="agent-gorev"
                placeholder="Orn: Haftalik icerik plani olustur"
                value={gorev}
                onChange={(event) => setGorev(event.target.value)}
                rows={5}
                disabled={isSubmitting}
                className="flex min-h-[250px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !gorev.trim() || !selectedBusinessId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gonderiliyor...
                </>
              ) : (
                "Gorevi gonder"
              )}
            </Button>
          </form>

          {hata ? (
            <p className="text-sm text-destructive whitespace-pre-wrap break-words" aria-live="polite">
              {hata}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {agentCevabi ? (
        <Card>
          <CardHeader>
            <CardTitle>Agent cevabi</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">{agentCevabi}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
