import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { AgentInstructions, AgentConfig, PromptField } from "@/types/settings";
import { DEFAULT_AGENT_INSTRUCTIONS } from "@/types/settings";

const DOC_ID = "agent_instructions";
const COLLECTION = "settings";

type AgentKey = keyof AgentInstructions;

function deepMergeInstructions(
  defaults: AgentInstructions,
  data: Partial<AgentInstructions>
): AgentInstructions {
  const result = { ...defaults };
  for (const agentKey of ["image_agent", "video_agent"] as AgentKey[]) {
    if (data[agentKey]) {
      const agentData = data[agentKey] as Partial<AgentConfig>;
      result[agentKey] = {
        persona: agentData.persona ?? defaults[agentKey].persona,
        prompt_fields: {
          ...defaults[agentKey].prompt_fields,
          ...(agentData.prompt_fields ?? {}),
        },
      };
    }
  }
  return result;
}

type UseAgentInstructionsReturn = {
  instructions: AgentInstructions;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updatePersona: (agent: AgentKey, value: string) => void;
  updatePromptField: (
    agent: AgentKey,
    fieldKey: string,
    prop: keyof PromptField,
    value: PromptField[keyof PromptField]
  ) => void;
  saveInstructions: () => Promise<boolean>;
  resetToDefaults: () => void;
};

export function useAgentInstructions(): UseAgentInstructionsReturn {
  const [instructions, setInstructions] = useState<AgentInstructions>(
    DEFAULT_AGENT_INSTRUCTIONS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, COLLECTION, DOC_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<AgentInstructions>;
          setInstructions(deepMergeInstructions(DEFAULT_AGENT_INSTRUCTIONS, data));
        }
      } catch (err) {
        console.error("Error loading agent instructions:", err);
        setError("Agent talimatları yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updatePersona = useCallback((agent: AgentKey, value: string) => {
    setInstructions((prev) => ({
      ...prev,
      [agent]: { ...prev[agent], persona: value },
    }));
    setError(null);
  }, []);

  const updatePromptField = useCallback(
    (
      agent: AgentKey,
      fieldKey: string,
      prop: keyof PromptField,
      value: PromptField[keyof PromptField]
    ) => {
      setInstructions((prev) => ({
        ...prev,
        [agent]: {
          ...prev[agent],
          prompt_fields: {
            ...prev[agent].prompt_fields,
            [fieldKey]: {
              ...prev[agent].prompt_fields[fieldKey],
              [prop]: value,
            },
          },
        },
      }));
      setError(null);
    },
    []
  );

  const saveInstructions = useCallback(async (): Promise<boolean> => {
    if (!db) {
      setError("Firebase bağlantısı bulunamadı.");
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      const docRef = doc(db, COLLECTION, DOC_ID);
      await setDoc(docRef, instructions, { merge: true });
      return true;
    } catch (err) {
      console.error("Error saving agent instructions:", err);
      setError("Agent talimatları kaydedilirken hata oluştu.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [instructions]);

  const resetToDefaults = useCallback(() => {
    setInstructions(DEFAULT_AGENT_INSTRUCTIONS);
    setError(null);
  }, []);

  return {
    instructions,
    loading,
    saving,
    error,
    updatePersona,
    updatePromptField,
    saveInstructions,
    resetToDefaults,
  };
}
