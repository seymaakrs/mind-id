import { NextResponse } from "next/server"
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth"
import { fetchSalesOperations } from "@/lib/sales/fetch-sales-operations"
import { SalesOperationsResponseSchema } from "@/types/sales-operations"

export const runtime = "nodejs"
export const maxDuration = 26

export async function GET(request: Request) {
  const authResult = await verifyApiAuth(request)
  if (!authResult.success) {
    return authResult.response
  }

  try {
    const data = await fetchSalesOperations()
    const parsed = SalesOperationsResponseSchema.safeParse(data)
    if (!parsed.success) {
      console.error("[sales-operations] schema mismatch", parsed.error.flatten())
      return NextResponse.json(
        { success: false, error: "Yanıt şeması doğrulanamadı" },
        { status: 500 }
      )
    }
    return NextResponse.json(parsed.data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Satış operasyon verisi alınamadı"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
