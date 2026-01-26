"use client";

import { useState, useCallback } from "react";
import { getAgentMemory, updateAgentMemory } from "@/lib/firebase/firestore";
import type { AgentMemory, AdminNote } from "@/types/agent-memory";

export function useAgentMemory() {
  const [memory, setMemory] = useState<AgentMemory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemory = useCallback(async (businessId: string) => {
    if (!businessId) {
      setMemory(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAgentMemory(businessId);
      setMemory(data);
    } catch (err) {
      console.error("Agent memory fetch error:", err);
      setError("Agent hafizasi yuklenirken hata olustu");
      setMemory(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAdminNote = useCallback(
    async (businessId: string, note: string, priority: AdminNote["priority"]) => {
      if (!memory) return;

      const newNote: AdminNote = {
        note,
        priority,
        added_at: new Date().toISOString(),
        active: true,
      };

      const updatedNotes = [...(memory.admin_notes || []), newNote];

      try {
        await updateAgentMemory(businessId, { admin_notes: updatedNotes });
        setMemory((prev) => (prev ? { ...prev, admin_notes: updatedNotes } : null));
      } catch (err) {
        console.error("Admin note add error:", err);
        throw err;
      }
    },
    [memory]
  );

  const toggleAdminNoteActive = useCallback(
    async (businessId: string, noteIndex: number) => {
      if (!memory || !memory.admin_notes) return;

      const updatedNotes = memory.admin_notes.map((note, index) =>
        index === noteIndex ? { ...note, active: !note.active } : note
      );

      try {
        await updateAgentMemory(businessId, { admin_notes: updatedNotes });
        setMemory((prev) => (prev ? { ...prev, admin_notes: updatedNotes } : null));
      } catch (err) {
        console.error("Admin note toggle error:", err);
        throw err;
      }
    },
    [memory]
  );

  const deleteAdminNote = useCallback(
    async (businessId: string, noteIndex: number) => {
      if (!memory || !memory.admin_notes) return;

      const updatedNotes = memory.admin_notes.filter((_, index) => index !== noteIndex);

      try {
        await updateAgentMemory(businessId, { admin_notes: updatedNotes });
        setMemory((prev) => (prev ? { ...prev, admin_notes: updatedNotes } : null));
      } catch (err) {
        console.error("Admin note delete error:", err);
        throw err;
      }
    },
    [memory]
  );

  const updateNote = useCallback(
    async (businessId: string, noteIndex: number, newNoteText: string) => {
      if (!memory || !memory.notes) return;

      const updatedNotes = memory.notes.map((note, index) =>
        index === noteIndex ? { ...note, note: newNoteText } : note
      );

      try {
        await updateAgentMemory(businessId, { notes: updatedNotes });
        setMemory((prev) => (prev ? { ...prev, notes: updatedNotes } : null));
      } catch (err) {
        console.error("Note update error:", err);
        throw err;
      }
    },
    [memory]
  );

  const deleteNote = useCallback(
    async (businessId: string, noteIndex: number) => {
      if (!memory || !memory.notes) return;

      const updatedNotes = memory.notes.filter((_, index) => index !== noteIndex);

      try {
        await updateAgentMemory(businessId, { notes: updatedNotes });
        setMemory((prev) => (prev ? { ...prev, notes: updatedNotes } : null));
      } catch (err) {
        console.error("Note delete error:", err);
        throw err;
      }
    },
    [memory]
  );

  const reset = useCallback(() => {
    setMemory(null);
    setError(null);
  }, []);

  return {
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
  };
}
