"use client";

import { ApiProvider, PROVIDER_INFO } from "@/types/statistics";
import { cn } from "@/lib/utils";
import {
  Eye,
  Sparkles,
  Wand2,
  Video,
  FileStack,
} from "lucide-react";

interface ApiSidebarProps {
  activeProvider: ApiProvider;
  onProviderChange: (provider: ApiProvider) => void;
}

const providerIcons: Record<ApiProvider, React.ElementType> = {
  all: Eye,
  openai: Sparkles,
  gemini: Wand2,
  veo: Video,
  cloudconvert: FileStack,
};

export function ApiSidebar({ activeProvider, onProviderChange }: ApiSidebarProps) {
  const providers: ApiProvider[] = [
    "all",
    "openai",
    "gemini",
    "veo",
    "cloudconvert",
  ];

  return (
    <div className="w-56 border-r border-border bg-muted/30 p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-2">
        API Servisleri
      </h3>
      <nav className="space-y-1">
        {providers.map((provider) => {
          const Icon = providerIcons[provider];
          const info = PROVIDER_INFO[provider];
          const isActive = activeProvider === provider;

          return (
            <button
              key={provider}
              onClick={() => onProviderChange(provider)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  isActive ? "bg-primary-foreground/20" : "bg-muted"
                )}
                style={{
                  backgroundColor: isActive ? undefined : `${info.color}20`,
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{
                    color: isActive ? "currentColor" : info.color,
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-primary-foreground" : "text-foreground"
                )}>
                  {info.label}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
