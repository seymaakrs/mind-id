import type { RepoKey } from "../topology/types"

/** Referans görseldeki neon dal renkleri */
export const BRANCH_COLORS: Record<RepoKey | "root", string> = {
  root: "#facc15",
  "mind-id": "#fb923c",
  "mind-agent": "#f472b6",
  "mindid-nocodb": "#4ade80",
  customer_agent: "#e879f9",
}

export const BRANCH_LABELS: Record<RepoKey | "root", string> = {
  root: "MindID",
  "mind-id": "Panel",
  "mind-agent": "Ajanlar",
  "mindid-nocodb": "Veri",
  customer_agent: "Satış",
}
