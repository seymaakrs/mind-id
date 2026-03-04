"use client";

import { useState } from "react";
import {
  Bot,
  Save,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Image,
  Video,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAgentInstructions } from "@/hooks";
import {
  PROMPT_FIELD_LABELS,
  IMAGE_PROMPT_FIELD_KEYS,
  VIDEO_PROMPT_FIELD_KEYS,
} from "@/types/settings";
import type { AgentInstructions, PromptField } from "@/types/settings";

type AgentKey = keyof AgentInstructions;

const AGENT_CONFIG = {
  image_agent: {
    label: "Resim Agent",
    icon: Image,
    keys: IMAGE_PROMPT_FIELD_KEYS,
  },
  video_agent: {
    label: "Video Agent",
    icon: Video,
    keys: VIDEO_PROMPT_FIELD_KEYS,
  },
} as const;

function examplesArrayToText(examples: (string | string[])[]): string {
  return examples
    .map((ex) => (Array.isArray(ex) ? ex.join(", ") : ex))
    .join("\n");
}

function textToExamplesArray(text: string): (string | string[])[] {
  if (!text.trim()) return [];
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      if (line.includes(",") && line.startsWith("#")) {
        return line.split(",").map((s) => s.trim());
      }
      return line.trim();
    });
}

export default function AgentSettings() {
  const {
    instructions,
    loading,
    saving,
    error,
    updatePersona,
    updatePromptField,
    saveInstructions,
    resetToDefaults,
  } = useAgentInstructions();

  const [expandedAgent, setExpandedAgent] = useState<AgentKey | null>(null);

  const toggleAgent = (agent: AgentKey) => {
    setExpandedAgent((prev) => (prev === agent ? null : agent));
  };

  const handleSave = async () => {
    await saveInstructions();
  };

  const handleExamplesChange = (
    agent: AgentKey,
    fieldKey: string,
    text: string
  ) => {
    updatePromptField(agent, fieldKey, "examples", textToExamplesArray(text));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agent Ayarları
            </CardTitle>
            <CardDescription className="mt-1.5">
              Resim ve video agent&apos;larının talimat ve prompt ayarları
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Sıfırla
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {(Object.keys(AGENT_CONFIG) as AgentKey[]).map((agentKey) => {
          const config = AGENT_CONFIG[agentKey];
          const Icon = config.icon;
          const isExpanded = expandedAgent === agentKey;
          const agent = instructions[agentKey];

          return (
            <div
              key={agentKey}
              className="border rounded-lg overflow-hidden"
            >
              {/* Agent Header - Toggle */}
              <button
                type="button"
                onClick={() => toggleAgent(agentKey)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Icon className="w-4 h-4" />
                  {config.label}
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Agent Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-6 border-t">
                  {/* Persona */}
                  <div className="space-y-2 pt-4">
                    <Label htmlFor={`${agentKey}-persona`}>Persona</Label>
                    <Textarea
                      id={`${agentKey}-persona`}
                      placeholder="Agent persona tanımı..."
                      value={agent.persona}
                      onChange={(e) =>
                        updatePersona(agentKey, e.target.value)
                      }
                      disabled={saving}
                      className="min-h-20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Agent&apos;ın genel davranışını tanımlayan system prompt
                    </p>
                  </div>

                  {/* Prompt Fields */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Prompt Alanları
                    </h4>
                    <div className="space-y-4">
                      {config.keys.map((fieldKey) => {
                        const field: PromptField =
                          agent.prompt_fields[fieldKey] ?? {
                            description: "",
                            examples: [],
                          };
                        return (
                          <div
                            key={fieldKey}
                            className="rounded-md border p-4 space-y-3"
                          >
                            <Label className="text-sm font-medium">
                              {PROMPT_FIELD_LABELS[fieldKey] ?? fieldKey}
                            </Label>

                            {/* Description */}
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`${agentKey}-${fieldKey}-desc`}
                                className="text-xs text-muted-foreground"
                              >
                                Açıklama
                              </Label>
                              <Textarea
                                id={`${agentKey}-${fieldKey}-desc`}
                                placeholder="Bu alanın açıklaması..."
                                value={field.description}
                                onChange={(e) =>
                                  updatePromptField(
                                    agentKey,
                                    fieldKey,
                                    "description",
                                    e.target.value
                                  )
                                }
                                disabled={saving}
                                className="min-h-16 text-sm"
                              />
                            </div>

                            {/* Examples */}
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`${agentKey}-${fieldKey}-examples`}
                                className="text-xs text-muted-foreground"
                              >
                                Örnekler (her satır bir örnek)
                              </Label>
                              <Textarea
                                id={`${agentKey}-${fieldKey}-examples`}
                                placeholder="Örnek 1&#10;Örnek 2"
                                value={examplesArrayToText(field.examples)}
                                onChange={(e) =>
                                  handleExamplesChange(
                                    agentKey,
                                    fieldKey,
                                    e.target.value
                                  )
                                }
                                disabled={saving}
                                className="min-h-16 text-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
