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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
} from "lucide-react";
import { useAgentMemory } from "@/hooks";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/types/agent-memory";
import type { AdminNote } from "@/types/agent-memory";

interface AgentMemoryTabProps {
  businessId: string;
}

export function AgentMemoryTab({ businessId }: AgentMemoryTabProps) {
  const [newNote, setNewNote] = useState("");
  const [newNotePriority, setNewNotePriority] = useState<AdminNote["priority"]>("medium");
  const [addingNote, setAddingNote] = useState(false);

  // Agent note editing state
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const {
    memory,
    loading,
    error,
    fetchMemory,
    addAdminNote,
    toggleAdminNoteActive,
    deleteAdminNote,
    updateNote,
    deleteNote,
    reset,
  } = useAgentMemory();

  useEffect(() => {
    if (businessId) {
      fetchMemory(businessId);
    } else {
      reset();
    }
  }, [businessId, fetchMemory, reset]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !businessId) return;

    setAddingNote(true);
    try {
      await addAdminNote(businessId, newNote.trim(), newNotePriority);
      setNewNote("");
      setNewNotePriority("medium");
    } catch {
      // Error handled in hook
    } finally {
      setAddingNote(false);
    }
  };

  const handleEditNote = (index: number, noteText: string) => {
    setEditingNoteIndex(index);
    setEditingNoteText(noteText);
  };

  const handleSaveNote = async () => {
    if (editingNoteIndex === null || !editingNoteText.trim() || !businessId) return;

    setSavingNote(true);
    try {
      await updateNote(businessId, editingNoteIndex, editingNoteText.trim());
      setEditingNoteIndex(null);
      setEditingNoteText("");
    } catch {
      // Error handled in hook
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (index: number) => {
    if (!businessId) return;
    try {
      await deleteNote(businessId, index);
    } catch {
      // Error handled in hook
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!memory) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            Bu isletme icin agent hafizasi bulunamadi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Isletme Anlayisi */}
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

      {/* Icerik Analizleri */}
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

      {/* Ogrenilen Kaliplar */}
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

      {/* Agent Notlari */}
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
                  className="text-sm p-3 rounded-md bg-muted/50 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p>{note.note}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDate(note.added_at)}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(i, note.note)}
                        title="Duzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(i)}
                        className="text-destructive hover:text-destructive"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Henuz not yok</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Notlari - Full Width */}
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
                        onClick={() => toggleAdminNoteActive(businessId, i)}
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
                        onClick={() => deleteAdminNote(businessId, i)}
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

      {/* Agent Not Duzenleme Dialog */}
      <Dialog
        open={editingNoteIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNoteIndex(null);
            setEditingNoteText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Agent Notunu Duzenle
            </DialogTitle>
            <DialogDescription>
              Agent tarafindan eklenen notu duzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editingNoteText}
              onChange={(e) => setEditingNoteText(e.target.value)}
              placeholder="Not icerigi..."
              rows={4}
              disabled={savingNote}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNoteIndex(null);
                setEditingNoteText("");
              }}
              disabled={savingNote}
            >
              Iptal
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!editingNoteText.trim() || savingNote}
            >
              {savingNote ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
