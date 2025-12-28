import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

const SETTINGS_DOC_ID = "app_settings";
const SETTINGS_COLLECTION = "settings";

type UseSettingsReturn = {
  settings: AppSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveSettings: () => Promise<boolean>;
  resetToDefaults: () => void;
};

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Ayarlar yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    []
  );

  const saveSettings = useCallback(async (): Promise<boolean> => {
    if (!db) {
      setError("Firebase bağlantısı bulunamadı.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      await setDoc(docRef, settings, { merge: true });
      return true;
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setError(null);
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    updateSetting,
    saveSettings,
    resetToDefaults,
  };
}
