import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

// NocoDB lead listesi — sunucu tarafı proxy (token tarayıcıya sızmaz).
// Sadece okuma. Net hata mesajları teşhis için kasıtlı.

const DEFAULT_BASE = "http://34.26.138.196";
const DEFAULT_TABLE = "m5lcgc5ifeqh38h"; // Leadler

export async function GET(request: NextRequest) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const base = (process.env.NOCODB_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  const table = process.env.NOCODB_LEADS_TABLE || DEFAULT_TABLE;
  const token = process.env.NOCODB_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error:
          "NocoDB API anahtarı tanımlı değil. Vercel ortam değişkeni NOCODB_API_TOKEN eklenmeli.",
      },
      { status: 500 }
    );
  }

  const url = `${base}/api/v2/tables/${table}/records?limit=200&sort=-CreatedAt`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      headers: { "xc-token": token, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `NocoDB yanıtı başarısız (HTTP ${res.status}). ${
            res.status === 401 || res.status === 403
              ? "Token geçersiz/yetkisiz olabilir."
              : "Tablo ID veya adres yanlış olabilir."
          }`,
          detail: text.slice(0, 300),
        },
        { status: 502 }
      );
    }

    let parsed: { list?: unknown[]; pageInfo?: unknown } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "NocoDB yanıtı beklenmedik biçimde (JSON değil).", detail: text.slice(0, 300) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      list: Array.isArray(parsed.list) ? parsed.list : [],
      pageInfo: parsed.pageInfo ?? null,
    });
  } catch (e) {
    clearTimeout(timeout);
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "NocoDB'ye ulaşılamadı (zaman aşımı). Sunucu bu adrese erişemiyor olabilir (ağ/IP kısıtı)."
          : "NocoDB'ye bağlanırken hata oluştu. Adres erişilemez olabilir.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
