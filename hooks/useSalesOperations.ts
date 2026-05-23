"use client"

import { useState, useEffect, useCallback } from "react"
import { authenticatedFetch } from "@/lib/api-client"
import {
  SalesOperationsResponseSchema,
  type SalesOperationsResponse,
} from "@/types/sales-operations"

const POLL_MS = 60_000

interface UseSalesOperationsReturn {
  data: SalesOperationsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSalesOperations(enabled = true): UseSalesOperationsReturn {
  const [data, setData] = useState<SalesOperationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)

    try {
      const response = await authenticatedFetch("/api/sales-operations")
      const json = await response.json()

      if (!response.ok) {
        const msg =
          (json as { error?: string }).error ||
          `HTTP ${response.status}`
        setError(msg)
        setData(null)
        return
      }

      const parsed = SalesOperationsResponseSchema.safeParse(json)
      if (!parsed.success) {
        setError("Satış verisi şeması geçersiz")
        setData(null)
        return
      }

      setData(parsed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı hatası")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    refetch()
    const id = setInterval(refetch, POLL_MS)
    return () => clearInterval(id)
  }, [enabled, refetch])

  return { data, loading, error, refetch }
}
