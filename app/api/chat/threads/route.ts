import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Thread CRUD is currently stateless — the agent (mind-agent /task) accepts
// any thread_id and threads its conversation by that id. Persistence of
// thread metadata / history is handled later (see TODO: Firestore-backed thread store).

interface CreateThreadBody {
  title?: string;
}

export async function POST(request: Request) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  let body: CreateThreadBody = {};
  try {
    body = (await request.json()) as CreateThreadBody;
  } catch {
    body = {};
  }

  const now = new Date().toISOString();
  const thread = {
    id: randomUUID(),
    title: body.title || "Yeni Sohbet",
    created_at: now,
    updated_at: now,
  };
  return NextResponse.json(thread);
}

export async function GET(request: Request) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;
  // No persistent thread list yet — return empty so UI doesn't error.
  return NextResponse.json([]);
}
