import { NextResponse } from "next/server";
import { adminDb, getSignedUrl } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Streaming için zorunlu
export const maxDuration = 300; // 5 dakika - streaming için artırıldı

// Source media type from frontend
interface SourceMediaItem {
  id: string;
  type: string;
  public_url: string;
  storage_path: string;
  file_name: string;
  prompt_summary?: string;
  signed_url?: string;
}

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";
const FALLBACK_ENDPOINT = "https://learning-partially-rabbit.ngrok-free.app";

/**
 * Validate storage path to prevent path traversal and unauthorized access
 * Valid patterns:
 * - businesses/{businessId}/...
 * - images/{businessId}/...
 * - videos/{businessId}/...
 *
 * @param storagePath - The storage path to validate
 * @param businessId - The expected business ID that should match in the path
 * @returns true if valid, false otherwise
 */
function validateStoragePath(storagePath: string, businessId: string): boolean {
  // Check for path traversal attempts
  if (storagePath.includes("..") || storagePath.startsWith("/")) {
    return false;
  }

  // Validate path pattern matches business ID
  const validPrefixes = [
    `businesses/${businessId}/`,
    `images/${businessId}/`,
    `videos/${businessId}/`,
  ];

  const isValidPrefix = validPrefixes.some((prefix) => storagePath.startsWith(prefix));

  if (!isValidPrefix) {
    return false;
  }

  // Additional validation: path should not be empty after prefix
  const matchedPrefix = validPrefixes.find((prefix) => storagePath.startsWith(prefix));
  if (matchedPrefix) {
    const remainder = storagePath.substring(matchedPrefix.length);
    if (remainder.trim().length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Process source_media items and generate signed URLs for storage_path
 * Signed URLs expire in 60 minutes
 *
 * @param sourceMedia - Media items to process
 * @param businessId - Business ID for path validation
 * @returns Processed items with signed URLs, or throws on invalid path
 */
async function processSourceMedia(
  sourceMedia: SourceMediaItem | SourceMediaItem[],
  businessId: string
): Promise<SourceMediaItem[]> {
  // Normalize to array
  const items = Array.isArray(sourceMedia) ? sourceMedia : [sourceMedia];

  // Validate all storage paths first
  for (const item of items) {
    if (item.storage_path && !validateStoragePath(item.storage_path, businessId)) {
      throw new Error(`Geçersiz depolama yolu: ${item.storage_path}`);
    }
  }

  // Generate signed URLs in parallel
  const processedItems = await Promise.all(
    items.map(async (item) => {
      if (item.storage_path) {
        const signedUrl = await getSignedUrl(item.storage_path, 60);
        if (signedUrl) {
          return {
            ...item,
            signed_url: signedUrl,
          };
        }
      }
      return item;
    })
  );

  return processedItems;
}

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
  // Verify authentication
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

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

    // extras varsa işle
    if (extras) {
      const processedExtras = { ...(extras as Record<string, unknown>) };

      // source_media varsa signed URL'leri oluştur
      if (processedExtras.source_media) {
        try {
          const processedMedia = await processSourceMedia(
            processedExtras.source_media as SourceMediaItem | SourceMediaItem[],
            business_id
          );
          processedExtras.source_media = processedMedia;
        } catch (error) {
          console.error("Error processing source_media:", error);
          // Storage path validation hatası - 400 döndür
          if (error instanceof Error && error.message.startsWith("Geçersiz depolama yolu")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
          // Diğer hatalar için devam et, orijinal verileri kullan
        }
      }

      requestBody.extras = processedExtras;
    }

    // Get dynamic endpoint from settings
    const agentEndpoint = await getAgentEndpoint();

    // AbortController ile timeout yönetimi (5 dakika)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const externalResponse = await fetch(agentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/x-ndjson",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    clearTimeout(timeoutId);

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
    // Not: TransformStream kullanmadan direkt body'yi pass etmek daha performanslıdır
    // ancak Next.js/Node ortamında uyumluluk için direkt response body kullanımı önerilir.
    // Next.js App Router streaming hack: Iterator kullan
    async function* makeIterator() {
      // @ts-expect-error - externalResponse.body is a stream in Node environment
      for await (const chunk of externalResponse.body) {
        yield chunk;
      }
    }

    // @ts-expect-error - Next.js supports iterator as body
    return new NextResponse(makeIterator(), {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
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
