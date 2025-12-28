"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useBusinesses, useAgentTask } from "@/hooks";
import { BusinessSelector } from "@/components/shared/BusinessSelector";

export default function AgentGorevComponent() {
  const [gorev, setGorev] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const { response, loading: isSubmitting, error, sendTask, reset } = useAgentTask();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedGorev = gorev.trim();
    if (!trimmedGorev || !selectedBusinessId) return;

    await sendTask({
      task: trimmedGorev,
      businessId: selectedBusinessId,
    });
  };

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
              <Label>
                İşletme Seçin <span className="text-destructive">*</span>
              </Label>
              <BusinessSelector
                businesses={businesses}
                loading={loadingBusinesses}
                selectedId={selectedBusinessId}
                onSelect={setSelectedBusinessId}
                disabled={isSubmitting}
                showPreview
                className="w-full"
              />
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
                onChange={(event) => {
                  setGorev(event.target.value);
                  if (response) reset();
                }}
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

          {error && (
            <p className="text-sm text-destructive whitespace-pre-wrap break-words" aria-live="polite">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Agent cevabi</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
              {response}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
