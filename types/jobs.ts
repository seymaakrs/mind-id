import { Timestamp } from "firebase/firestore";

// Job types
export type JobType = "immediate" | "planned" | "routine";

// Interval types for routine jobs
export type IntervalType = "hourly" | "daily" | "weekly";

// Base job interface
interface BaseJob {
  id: string;
  type: JobType;
  task: string;
  businessId: string;
  createdAt: Timestamp;
}

// Immediate job - executed right away
export interface ImmediateJob extends BaseJob {
  type: "immediate";
  executedAt: Timestamp;
}

// Planned job - one-time scheduled execution
export interface PlannedJob extends BaseJob {
  type: "planned";
  scheduledAt: Timestamp;
  isExecuted: boolean;
  executedAt?: Timestamp;
}

// Routine job - recurring execution
export interface RoutineJob extends BaseJob {
  type: "routine";
  intervalType: IntervalType;
  intervalConfig: {
    // For hourly: every X hours (1-24)
    hours?: number;
    // For daily/weekly: hour of day (0-23)
    hour?: number;
    // For daily/weekly: minute (0-59)
    minute?: number;
    // For weekly: day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    dayOfWeek?: number;
  };
  lastExecutedAt?: Timestamp;
  isActive: boolean;
}

// Union type for all jobs
export type Job = ImmediateJob | PlannedJob | RoutineJob;

// Form data for creating jobs (without id and timestamps)
export interface CreateImmediateJobData {
  type: "immediate";
  task: string;
}

export interface CreatePlannedJobData {
  type: "planned";
  task: string;
  scheduledAt: Date;
}

export interface CreateRoutineJobData {
  type: "routine";
  task: string;
  intervalType: IntervalType;
  intervalConfig: {
    hours?: number;
    hour?: number;
    minute?: number;
    dayOfWeek?: number;
  };
}

export type CreateJobData = CreateImmediateJobData | CreatePlannedJobData | CreateRoutineJobData;

// Labels for UI
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  immediate: "Hemen",
  planned: "Planlanmis",
  routine: "Rutin",
};

export const INTERVAL_TYPE_LABELS: Record<IntervalType, string> = {
  hourly: "Saatlik",
  daily: "Gunluk",
  weekly: "Haftalik",
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Pazar",
  1: "Pazartesi",
  2: "Sali",
  3: "Carsamba",
  4: "Persembe",
  5: "Cuma",
  6: "Cumartesi",
};
