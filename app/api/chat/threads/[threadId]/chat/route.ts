import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// mind-agent (Cloud Run) /task endpoint. CHAT_API_URL is the env name kept for
// backwards compat; set it to the Cloud Run base URL in Vercel.
const AGENT_API_URL =
  process.env.CHAT_API_URL ||
  process.env.AGENT_API_URL ||
  "https://agents-sdk-api-704233028546.us-central1.run.app";

interface FrontendBody {
  message: string;
  model?: string;
  system_prompt?: string;
  stream?: boolean;
  business_id?: string;
  references?: unknown;
}

interface AgentResultEvent {
  type: "result";
  success: boolean;
  output?: string;
  error?: string;
  thread_id?: string;
  log_path?: string;
}

// Read NDJSON stream from mind-agent /task and return the final result event.
async function readAgentResult(
  body: ReadableStream<Uint8Array>
): Promise<AgentResultEvent | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: AgentResultEvent | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const evt = JSON.parse(trimmed);
          if (evt.type === "result") finalResult = evt as AgentResultEvent;
        } catch {
          // ignore malformed line
        }
      }
    }
    if (buffer.trim()) {
      try {
        const evt = JSON.parse(buffer.trim());
        if (evt.type === "result") finalResult = evt as AgentResultEvent;
      } catch {
        // ignore
      }
    }
  } finally {
    reader.releaseLock();
  }
  return finalResult;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) return authResult.response;

  const { threadId } = await params;

  let body: FrontendBody;
  try {
    body = (await request.json()) as FrontendBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!body?.message) {
    return NextResponse.json({ error: "message alanı zorunlu." }, { status: 400 });
  }

  const isStream = body.stream === true;

  // Translate frontend body -> mind-agent /task body
  const upstreamBody: Record<string, unknown> = {
    task: body.message,
    thread_id: threadId,
  };
  if (body.business_id) upstreamBody.business_id = body.business_id;
  if (body.references) upstreamBody.references = body.references;

  let upstream: Response;
  try {
    upstream = await fetch(`${AGENT_API_URL}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Agent servisine ulaşılamadı.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Agent ${upstream.status}: ${errText.slice(0, 500)}` },
      { status: upstream.status || 502 }
    );
  }

  const result = await readAgentResult(upstream.body);
  if (!result) {
    return NextResponse.json(
      { error: "Agent sonucu alınamadı (stream boş)." },
      { status: 502 }
    );
  }
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Agent çalışması başarısız." },
      { status: 500 }
    );
  }

  const messageId = `msg-${Date.now()}`;
  const content = result.output ?? "";
  const resolvedThreadId = result.thread_id || threadId;
  const createdAt = new Date().toISOString();

  if (isStream) {
    // Convert single result to SSE format the frontend expects.
    const sseStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const chunk1 = `data: ${JSON.stringify({ content, message_id: messageId, done: false })}\n\n`;
        const chunk2 = `data: ${JSON.stringify({ done: true, message_id: messageId })}\n\n`;
        controller.enqueue(encoder.encode(chunk1));
        controller.enqueue(encoder.encode(chunk2));
        controller.close();
      },
    });
    return new NextResponse(sseStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Non-stream: return ChatResponse shape expected by lib/chat-api.ts
  return NextResponse.json({
    thread_id: resolvedThreadId,
    message: {
      id: messageId,
      role: "assistant",
      content,
      model: body.model || "mind-agent",
      tool_calls: null,
      tool_call_id: null,
      created_at: createdAt,
    },
  });
}
