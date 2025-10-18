"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video } from "lucide-react";

export default function VideoOlusturComponent() {
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [script, setScript] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [geriBildirim, setGeriBildirim] = useState<{
    tur: "basari" | "hata" | "bilgi";
    mesaj: string;
    raw?: string;
  } | null>(null);

  const handleCreate = async () => {
    const trimmedAvatarId = avatarId.trim();
    const trimmedVoiceId = voiceId.trim();

    if (!trimmedAvatarId || !trimmedVoiceId) {
      return;
    }

    setIsCreating(true);
    setGeriBildirim({
      tur: "bilgi",
      mesaj: "Video olusturuluyor...",
    });

    const payload = {
      avatar_id: trimmedAvatarId,
      voice_id: trimmedVoiceId,
    };

    try {
      const response = await fetch("/api/create-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const rawError = await response.text();
        let hataMesaji =
          rawError.trim().length > 0
            ? rawError
            : "Video olusturma istegi basarisiz oldu.";

        try {
          const hataJson = JSON.parse(rawError);
          if (typeof hataJson === "object" && hataJson !== null) {
            const hataObj = hataJson as { error?: unknown; details?: unknown };
            const temel =
              typeof hataObj.error === "string" ? hataObj.error : undefined;
            const detay =
              typeof hataObj.details === "string" ? hataObj.details : undefined;
            if (temel || detay) {
              hataMesaji = [temel, detay].filter(Boolean).join(": ");
            }
          }
        } catch {
          // Yaniti JSON olarak parse edemedik, orijinal mesaj kullanilacak.
        }

        setGeriBildirim({
          tur: "hata",
          mesaj: hataMesaji,
          raw: rawError.trim().length > 0 ? rawError : undefined,
        });
        return;
      }

      const responseText = await response.text();
      const trimmedResponseText = responseText.trim();
      let parsedResponse: unknown = null;

      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        // Yaniti JSON olarak parse edemedik, duz metin kullanilacak.
      }

      let gosterilecekMesaj = trimmedResponseText;
      let rawIcerik =
        parsedResponse && typeof parsedResponse === "object"
          ? JSON.stringify(parsedResponse, null, 2)
          : trimmedResponseText;

      if (parsedResponse && typeof parsedResponse === "object") {
        const sonucObj = parsedResponse as {
          message?: unknown;
          data?: unknown;
        };

        if (
          typeof sonucObj.message === "string" &&
          sonucObj.message.trim().length > 0
        ) {
          gosterilecekMesaj = sonucObj.message;
        } else if (typeof sonucObj.data === "string") {
          gosterilecekMesaj = sonucObj.data;
        } else if (sonucObj.data !== undefined) {
          try {
            gosterilecekMesaj = JSON.stringify(sonucObj.data, null, 2);
          } catch {
            gosterilecekMesaj = String(sonucObj.data);
          }
        } else {
          try {
            gosterilecekMesaj = JSON.stringify(parsedResponse, null, 2);
          } catch {
            gosterilecekMesaj = responseText;
          }
        }

        rawIcerik =
          rawIcerik.trim().length > 0 ? rawIcerik : trimmedResponseText;
      } else if (
        typeof parsedResponse === "string" &&
        parsedResponse.trim().length > 0
      ) {
        gosterilecekMesaj = parsedResponse;
      }

      if (!gosterilecekMesaj) {
        gosterilecekMesaj = "Video olusturma istegi tamamlandi.";
      }

      setGeriBildirim({
        tur: "basari",
        mesaj: "Video olusturma istegi tamamlandi.",
        raw: rawIcerik.trim().length > 0 ? rawIcerik.trim() : undefined,
      });

      setAvatarId("");
      setVoiceId("");
      setScript("");
    } catch (error) {
      setGeriBildirim({
        tur: "hata",
        mesaj:
          error instanceof Error
            ? error.message
            : "Video olusturulurken beklenmedik bir hata olustu.",
        raw:
          error instanceof Error && error.message
            ? error.message
            : undefined,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Video Olustur</h2>
        <p className="text-muted-foreground mt-2">HeyGen ile video olusturun</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Olusturma</CardTitle>
          <CardDescription>Avatar ve ses secerek video olusturun</CardDescription>
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
              placeholder="Video icin metin girin..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !avatarId || !voiceId}
            className="w-full"
            size="lg"
          >
            <Video className="w-5 h-5 mr-2" />
            {isCreating ? "Video Olusturuluyor..." : "Video Olustur"}
          </Button>
          {geriBildirim ? (
            <div className="space-y-2" aria-live="polite">
              <p
                className={`text-sm whitespace-pre-wrap break-words ${
                  geriBildirim.tur === "basari"
                    ? "text-green-600"
                    : geriBildirim.tur === "hata"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {geriBildirim.mesaj}
              </p>
              {geriBildirim.raw ? (
                <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
                  {geriBildirim.raw}
                </pre>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
