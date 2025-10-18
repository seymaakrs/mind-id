import { NextResponse } from "next/server"

const baseUrl = process.env.BASE_URL?.replace(/\/$/, "")

export async function POST(request: Request) {
  if (!baseUrl) {
    return NextResponse.json({ error: "BASE_URL tanimli degil. Sunucu ayarlarini kontrol edin." }, { status: 500 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON istegi." }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Gecersiz veri formati." }, { status: 400 })
  }

  const { link, type } = body as { link?: string; type?: string }

  if (!link || !type) {
    return NextResponse.json({ error: "`link` ve `type` alanlari zorunludur." }, { status: 400 })
  }

  try {
    const externalResponse = await fetch(`${baseUrl}/add-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ link, type }),
    })

    const responseText = await externalResponse.text()

    if (!externalResponse.ok) {
      return NextResponse.json(
        {
          error: "Webhook baglantisi basarisiz.",
          details: responseText || `Durum kodu: ${externalResponse.status}`,
        },
        { status: externalResponse.status || 502 },
      )
    }

    let parsedResponse: unknown

    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = responseText
    }

    return NextResponse.json(
      {
        success: true,
        data: parsedResponse,
        raw: responseText,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: "Webhooka ulasilamadi.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata.",
      },
      { status: 502 },
    )
  }
}
