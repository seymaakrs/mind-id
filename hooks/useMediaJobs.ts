"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { MediaJob, MediaJobCreate } from "@/types/media-jobs"
import {
  createMediaJob,
  getMediaJobs,
  getMediaJob,
  deleteMediaJob,
} from "@/lib/chat-api"

const POLL_INTERVAL = 5000

export function useMediaJobs(threadId: string | null) {
  const [jobs, setJobs] = useState<MediaJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const fetchJobs = useCallback(async () => {
    if (!threadId) return
    setIsLoading(true)
    try {
      const data = await getMediaJobs(threadId)
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job'lar yüklenemedi")
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  const createJob = useCallback(async (data: MediaJobCreate) => {
    if (!threadId) return null
    setIsCreating(true)
    setError(null)
    try {
      const job = await createMediaJob(threadId, data)
      setJobs((prev) => [job, ...prev])
      return job
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job oluşturulamadı")
      return null
    } finally {
      setIsCreating(false)
    }
  }, [threadId])

  const removeJob = useCallback(async (jobId: string) => {
    if (!threadId) return
    try {
      await deleteMediaJob(threadId, jobId)
      setJobs((prev) => prev.filter((j) => j.id !== jobId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job silinemedi")
    }
  }, [threadId])

  const refreshJob = useCallback(async (jobId: string) => {
    if (!threadId) return
    try {
      const updated = await getMediaJob(threadId, jobId)
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)))
    } catch {
      // silently fail for individual refresh
    }
  }, [threadId])

  // Poll processing jobs
  useEffect(() => {
    const hasProcessing = jobs.some((j) => j.status === "pending" || j.status === "processing")

    if (hasProcessing && threadId) {
      pollRef.current = setInterval(async () => {
        const processingJobs = jobs.filter((j) => j.status === "pending" || j.status === "processing")
        for (const job of processingJobs) {
          try {
            const updated = await getMediaJob(threadId, job.id)
            setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
          } catch {
            // skip
          }
        }
      }, POLL_INTERVAL)
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobs, threadId])

  // Fetch jobs when threadId changes
  useEffect(() => {
    if (threadId) {
      fetchJobs()
    } else {
      setJobs([])
    }
  }, [threadId, fetchJobs])

  return {
    jobs,
    isLoading,
    isCreating,
    error,
    clearError,
    fetchJobs,
    createJob,
    removeJob,
    refreshJob,
  }
}
