import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";
const FALLBACK_ENDPOINT = "https://learning-partially-rabbit.ngrok-free.app";

async function getServerBaseUrl(): Promise<string> {
  if (!adminDb) {
    console.warn("Firebase Admin not initialized, using fallback endpoint");
    return FALLBACK_ENDPOINT;
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
          return testUrl.trim().replace(/\/+$/, "");
        }
      }

      // Production modda veya testServerUrl yoksa serverUrl kullan
      const serverUrl = data?.serverUrl;
      if (serverUrl && typeof serverUrl === "string" && serverUrl.trim().length > 0) {
        console.log("Using PRODUCTION server URL");
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
    const healthEndpoint = `${baseUrl}/health`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout

    const response = await fetch(healthEndpoint, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({
        status: "connected",
        details: data,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: `Server responded with status ${response.status}`,
      },
      { status: 502 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Connection timeout"
          : error.message
        : "Unknown error";

    return NextResponse.json(
      {
        status: "disconnected",
        message,
      },
      { status: 503 }
    );
  }
}
