import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth"

const baseUrl = process.env.BASE_URL?.replace(/\/$/, "")

export async function POST(request: Request) {
  // Verify authentication
  const authResult = await verifyApiAuth(request)
  if (!authResult.success) {
    return authResult.response
  }

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

  const { group_id } = body as { group_id?: string }

  if (!group_id || !group_id.trim()) {
    return NextResponse.json({ error: "group_id zorunlu bir alandir." }, { status: 400 })
  }

  try {
    const sorguUrl = `${baseUrl}/pick-avatar?group_id=${encodeURIComponent(group_id.trim())}`

    const externalResponse = await fetch(sorguUrl, {
      method: "GET",
    })

    const responseText = await externalResponse.text()

    if (!externalResponse.ok) {
      return NextResponse.json(
        {
          error: "Avatar sorgusu basarisiz.",
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
        error: "Avatar servisine ulasilamadi.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata.",
      },
      { status: 502 },
    )
  }
}
