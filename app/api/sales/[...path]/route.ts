/**
 * Sales REST API proxy — Portal → mind-agent /sales/*
 *
 * Bu route token'i sunucu tarafinda tutar (browser'a sizmaz).
 * Mind-agent endpoint URL'i agent-task route.ts ile ayni mantikla
 * Firestore settings/app_settings.serverUrl'den alinir.
 *
 * Auth: SALES_API_TOKEN env var (mind-agent ile paylasilan secret).
 *
 * Akis:
 *   browser: GET /api/sales/leads/count?asama=Sicak
 *   ↓
 *   bu route: GET {serverUrl}/sales/leads/count?asama=Sicak
 *             + Authorization: Bearer SALES_API_TOKEN
 *   ↓
 *   mind-agent: deterministik rapor (NocoDB)
 *   ↓
 *   browser: JSON
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";
const FALLBACK_ENDPOINT = "https://learning-partially-rabbit.ngrok-free.app";

export const maxDuration = 15;

async function getAgentBaseUrl(): Promise<string> {
  if (!adminDb) return FALLBACK_ENDPOINT;
  try {
    const snap = await adminDb
      .collection(SETTINGS_COLLECTION)
      .doc(SETTINGS_DOC_ID)
      .get();
    if (!snap.exists) return FALLBACK_ENDPOINT;
    const data = snap.data();
    const isDev = process.env.NODE_ENV === "development";
    const url =
      (isDev && typeof data?.testServerUrl === "string" && data.testServerUrl) ||
      (typeof data?.serverUrl === "string" && data.serverUrl) ||
      FALLBACK_ENDPOINT;
    return url.trim().replace(/\/+$/, "");
  } catch {
    return FALLBACK_ENDPOINT;
  }
}

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const token = process.env.SALES_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "SALES_API_TOKEN env eksik — proxy disabled." },
      { status: 503 }
    );
  }

  const { path } = await ctx.params;
  const subpath = (path || []).join("/");
  const baseUrl = await getAgentBaseUrl();
  const search = req.nextUrl.search;
  const target = `${baseUrl}/sales/${subpath}${search}`;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Proxy failed",
        detail: err instanceof Error ? err.message : "unknown",
        target,
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx);
}
