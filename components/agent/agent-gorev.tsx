"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AgentGorevComponent() {
  const [gorev, setGorev] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agentCevabi, setAgentCevabi] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedGorev = gorev.trim()

    if (!trimmedGorev) {
      setHata("Gorev bos olamaz.")
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agent</h2>
        <p className="text-muted-foreground mt-2">Agenta gondermek istediginiz gorevi yazin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gorev</CardTitle>
          <CardDescription>Agenta gondermek istediginiz gorev ismini girin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="agent-gorev">Agenta gondermek istediginiz gorev</Label>
              <textarea
              id="agent-gorev"
              placeholder="Orn: Haftalik icerik plani olustur"
              value={gorev}
              onChange={(event) => setGorev(event.target.value)}
              rows={5}
              className="flex min-h-[250px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !gorev.trim()}>
              {isSubmitting ? "Gonderiliyor..." : "Gorevi gonder"}
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
