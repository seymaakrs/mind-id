import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stateless thread metadata — see app/api/chat/threads/route.ts comment.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;
  const { threadId } = await params;
  const now = new Date().toISOString();
  return NextResponse.json({
    id: threadId,
    title: "Sohbet",
    created_at: now,
    updated_at: now,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;
  await params;
  return NextResponse.json({ success: true });
}
