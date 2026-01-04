"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useBusinesses, useAgentTask, useServerHealth } from "@/hooks";
import { BusinessSelector } from "@/components/shared/BusinessSelector";

export default function AgentGorevComponent() {
  const [gorev, setGorev] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const {
    response,
    loading: isSubmitting,
    error,
    heartbeatCount,
    sendTask,
    cancelTask,
    reset,
  } = useAgentTask();
  const { status: serverStatus, serverUrl, checkHealth } = useServerHealth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedGorev = gorev.trim();
    if (!trimmedGorev || !selectedBusinessId) return;

    await sendTask({
      task: trimmedGorev,
      businessId: selectedBusinessId,
    });
  };

  const handleCancel = () => {
    cancelTask();
  };

  const getStatusConfig = () => {
    switch (serverStatus) {
      case "connected":
        return {
          icon: Wifi,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          label: "Bagli",
        };
      case "disconnected":
      case "error":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          label: "Baglanti yok",
        };
      case "checking":
      default:
        return {
          icon: RefreshCw,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
          label: "Kontrol ediliyor...",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent</h2>
          <p className="text-muted-foreground mt-2">Agenta gondermek istediginiz gorevi yazin.</p>
        </div>

        {/* Server Bağlantı Durumu */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
        >
          <StatusIcon
            className={`w-4 h-4 ${statusConfig.color} ${serverStatus === "checking" ? "animate-spin" : ""}`}
          />
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            {serverUrl && serverStatus === "connected" && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{serverUrl}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={serverStatus === "checking"}
            className="ml-1 h-6 w-6 p-0"
            title="Yeniden kontrol et"
          >
            <RefreshCw className={`w-3 h-3 ${serverStatus === "checking" ? "animate-spin" : ""}`} />
          </Button>
        </div>
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

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !gorev.trim() || !selectedBusinessId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calisiyor...
                  </>
                ) : (
                  "Gorevi gonder"
                )}
              </Button>
              {isSubmitting && (
                <Button type="button" variant="destructive" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Iptal
                </Button>
              )}
            </div>
          </form>

          {/* Heartbeat Göstergesi */}
          {isSubmitting && heartbeatCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Agent calisiyor... (Heartbeat: {heartbeatCount})
              </span>
            </div>
          )}

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
