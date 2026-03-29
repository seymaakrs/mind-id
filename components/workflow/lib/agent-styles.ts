import {
  Target,
  Palette,
  Film,
  Smartphone,
  BarChart3,
  Cog,
  type LucideIcon,
} from "lucide-react";

export interface AgentStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  label: string;
  avatar?: string;
}

export const AGENT_STYLES: Record<string, AgentStyle> = {
  orchestrator: {
    color: "oklch(0.488 0.243 264.376)",
    bgColor: "oklch(0.488 0.243 264.376 / 0.15)",
    borderColor: "oklch(0.488 0.243 264.376 / 0.5)",
    icon: Target,
    label: "Orkestratör",
    avatar: "/agents/orchestrator.png",
  },
  image_agent: {
    color: "oklch(0.627 0.265 303.9)",
    bgColor: "oklch(0.627 0.265 303.9 / 0.15)",
    borderColor: "oklch(0.627 0.265 303.9 / 0.5)",
    icon: Palette,
    label: "Görsel Agent",
    avatar: "/agents/image_agent.png",
  },
  video_agent: {
    color: "oklch(0.646 0.222 41.116)",
    bgColor: "oklch(0.646 0.222 41.116 / 0.15)",
    borderColor: "oklch(0.646 0.222 41.116 / 0.5)",
    icon: Film,
    label: "Video Agent",
    avatar: "/agents/video_agent.png",
  },
  marketing_agent: {
    color: "oklch(0.645 0.246 16.439)",
    bgColor: "oklch(0.645 0.246 16.439 / 0.15)",
    borderColor: "oklch(0.645 0.246 16.439 / 0.5)",
    icon: Smartphone,
    label: "Pazarlama Agent",
    avatar: "/agents/marketing_agent.png",
  },
  analysis_agent: {
    color: "oklch(0.696 0.17 162.48)",
    bgColor: "oklch(0.696 0.17 162.48 / 0.15)",
    borderColor: "oklch(0.696 0.17 162.48 / 0.5)",
    icon: BarChart3,
    label: "Analiz Agent",
    avatar: "/agents/analysis_agent.png",
  },
};

export const DEFAULT_TOOL_STYLE = {
  icon: Cog,
  color: "oklch(0.556 0 0)",
  bgColor: "oklch(0.556 0 0 / 0.1)",
  borderColor: "oklch(0.556 0 0 / 0.3)",
};

export function getAgentStyle(agentName: string): AgentStyle {
  return (
    AGENT_STYLES[agentName] ?? {
      color: "oklch(0.556 0.17 250)",
      bgColor: "oklch(0.556 0.17 250 / 0.15)",
      borderColor: "oklch(0.556 0.17 250 / 0.5)",
      icon: Target,
      label: agentName,
    }
  );
}
