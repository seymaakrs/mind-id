import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAT_API_URL = process.env.CHAT_API_URL || "http://localhost:8000";

// POST /api/chat/threads/:threadId/media/jobs - Yeni media job oluştur
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  const { threadId } = await params;

  try {
    const body = await request.json();

    const response = await fetch(`${CHAT_API_URL}/api/threads/${threadId}/media/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Chat servisine ulaşılamadı.", details: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 502 }
    );
  }
}

// GET /api/chat/threads/:threadId/media/jobs - Media job listesi
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  const { threadId } = await params;

  try {
    const response = await fetch(`${CHAT_API_URL}/api/threads/${threadId}/media/jobs`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Chat servisine ulaşılamadı.", details: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 502 }
    );
  }
}
