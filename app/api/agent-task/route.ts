import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 dakika - streaming için artırıldı

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";
const FALLBACK_ENDPOINT = "https://learning-partially-rabbit.ngrok-free.app";

async function getAgentEndpoint(): Promise<string> {
  // If adminDb is not available, use fallback
  if (!adminDb) {
    console.warn("Firebase Admin not initialized, using fallback endpoint");
    return `${FALLBACK_ENDPOINT}/task`;
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();

      // Development modda testServerUrl kullan
      if (isDevelopment && data?.testServerUrl) {
        const testUrl = data.testServerUrl;
        if (typeof testUrl === "string" && testUrl.trim().length > 0) {
          console.log("Using TEST server URL (development mode)");
          const baseUrl = testUrl.trim().replace(/\/+$/, "");
          return `${baseUrl}/task`;
        }
      }

      // Production modda veya testServerUrl yoksa serverUrl kullan
      const serverUrl = data?.serverUrl;
      if (serverUrl && typeof serverUrl === "string" && serverUrl.trim().length > 0) {
        console.log("Using PRODUCTION server URL");
        const baseUrl = serverUrl.trim().replace(/\/+$/, "");
        return `${baseUrl}/task`;
      }
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
  }

  // Fallback to default endpoint
  return `${FALLBACK_ENDPOINT}/task`;
}

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

  const { task, business_id, task_id, extras } = body as { task?: unknown; business_id?: unknown; task_id?: unknown; extras?: unknown };

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
    const requestBody: { task: string; business_id: string; task_id?: string; extras?: Record<string, unknown> } = {
      task: task.trim(),
      business_id,
    };

    // task_id varsa ekle
    if (task_id && typeof task_id === "string") {
      requestBody.task_id = task_id;
    }

    // extras varsa ekle
    if (extras) {
      requestBody.extras = extras as Record<string, unknown>;
    }

    // Get dynamic endpoint from settings
    const agentEndpoint = await getAgentEndpoint();

    const externalResponse = await fetch(agentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      return NextResponse.json(
        {
          error: "Agent istegi basarisiz oldu.",
          details: errorText || `Durum kodu: ${externalResponse.status}`,
        },
        { status: externalResponse.status || 502 }
      );
    }

    // Stream response'u doğrudan proxy olarak ilet
    if (!externalResponse.body) {
      return NextResponse.json(
        { error: "Agent'tan yanit alinamadi." },
        { status: 502 }
      );
    }

    // Stream'i client'a ilet
    return new Response(externalResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
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
