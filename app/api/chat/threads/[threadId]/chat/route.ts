import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CHAT_API_URL = process.env.CHAT_API_URL || "http://localhost:8000";

// POST /api/chat/threads/:threadId/chat - Mesaj gönder (normal + stream)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  const { threadId } = await params;

  try {
    const body = await request.json();
    const isStream = body.stream === true;

    const response = await fetch(`${CHAT_API_URL}/api/threads/${threadId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    // Stream: SSE passthrough
    if (isStream && response.body) {
      return new NextResponse(response.body as ReadableStream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Non-stream: JSON response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Chat servisine ulaşılamadı.", details: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 502 }
    );
  }
}
