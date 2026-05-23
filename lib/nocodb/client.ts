/**
 * NocoDB v2 REST client (server-only).
 * Env: NOCODB_BASE_URL, NOCODB_API_TOKEN
 */

export interface NocoDBListResult {
  list?: Record<string, unknown>[]
  pageInfo?: { totalRows?: number; isLastPage?: boolean }
}

function getConfig(): { baseUrl: string; token: string } | null {
  const baseUrl = process.env.NOCODB_BASE_URL?.trim().replace(/\/+$/, "")
  const token = process.env.NOCODB_API_TOKEN?.trim()
  if (!baseUrl || !token) return null
  return { baseUrl, token }
}

export function isNocoDBConfigured(): boolean {
  return getConfig() !== null
}

export function getLeadsTableId(): string {
  return process.env.NOCODB_LEADS_TABLE_ID?.trim() || "m5lcgc5ifeqh38h"
}

async function nocoRequest<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const config = getConfig()
  if (!config) {
    throw new Error("NocoDB yapılandırılmamış")
  }

  const url = new URL(`${config.baseUrl}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }

  const response = await fetch(url.toString(), {
    headers: {
      "xc-token": config.token,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`NocoDB ${response.status}: ${text.slice(0, 200)}`)
  }

  return response.json() as Promise<T>
}

export async function listLeadRecords(
  limit = 100
): Promise<Record<string, unknown>[]> {
  const tableId = getLeadsTableId()
  if (!tableId) return []

  const result = await nocoRequest<NocoDBListResult>(
    `/api/v2/tables/${tableId}/records`,
    { limit, sort: "-UpdatedAt" }
  )

  return result.list ?? []
}
