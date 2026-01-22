"use client";

import { Settings, Save, RotateCcw, Loader2, Server, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks";
import { SETTINGS_LABELS, SETTINGS_DESCRIPTIONS } from "@/types/settings";
import type { AppSettings } from "@/types/settings";

type SettingFieldProps = {
  settingKey: keyof AppSettings;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function SettingField({ settingKey, value, onChange, disabled }: SettingFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={settingKey}>{SETTINGS_LABELS[settingKey]}</Label>
      <Input
        id={settingKey}
        placeholder={SETTINGS_DESCRIPTIONS[settingKey]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">{SETTINGS_DESCRIPTIONS[settingKey]}</p>
    </div>
  );
}

export default function SettingsPanel() {
  const { settings, loading, saving, error, updateSetting, saveSettings, resetToDefaults } =
    useSettings();

  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      // Could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Ayarlar</h2>
            <p className="text-muted-foreground">Model ve sunucu yapılandırmaları</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Sıfırla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Model Ayarları
          </CardTitle>
          <CardDescription>
            İçerik üretimi ve agent'lar için kullanılacak AI modelleri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingField
              settingKey="imageGenerationModel"
              value={settings.imageGenerationModel}
              onChange={(v) => updateSetting("imageGenerationModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="videoGenerationModel"
              value={settings.videoGenerationModel}
              onChange={(v) => updateSetting("videoGenerationModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="imageAgentModel"
              value={settings.imageAgentModel}
              onChange={(v) => updateSetting("imageAgentModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="videoAgentModel"
              value={settings.videoAgentModel}
              onChange={(v) => updateSetting("videoAgentModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="orchestratorModel"
              value={settings.orchestratorModel}
              onChange={(v) => updateSetting("orchestratorModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="vertexAiModel"
              value={settings.vertexAiModel}
              onChange={(v) => updateSetting("vertexAiModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="marketingModel"
              value={settings.marketingModel}
              onChange={(v) => updateSetting("marketingModel", v)}
              disabled={saving}
            />
            <SettingField
              settingKey="webAgentModel"
              value={settings.webAgentModel}
              onChange={(v) => updateSetting("webAgentModel", v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Server Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Sunucu Ayarları
          </CardTitle>
          <CardDescription>API sunucu yapılandırması</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingField
            settingKey="serverUrl"
            value={settings.serverUrl}
            onChange={(v) => updateSetting("serverUrl", v)}
            disabled={saving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
