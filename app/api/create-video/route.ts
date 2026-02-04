import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

const baseUrl = process.env.BASE_URL?.replace(/\/$/, "");

export async function POST(request: Request) {
  // Verify authentication
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  if (!baseUrl) {
    return NextResponse.json(
      { error: "BASE_URL tanimli degil. Sunucu ayarlarini kontrol edin." },
      { status: 500 }
    );
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

  const { avatar_id, voice_id } = body as {
    avatar_id?: string;
    voice_id?: string;
  };

  if (!avatar_id || !voice_id) {
    return NextResponse.json(
      { error: "`avatar_id` ve `voice_id` alanlari zorunludur." },
      { status: 400 }
    );
  }

  const payload = {
    avatar_id,
    voice_id,
  };

  try {
    const externalResponse = await fetch(`${baseUrl}/create-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await externalResponse.text();

    if (!externalResponse.ok) {
      return NextResponse.json(
        {
          error: "Video olusturma istegi basarisiz oldu.",
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
