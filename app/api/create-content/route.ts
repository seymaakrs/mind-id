import { NextResponse } from "next/server"

const baseUrl = process.env.BASE_URL?.replace(/\/$/, "")

export async function POST() {
  if (!baseUrl) {
    return NextResponse.json({ error: "BASE_URL tanimli degil. Sunucu ayarlarini kontrol edin." }, { status: 500 })
  }

  try {
    const externalResponse = await fetch(`${baseUrl}/create-content`, {
      method: "POST",
    })

    const responseText = await externalResponse.text()

    if (!externalResponse.ok) {
      return NextResponse.json(
        {
          error: "Icerik olusturma istegi basarisiz.",
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
        error: "Icerik olusturma servisine ulasilamadi.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata.",
      },
      { status: 502 },
    )
  }
}
