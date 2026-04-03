import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";
const FALLBACK_ENDPOINT = "https://learning-partially-rabbit.ngrok-free.app";

async function getServerBaseUrl(): Promise<string> {
  if (!adminDb) {
    return FALLBACK_ENDPOINT;
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  try {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();

      if (isDevelopment && data?.testServerUrl) {
        const testUrl = data.testServerUrl;
        if (typeof testUrl === "string" && testUrl.trim().length > 0) {
          return testUrl.trim().replace(/\/+$/, "");
        }
      }

      const serverUrl = data?.serverUrl;
      if (serverUrl && typeof serverUrl === "string" && serverUrl.trim().length > 0) {
        return serverUrl.trim().replace(/\/+$/, "");
      }
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
  }

  return FALLBACK_ENDPOINT;
}

export async function GET() {
  try {
    const baseUrl = await getServerBaseUrl();
    const endpoint = `${baseUrl}/capabilities`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: `Server responded with status ${response.status}` },
      { status: 502 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Connection timeout"
          : error.message
        : "Unknown error";

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
