"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { BrandIdentity } from "@/lib/brandIdentity";

export interface BusinessSummary {
  loading: boolean;
  /** brand_identity'nin doluluk oranı (0-100). null = henüz okunmadı */
  brandCompleteness: number | null;
  /** En son task'in createdAt timestamp'i (ISO) — yoksa null */
  lastActivity: string | null;
  /** Toplam tamamlanmis task sayisi (placeholder; ileride genisletilebilir) */
  hasBrandIdentity: boolean;
}

/**
 * Brand identity'nin doluluk yüzdesini hesapla.
 * Pydantic schema'sındaki ana alt-objeler: basics, visual, voice, audience,
 * content_strategy, business_context. Her birinin "anlamlı şekilde dolu"
 * olup olmadığını kontrol eder.
 */
function computeCompleteness(bi: BrandIdentity | null): number {
  if (!bi) return 0;
  const sections = [
    bi.basics,
    bi.visual,
    bi.voice,
    bi.audience,
    bi.content_strategy,
    bi.business_context,
  ];
  let filled = 0;
  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    // Bölümde en az 1 non-null, non-empty alan varsa "dolu" sayılır
    const hasValue = Object.values(section).some((v) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return true;
    });
    if (hasValue) filled += 1;
  }
  return Math.round((filled / sections.length) * 100);
}

/**
 * İşletme kart özetini Firestore'dan çeker (3 paralel sorgu):
 * - brand_identity/v1 (doluluk %)
 * - son task (createdAt)
 *
 * Backend REST API per-business CRM filtresi yok — sıcak lead sayısı
 * şimdilik kart başına gösterilemiyor (Sales sekmesinde global olarak var).
 */
export function useBusinessSummary(businessId: string): BusinessSummary {
  const [summary, setSummary] = useState<BusinessSummary>({
    loading: true,
    brandCompleteness: null,
    lastActivity: null,
    hasBrandIdentity: false,
  });

  useEffect(() => {
    let cancelled = false;
    if (!businessId || !db) {
      setSummary((s) => ({ ...s, loading: false }));
      return;
    }

    (async () => {
      try {
        const [brandSnap, taskSnap] = await Promise.all([
          getDoc(doc(db!, "businesses", businessId, "brand_identity", "v1")),
          getDocs(
            query(
              collection(db!, "businesses", businessId, "tasks"),
              orderBy("createdAt", "desc"),
              limit(1)
            )
          ),
        ]);

        if (cancelled) return;

        const brand = brandSnap.exists()
          ? (brandSnap.data() as BrandIdentity)
          : null;
        const completeness = computeCompleteness(brand);

        let lastActivity: string | null = null;
        if (!taskSnap.empty) {
          const data = taskSnap.docs[0].data() as { createdAt?: { toDate?: () => Date } | string };
          const raw = data.createdAt;
          if (raw && typeof raw === "object" && typeof raw.toDate === "function") {
            lastActivity = raw.toDate().toISOString();
          } else if (typeof raw === "string") {
            lastActivity = raw;
          }
        }

        setSummary({
          loading: false,
          brandCompleteness: completeness,
          lastActivity,
          hasBrandIdentity: brand !== null,
        });
      } catch {
        if (!cancelled) {
          setSummary({
            loading: false,
            brandCompleteness: null,
            lastActivity: null,
            hasBrandIdentity: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return summary;
}

/** "5 dk önce", "3 saat önce", "2 gün önce" formatına çevirir. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Hiç";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} gün önce`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} ay önce`;
  return `${Math.floor(mo / 12)} yıl önce`;
}
