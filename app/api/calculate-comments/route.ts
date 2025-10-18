import { NextResponse } from "next/server";

const baseUrl = process.env.BASE_URL?.replace(/\/$/, "");

export async function GET(request: Request) {
  if (!baseUrl) {
    return NextResponse.json(
      {
        error: "BASE_URL tanimli degil. Sunucu ayarlarini kontrol edin.",
      },
      { status: 500 }
    );
  }

  const requestUrl = new URL(request.url);
  const targetUrl = new URL(`${baseUrl}/calculate-comments`);

  // Kuyruklardaki parametreleri dis servise de ilet
  requestUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  try {
    const externalResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseText = await externalResponse.text();

    if (!externalResponse.ok) {
      return NextResponse.json(
        {
          error: "Yorum kazanci hesabi basarisiz oldu.",
          details: responseText || `Durum kodu: ${externalResponse.status}`,
        },
        { status: externalResponse.status || 502 }
      );
    }

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = responseText;
    }

    return NextResponse.json(
      {
        success: true,
        data: parsedResponse,
        raw: responseText,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Webhooka ulasilamadi.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata.",
      },
      { status: 502 }
    );
  }
}
