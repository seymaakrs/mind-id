import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No persistent message history yet — return empty array so the UI can render.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;
  await params;
  return NextResponse.json([]);
}
