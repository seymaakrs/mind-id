import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 26;

const agentEndpoint = "https://learning-partially-rabbit.ngrok-free.app/task";

const base_instruction =
  "instuction: kullanicinin isteklerini uygularken 1WkSzr8a4H36wsse7mh9ZIzbu_JjmGmRpMuribEO3jos id li dokumani toollarini kullanarak cekip oku. sonrasinda kullanicinin gorevlerini yerine getir.";

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

  const { task } = body as { task?: unknown };

  if (typeof task !== "string" || task.trim().length === 0) {
    return NextResponse.json({ error: "`task` alani zorunludur." }, { status: 400 });
  }

  const normalizedTask = task.trim();
  const taskWithPrefix = normalizedTask.toLowerCase().startsWith("task:")
    ? normalizedTask
    : `task: ${normalizedTask}`;

  const combinedTask = `${base_instruction}\n\n${taskWithPrefix}`;

  try {
    const externalResponse = await fetch(agentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: combinedTask }),
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
