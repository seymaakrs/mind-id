import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 26;

const agentEndpoint = "https://learning-partially-rabbit.ngrok-free.app/task";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON istegi." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Gecersiz veri formati." }, { status: 400 });
  }

  const { task, business_id, extras } = body as { task?: unknown; business_id?: unknown; extras?: unknown };

  if (typeof task !== "string" || task.trim().length === 0) {
    return NextResponse.json({ error: "`task` alani zorunludur." }, { status: 400 });
  }

  if (typeof business_id !== "string" || business_id.trim().length === 0) {
    return NextResponse.json({ error: "`business_id` alani zorunludur." }, { status: 400 });
  }

  // extras opsiyonel, ama varsa obje olmali
  if (extras !== undefined && (typeof extras !== "object" || extras === null || Array.isArray(extras))) {
    return NextResponse.json({ error: "`extras` alani bir obje olmalidir." }, { status: 400 });
  }

  try {
    const requestBody: { task: string; business_id: string; extras?: Record<string, unknown> } = {
      task: task.trim(),
      business_id,
    };

    // extras varsa ekle
    if (extras) {
      requestBody.extras = extras as Record<string, unknown>;
    }

    const externalResponse = await fetch(agentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await externalResponse.text();

    if (!externalResponse.ok) {
      return NextResponse.json(
        {
          error: "Agent istegi basarisiz oldu.",
          details: responseText || `Durum kodu: ${externalResponse.status}`,
        },
        { status: externalResponse.status || 502 }
      );
    }

    let parsedResponse: unknown = null;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      // JSON parse edilemediyse hataya duselim.
    }

    if (!parsedResponse || typeof parsedResponse !== "object") {
      return NextResponse.json(
        {
          error: "Beklenmeyen yanit formati alindi.",
          details: responseText,
        },
        { status: 502 }
      );
    }

    const { output } = parsedResponse as { output?: unknown };

    if (typeof output !== "string") {
      return NextResponse.json(
        {
          error: "Beklenmeyen yanit formati alindi.",
          details: responseText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Agenta ulasilamadi.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata.",
      },
      { status: 502 }
    );
  }
}
