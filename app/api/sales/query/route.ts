/**
 * Sales Query API — natural-language CRM questions for the mind-id chat panel.
 *
 * Pipeline:
 *   mind-id browser  ->  POST /api/sales/query  ->  mind-agent /task
 *                                                   (orchestrator routes to
 *                                                    sales_query_agent)
 *
 * The mind-agent must be configured with SALES_AGENTS_ENABLED=true and a
 * working NOCODB_* env set; otherwise the agent will return a structured
 * error which we forward unchanged.
 */
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";
const FALLBACK_ENDPOINT = "https://learning-partially-rabbit.ngrok-free.app";

interface SalesQueryRequestBody {
  question: string;
  // Sales queries are CRM-wide; business_id is optional and unused by the
  // sales_query_agent, but accepted for forward compatibility.
  business_id?: string;
}

async function resolveAgentEndpoint(): Promise<string> {
  try {
    const snap = await adminDb
      .collection(SETTINGS_COLLECTION)
      .doc(SETTINGS_DOC_ID)
      .get();
    const data = snap.data();
    const endpoint =
      (data?.agentEndpoint as string | undefined) ||
      (data?.agent_endpoint as string | undefined);
    if (typeof endpoint === "string" && endpoint.trim().length > 0) {
      return endpoint.replace(/\/$/, "");
    }
  } catch {
    // fall through
  }
  return FALLBACK_ENDPOINT;
}

export async function POST(req: Request) {
  const authResult = await verifyApiAuth(req);
  if (!authResult.success) {
    return authResult.response;
  }

  let body: SalesQueryRequestBody;
  try {
    body = (await req.json()) as SalesQueryRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const question = (body?.question || "").toString().trim();
  if (!question) {
    return NextResponse.json(
      { error: "`question` is required" },
      { status: 400 }
    );
  }
  if (question.length > 2_000) {
    return NextResponse.json(
      { error: "`question` exceeds 2000 character limit" },
      { status: 413 }
    );
  }

  const endpoint = await resolveAgentEndpoint();
  const taskId = `sales-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // We treat sales queries as a flavour of agent task; the orchestrator's
  // `sales_query_agent_tool` handles the routing on the mind-agent side.
  const taskPayload = {
    task: question,
    business_id: body.business_id || "global",
    task_id: taskId,
    extras: {
      kind: "sales_query",
      asked_at: new Date().toISOString(),
    },
  };

  try {
    const upstream = await fetch(`${endpoint}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskPayload),
      // The agent will stream-or-respond depending on its mode; we accept
      // either form by reading the body once and forwarding.
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: "Upstream agent returned an error",
          status: upstream.status,
          body: text,
        },
        { status: upstream.status }
      );
    }

    // Try JSON first, fall back to plain text.
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed, { status: 200 });
    } catch {
      return NextResponse.json(
        { answer: text, task_id: taskId },
        { status: 200 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to reach mind-agent",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
