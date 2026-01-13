import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import {
  getBusinessJobs,
  addBusinessJob,
  updateBusinessJob,
  deleteBusinessJob,
} from "@/lib/firebase/firestore";
import type {
  Job,
  ImmediateJob,
  PlannedJob,
  RoutineJob,
  CreateJobData,
} from "@/types/jobs";

type UseJobsReturn = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: (businessId: string) => Promise<void>;
  createJob: (businessId: string, data: CreateJobData) => Promise<string | null>;
  toggleRoutineJob: (businessId: string, jobId: string, isActive: boolean) => Promise<boolean>;
  removeJob: (businessId: string, jobId: string) => Promise<boolean>;
  reset: () => void;
};

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (businessId: string) => {
    if (!businessId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching jobs for business:", businessId);
      const fetchedJobs = await getBusinessJobs(businessId);
      console.log("Fetched jobs:", fetchedJobs);

      // Sort by createdAt descending
      fetchedJobs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
      setJobs(fetchedJobs);
    } catch (err) {
      console.error("Jobs fetch error:", err);
      setError("Gorevler yuklenirken hata olustu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(
    async (businessId: string, data: CreateJobData): Promise<string | null> => {
      if (!businessId) {
        setError("Isletme ID'si gerekli.");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Explicitly construct job object with type field first
        const baseJob = {
          type: data.type,
          task: data.task,
          businessId,
        };

        let jobData: Record<string, unknown>;

        if (data.type === "immediate") {
          jobData = {
            ...baseJob,
            executedAt: Timestamp.now(),
          };
        } else if (data.type === "planned") {
          jobData = {
            ...baseJob,
            scheduledAt: Timestamp.fromDate(data.scheduledAt),
            isExecuted: false,
          };
        } else {
          // routine
          jobData = {
            ...baseJob,
            intervalType: data.intervalType,
            intervalConfig: data.intervalConfig,
            isActive: true,
          };
        }

        console.log("Creating job with data:", jobData);
        const jobId = await addBusinessJob(businessId, jobData as Omit<Job, "id">);
        console.log("Job created with ID:", jobId);

        // Refresh jobs list
        await fetchJobs(businessId);

        return jobId;
      } catch (err) {
        console.error("Job create error:", err);
        setError("Gorev olusturulurken hata olustu.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobs]
  );

  const toggleRoutineJob = useCallback(
    async (businessId: string, jobId: string, isActive: boolean): Promise<boolean> => {
      try {
        await updateBusinessJob(businessId, jobId, { isActive });
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId && job.type === "routine"
              ? { ...job, isActive }
              : job
          )
        );
        return true;
      } catch (err) {
        console.error("Job toggle error:", err);
        setError("Gorev durumu degistirilirken hata olustu.");
        return false;
      }
    },
    []
  );

  const removeJob = useCallback(
    async (businessId: string, jobId: string): Promise<boolean> => {
      try {
        await deleteBusinessJob(businessId, jobId);
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
        return true;
      } catch (err) {
        console.error("Job delete error:", err);
        setError("Gorev silinirken hata olustu.");
        return false;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setJobs([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    toggleRoutineJob,
    removeJob,
    reset,
  };
}
