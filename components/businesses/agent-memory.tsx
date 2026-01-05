"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Brain,
  Lightbulb,
  ListChecks,
  StickyNote,
  Shield,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Hash,
  MessageSquare,
  Target,
  Volume2,
} from "lucide-react";
import { useBusinesses, useAgentMemory } from "@/hooks";
import { BusinessSelector } from "@/components/shared/BusinessSelector";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/types/agent-memory";
import type { AdminNote } from "@/types/agent-memory";

export default function AgentMemoryComponent() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [newNote, setNewNote] = useState("");
  const [newNotePriority, setNewNotePriority] = useState<AdminNote["priority"]>("medium");
  const [addingNote, setAddingNote] = useState(false);

  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const {
    memory,
    loading,
    error,
    fetchMemory,
    addAdminNote,
    toggleAdminNoteActive,
    deleteAdminNote,
    reset,
  } = useAgentMemory();

  useEffect(() => {
    if (selectedBusinessId) {
      fetchMemory(selectedBusinessId);
    } else {
      reset();
    }
  }, [selectedBusinessId, fetchMemory, reset]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedBusinessId) return;

    setAddingNote(true);
    try {
      await addAdminNote(selectedBusinessId, newNote.trim(), newNotePriority);
      setNewNote("");
      setNewNotePriority("medium");
    } catch {
      // Error handled in hook
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (dateStr: string | { toDate: () => Date }) => {
    try {
      const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr.toDate();
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agent Hafizasi</h2>
        <p className="text-muted-foreground mt-2">
          Isletme agentinin ogrendigi bilgileri ve notlari goruntuleyın.
        </p>
      </div>

      {/* İşletme Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle>Isletme Secimi</CardTitle>
          <CardDescription>Agent hafizasini goruntulemek icin isletme secin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Isletme</Label>
            <BusinessSelector
              businesses={businesses}
              loading={loadingBusinesses}
              selectedId={selectedBusinessId}
              onSelect={setSelectedBusinessId}
              showPreview
              className="w-full max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedBusinessId && !memory && !error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              Bu isletme icin agent hafizasi bulunamadi.
            </p>
          </CardContent>
        </Card>
      )}

      {memory && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* İşletme Anlayışı */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Isletme Anlayisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {memory.business_understanding ? (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Ozet
                    </Label>
                    <p className="text-sm mt-1">{memory.business_understanding.summary || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Hedef Kitle
                    </Label>
                    <p className="text-sm mt-1">{memory.business_understanding.audience || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      Ses Tonu
                    </Label>
                    <p className="text-sm mt-1">{memory.business_understanding.voice_tone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Guclu Yonler</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.business_understanding.strengths?.length > 0 ? (
                        memory.business_understanding.strengths.map((strength, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {strength}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Veri bulunamadi</p>
              )}
            </CardContent>
          </Card>

          {/* İçerik Analizleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Icerik Analizleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {memory.content_insights ? (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">En Iyi Icerik Turleri</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.content_insights.best_performing_types?.length > 0 ? (
                        memory.content_insights.best_performing_types.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      En Iyi Paylasim Saatleri
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.content_insights.best_posting_times?.length > 0 ? (
                        memory.content_insights.best_posting_times.map((time, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Etkili Hashtagler
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.content_insights.effective_hashtags?.length > 0 ? (
                        memory.content_insights.effective_hashtags.map((tag, i) => (
                          <Badge key={i} className="text-xs bg-blue-500/10 text-blue-500">
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Calisan Caption Stilleri</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.content_insights.caption_styles_that_work?.length > 0 ? (
                        memory.content_insights.caption_styles_that_work.map((style, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {style}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Veri bulunamadi</p>
              )}
            </CardContent>
          </Card>

          {/* Öğrenilen Kalıplar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-green-500" />
                Ogrenilen Kaliplar
              </CardTitle>
              <CardDescription>Agent tarafindan ogrenilen davranis kaliplari (max 50)</CardDescription>
            </CardHeader>
            <CardContent>
              {memory.learned_patterns?.length > 0 ? (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {memory.learned_patterns.map((pattern, i) => (
                    <li
                      key={i}
                      className="text-sm p-2 rounded-md bg-muted/50 border border-border/50"
                    >
                      {pattern}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Henuz ogrenilen kalip yok</p>
              )}
            </CardContent>
          </Card>

          {/* Agent Notları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-orange-500" />
                Agent Notlari
              </CardTitle>
              <CardDescription>Agent tarafindan eklenen notlar</CardDescription>
            </CardHeader>
            <CardContent>
              {memory.notes?.length > 0 ? (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {memory.notes.map((note, i) => (
                    <li
                      key={i}
                      className="text-sm p-2 rounded-md bg-muted/50 border border-border/50"
                    >
                      <p>{note.note}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDate(note.added_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Henuz not yok</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Notları - Full Width */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                Admin Notlari
              </CardTitle>
              <CardDescription>
                Agent davranisini yonlendirmek icin notlar ekleyin. Genel bir davranis uzerine ekleyin, tek bir davranis uzerine degil. Ornegin alakasiz bir icerik planlar ise daha cok alakali icerikler planlamasini ornekler vererek yazin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Not Ekleme Formu */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="new-note" className="text-xs">
                    Yeni Not
                  </Label>
                  <Input
                    id="new-note"
                    placeholder="Agent icin yeni bir not ekleyin..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    disabled={addingNote}
                  />
                </div>
                <div className="w-32 space-y-1">
                  <Label className="text-xs">Oncelik</Label>
                  <Select
                    value={newNotePriority}
                    onValueChange={(v) => setNewNotePriority(v as AdminNote["priority"])}
                    disabled={addingNote}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Dusuk</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yuksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}>
                  {addingNote ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Not Listesi */}
              {memory.admin_notes?.length > 0 ? (
                <ul className="space-y-2">
                  {memory.admin_notes.map((note, i) => (
                    <li
                      key={i}
                      className={`p-3 rounded-md border ${
                        note.active ? "bg-muted/30" : "bg-muted/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${PRIORITY_COLORS[note.priority]}`}>
                              {PRIORITY_LABELS[note.priority]}
                            </Badge>
                            {!note.active && (
                              <Badge variant="outline" className="text-xs">
                                Pasif
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{note.note}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {formatDate(note.added_at)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAdminNoteActive(selectedBusinessId, i)}
                            title={note.active ? "Pasif yap" : "Aktif yap"}
                          >
                            {note.active ? (
                              <ToggleRight className="w-4 h-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAdminNote(selectedBusinessId, i)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henuz admin notu yok
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {memory.last_updated && (
                  <span>Son guncelleme: {formatDate(memory.last_updated)}</span>
                )}
                {memory.last_compacted && (
                  <span>Son sikistirma: {formatDate(memory.last_compacted)}</span>
                )}
                {memory.cleared_at && <span>Temizleme: {formatDate(memory.cleared_at)}</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
