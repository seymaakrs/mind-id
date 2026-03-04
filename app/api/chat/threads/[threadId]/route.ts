import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAT_API_URL = process.env.CHAT_API_URL || "http://localhost:8000";

// GET /api/chat/threads/:threadId - Thread detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  const { threadId } = await params;

  try {
    const response = await fetch(`${CHAT_API_URL}/api/threads/${threadId}`, {
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

// DELETE /api/chat/threads/:threadId - Thread sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  const { threadId } = await params;

  try {
    const response = await fetch(`${CHAT_API_URL}/api/threads/${threadId}`, {
      method: "DELETE",
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
