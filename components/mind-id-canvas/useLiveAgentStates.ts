"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToActiveTasks } from "@/lib/firebase/firestore";
import type { ActiveTask } from "@/types/active-tasks";
import type { AgentStatus } from "./data/agentGraph";

/**
 * Canlı agent durumları — Firestore `active_tasks` koleksiyonunu dinler
 * ve her aktif görevi ilgili canvas node'una (agent) map eder.
 *
 * Mapping stratejisi:
 *  - `current_step` (tool ismi) → en spesifik node
 *  - task text fallback (sales/lead/outreach/marka anahtar kelimeleri)
 *  - Bir görev çalıştığında zincir aktive olur:
 *      portal → api → orchestrator → ilgili expert
 *
 * Görev biten ~3 sn `completed` görünür, sonra `idle`'a döner.
 */

type StateMap = Record<string, AgentStatus>;

interface LiveLog {
  text: string;
  at: number;
}

export interface LiveAgentResult {
  states: StateMap;
  logs: string[];
  /** Firestore subscribe başarılı mı? false → fallback mock'a düşülebilir. */
  connected: boolean;
  /** Şu anki aktif task sayısı (snapshot). */
  activeCount: number;
}

const COMPLETED_LINGER_MS = 3000;

/** Tool ismi → canvas node id eşlemesi (regex). */
const TOOL_TO_NODE: Array<[RegExp, string]> = [
  [/^generate_image|^image_/i, "image_agent"],
  [/^generate_video|^video_|add_audio_to_video/i, "video_agent"],
  [/^post_on_|^post_carousel|marketing|save_(instagram|youtube)_post/i, "marketing_agent"],
  [/^scrape_|^web_search|save_(swot|seo)/i, "analysis_agent"],
  [/^upsert_lead|^create_lead|^update_lead|^log_lead/i, "sales-mind-agent-bridge"],
  [/^count_leads|^list_leads|^lead_funnel|^channel_breakdown|^stale_leads|^lead_timeline|^daily_digest|^outreach_status|^outreach_health|^auto_reply_status|^fetch_brand_identity/i, "sales-mind-agent-bridge"],
  [/^send_whatsapp|^send_message|zernio/i, "sales-meta-lead"],
  [/^fetch_business|^get_document|^save_document|^upload_file/i, "firestore"],
];

/** Task açıklama metninde sales anahtar kelimeleri varsa sales tarafını aydınlat. */
const SALES_KEYWORDS = /sicak lead|hot lead|outreach|kampanya|takip|itiraz|reklam|meta lead|n8n/i;
const CONTENT_KEYWORDS = /post|gorsel|video|reels|carousel|marka|caption/i;

function mapTaskToNodes(task: ActiveTask): string[] {
  const nodes = new Set<string>(["user", "portal-mind-id"]);

  // Zincir: panel → API → orchestrator hep aktif
  nodes.add("api-agent-task");
  nodes.add("orchestrator");

  // current_step varsa en spesifik
  if (task.current_step) {
    for (const [rgx, nodeId] of TOOL_TO_NODE) {
      if (rgx.test(task.current_step)) {
        nodes.add(nodeId);
        break;
      }
    }
  }

  // Task metninden ek aktivasyon
  const t = (task.task || "").toLowerCase();
  if (SALES_KEYWORDS.test(t)) {
    nodes.add("sales-panel");
    nodes.add("sales-mind-agent-bridge");
    nodes.add("nocodb-leads");
  }
  if (CONTENT_KEYWORDS.test(t)) {
    nodes.add("panel-agent");
  } else {
    nodes.add("panel-agent");
  }

  return Array.from(nodes);
}

function statusFromTask(task: ActiveTask): AgentStatus {
  switch (task.status) {
    case "running":
      return "running";
    case "success":
      return "completed";
    case "failed":
      return "blocked";
    default:
      return "idle";
  }
}

function format(task: ActiveTask): string {
  const ts = new Date(task.last_activity_at || task.started_at).toLocaleTimeString("tr-TR");
  const step = task.current_step ? ` · ${task.current_step}` : "";
  const head = task.task?.slice(0, 60) || "task";
  return `[${ts}] ${task.status.toUpperCase()}${step} — ${head}`;
}

export function useLiveAgentStates(): LiveAgentResult {
  const [states, setStates] = useState<StateMap>({});
  const [logs, setLogs] = useState<string[]>([
    "> Canvas canli moda gecti — Firestore active_tasks dinleniyor.",
  ]);
  const [connected, setConnected] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const seenLogIds = useRef<Set<string>>(new Set());
  const completedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const unsub = subscribeToActiveTasks(
      (tasks) => {
        setConnected(true);
        setActiveCount(tasks.filter((t) => t.status === "running").length);

        // Yeni state map: önce bütün node'ları idle yap, sonra aktiflere bas
        const next: StateMap = {};
        const newLogs: string[] = [];

        for (const task of tasks) {
          const nodeIds = mapTaskToNodes(task);
          const st = statusFromTask(task);
          for (const nid of nodeIds) {
            // running > completed > blocked > idle önceliği
            const prev = next[nid];
            if (!prev || prev === "idle") {
              next[nid] = st;
            } else if (prev !== "running" && st === "running") {
              next[nid] = "running";
            }
          }

          // Yeni log (id+status_change bazli dedupe)
          const logKey = `${task.id}:${task.status}:${task.current_step ?? ""}`;
          if (!seenLogIds.current.has(logKey)) {
            seenLogIds.current.add(logKey);
            newLogs.push(format(task));
          }

          // Completed olanlar 3sn sonra idle'a düşsün
          if (st === "completed" || st === "blocked") {
            const key = task.id;
            const prevTimer = completedTimers.current.get(key);
            if (prevTimer) clearTimeout(prevTimer);
            const timer = setTimeout(() => {
              setStates((s) => {
                const copy = { ...s };
                for (const nid of nodeIds) {
                  if (copy[nid] === "completed" || copy[nid] === "blocked") {
                    copy[nid] = "idle";
                  }
                }
                return copy;
              });
              completedTimers.current.delete(key);
            }, COMPLETED_LINGER_MS);
            completedTimers.current.set(key, timer);
          }
        }

        setStates(next);
        if (newLogs.length > 0) {
          setLogs((prev) => [...prev.slice(-50), ...newLogs].slice(-60));
        }
      },
      (err) => {
        setConnected(false);
        setLogs((prev) => [
          ...prev,
          `> Firestore baglanti hatasi: ${err.message}`,
        ].slice(-60));
      }
    );

    return () => {
      unsub();
      completedTimers.current.forEach((t) => clearTimeout(t));
      completedTimers.current.clear();
    };
  }, []);

  return { states, logs, connected, activeCount };
}
