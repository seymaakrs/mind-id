/**
 * Firebase Functions for scheduled job execution
 */

import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Set global options
setGlobalOptions({ maxInstances: 10 });

// Types for jobs
interface BaseJob {
  id: string;
  businessId: string;
  task: string;
  createdAt: Timestamp;
}

interface PlannedJob extends BaseJob {
  type: "planned";
  scheduledAt: Timestamp;
  isExecuted: boolean;
  executedAt?: Timestamp;
}

interface RoutineJob extends BaseJob {
  type: "routine";
  intervalType: "hourly" | "daily" | "weekly";
  intervalConfig: {
    hours?: number;
    hour?: number;
    minute?: number;
    dayOfWeek?: number;
  };
  lastExecutedAt?: Timestamp;
  isActive: boolean;
}

type Job = PlannedJob | RoutineJob | { type: "immediate" };

// Task types for tracking executions
type TaskStatus = "pending" | "running" | "completed" | "failed";
type TaskType = "immediate" | "planned" | "routine";

/**
 * Check if running in test/emulator mode
 */
function isTestEnvironment(): boolean {
  // Firebase emulator detection
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  // Custom environment variable for test mode
  if (process.env.USE_TEST_SERVER === "true") return true;
  return false;
}

/**
 * Get server URL from Firestore settings
 * Uses testServerUrl for development, serverUrl for production
 */
async function getServerUrl(): Promise<string | null> {
  try {
    const settingsDoc = await db.collection("settings").doc("app_settings").get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const isTest = isTestEnvironment();

      if (isTest && data?.testServerUrl) {
        logger.info("Using TEST server URL");
        return data.testServerUrl;
      }

      logger.info("Using PRODUCTION server URL");
      return data?.serverUrl || null;
    }
    return null;
  } catch (error) {
    logger.error("Error fetching server URL:", error);
    return null;
  }
}

/**
 * Create a task document for tracking job execution
 */
async function createTaskForJob(
  businessId: string,
  task: string,
  jobType: TaskType,
  jobId?: string
): Promise<string> {
  const tasksRef = db.collection("businesses").doc(businessId).collection("tasks");
  const taskDoc = await tasksRef.add({
    businessId,
    type: jobType,
    task,
    jobId: jobId || null,
    status: "pending" as TaskStatus,
    createdAt: FieldValue.serverTimestamp(),
  });
  return taskDoc.id;
}

/**
 * Update task status after execution
 */
async function updateTaskStatusAdmin(
  businessId: string,
  taskId: string,
  status: TaskStatus,
  error?: string
): Promise<void> {
  const taskRef = db.collection("businesses").doc(businessId).collection("tasks").doc(taskId);
  const updateData: Record<string, unknown> = {
    status,
    ...(status === "running" ? { startedAt: FieldValue.serverTimestamp() } : {}),
    ...((status === "completed" || status === "failed") ? { completedAt: FieldValue.serverTimestamp() } : {}),
    ...(error ? { error } : {}),
  };
  await taskRef.update(updateData);
}

/**
 * Send task to the backend server
 */
async function sendTaskToBackend(
  serverUrl: string,
  task: string,
  businessId: string,
  taskId: string
): Promise<boolean> {
  try {
    // Update task status to running
    await updateTaskStatusAdmin(businessId, taskId, "running");

    const response = await fetch(`${serverUrl}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
        business_id: businessId,
        task_id: taskId,
      }),
    });

    if (!response.ok) {
      logger.error(`Backend responded with status ${response.status}`);
      await updateTaskStatusAdmin(businessId, taskId, "failed", `Backend responded with status ${response.status}`);
      return false;
    }

    // For streaming responses, we just need to confirm it started successfully
    // The backend will update the task status when complete
    logger.info(`Task sent successfully for business ${businessId}, taskId: ${taskId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending task to backend:`, error);
    await updateTaskStatusAdmin(businessId, taskId, "failed", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

/**
 * Check if a routine job should be executed based on its interval
 */
function shouldExecuteRoutineJob(job: RoutineJob, now: Date): boolean {
  if (!job.isActive) return false;

  const lastExecuted = job.lastExecutedAt?.toDate();
  const config = job.intervalConfig;

  switch (job.intervalType) {
    case "hourly": {
      // Execute every N hours
      const hours = config.hours || 1;
      if (!lastExecuted) return true;

      const hoursSinceLastExecution =
        (now.getTime() - lastExecuted.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastExecution >= hours;
    }

    case "daily": {
      // Execute at specific hour:minute every day
      const targetHour = config.hour ?? 9;
      const targetMinute = config.minute ?? 0;

      // Check if we're within the execution window (current hour matches target)
      if (now.getHours() !== targetHour) return false;
      if (Math.abs(now.getMinutes() - targetMinute) > 30) return false;

      // Check if already executed today
      if (lastExecuted) {
        const sameDay =
          lastExecuted.getFullYear() === now.getFullYear() &&
          lastExecuted.getMonth() === now.getMonth() &&
          lastExecuted.getDate() === now.getDate();
        if (sameDay) return false;
      }
      return true;
    }

    case "weekly": {
      // Execute on specific day at specific hour:minute
      const targetDay = config.dayOfWeek ?? 1; // Monday default
      const targetHour = config.hour ?? 9;
      const targetMinute = config.minute ?? 0;

      // Check if it's the correct day
      if (now.getDay() !== targetDay) return false;

      // Check if we're within the execution window
      if (now.getHours() !== targetHour) return false;
      if (Math.abs(now.getMinutes() - targetMinute) > 30) return false;

      // Check if already executed this week
      if (lastExecuted) {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (lastExecuted > weekAgo) return false;
      }
      return true;
    }

    default:
      return false;
  }
}

/**
 * Process all jobs for all businesses
 * Runs every hour to check for due jobs
 */
export const processScheduledJobs = onSchedule({
  schedule: "*/15 * * * *",  // Her saatin 00, 15, 30, 45 dakikalarında
  timeZone: "Europe/Istanbul",
  retryCount: 3,
}, async () => {
  logger.info("Starting scheduled job processing...");

  // Get server URL
  const serverUrl = await getServerUrl();
  if (!serverUrl) {
    logger.error("No server URL configured. Skipping job processing.");
    return;
  }

  logger.info(`Using server URL: ${serverUrl}`);

  const now = new Date();
  let processedCount = 0;
  let errorCount = 0;

  try {
    // Get all businesses
    const businessesSnapshot = await db.collection("businesses").get();
    logger.info(`Found ${businessesSnapshot.size} businesses`);

    for (const businessDoc of businessesSnapshot.docs) {
      const businessId = businessDoc.id;

      // Get jobs for this business
      const jobsSnapshot = await db
        .collection("businesses")
        .doc(businessId)
        .collection("jobs")
        .get();

      for (const jobDoc of jobsSnapshot.docs) {
        const job = { id: jobDoc.id, ...jobDoc.data() } as Job;

        // Skip immediate jobs (they are already executed)
        if (job.type === "immediate") continue;

        try {
          if (job.type === "planned") {
            const plannedJob = job as PlannedJob;

            // Check if job should be executed
            if (!plannedJob.isExecuted) {
              const scheduledTime = plannedJob.scheduledAt.toDate();
              if (scheduledTime <= now) {
                logger.info(
                  `Executing planned job ${jobDoc.id} for business ${businessId}`
                );

                // Create task for tracking
                const taskId = await createTaskForJob(
                  businessId,
                  plannedJob.task,
                  "planned",
                  jobDoc.id
                );

                const success = await sendTaskToBackend(
                  serverUrl,
                  plannedJob.task,
                  businessId,
                  taskId
                );

                if (success) {
                  // Mark as executed
                  await jobDoc.ref.update({
                    isExecuted: true,
                    executedAt: FieldValue.serverTimestamp(),
                  });
                  processedCount++;
                  logger.info(`Planned job ${jobDoc.id} executed successfully`);
                } else {
                  errorCount++;
                }
              }
            }
          } else if (job.type === "routine") {
            const routineJob = job as RoutineJob;

            if (shouldExecuteRoutineJob(routineJob, now)) {
              logger.info(
                `Executing routine job ${jobDoc.id} for business ${businessId}`
              );

              // Create task for tracking
              const taskId = await createTaskForJob(
                businessId,
                routineJob.task,
                "routine",
                jobDoc.id
              );

              const success = await sendTaskToBackend(
                serverUrl,
                routineJob.task,
                businessId,
                taskId
              );

              if (success) {
                // Update last executed time
                await jobDoc.ref.update({
                  lastExecutedAt: FieldValue.serverTimestamp(),
                });
                processedCount++;
                logger.info(`Routine job ${jobDoc.id} executed successfully`);
              } else {
                errorCount++;
              }
            }
          }
        } catch (jobError) {
          logger.error(
            `Error processing job ${jobDoc.id}:`,
            jobError
          );
          errorCount++;
        }
      }
    }
  } catch (error) {
    logger.error("Error processing scheduled jobs:", error);
    throw error;
  }

  logger.info(
    `Job processing complete. Processed: ${processedCount}, Errors: ${errorCount}`
  );
});

/**
 * Health check endpoint for testing
 */
export const healthCheck = onSchedule({
  schedule: "every 24 hours",
  timeZone: "Europe/Istanbul",
}, async () => {
  logger.info("Health check: Functions are running");
});

/**
 * Manual trigger for job processing (for testing)
 * Call: https://[region]-[project].cloudfunctions.net/runJobsNow
 */
export const runJobsNow = onRequest({
  cors: true,
}, async (req, res) => {
  logger.info("Manual job processing triggered");

  // Get server URL
  const serverUrl = await getServerUrl();
  if (!serverUrl) {
    logger.error("No server URL configured");
    res.status(500).json({
      success: false,
      error: "No server URL configured in settings/appSettings",
    });
    return;
  }

  logger.info(`Using server URL: ${serverUrl}`);

  const now = new Date();
  let processedCount = 0;
  let errorCount = 0;
  const results: Array<{ jobId: string; businessId: string; status: string; type: string }> = [];

  try {
    // Get all businesses
    const businessesSnapshot = await db.collection("businesses").get();
    logger.info(`Found ${businessesSnapshot.size} businesses`);

    for (const businessDoc of businessesSnapshot.docs) {
      const businessId = businessDoc.id;

      // Get jobs for this business
      const jobsSnapshot = await db
        .collection("businesses")
        .doc(businessId)
        .collection("jobs")
        .get();

      logger.info(`Business ${businessId}: found ${jobsSnapshot.size} jobs`);

      for (const jobDoc of jobsSnapshot.docs) {
        const jobData = jobDoc.data();
        const job = { id: jobDoc.id, ...jobData } as Job;

        logger.info(`Checking job ${jobDoc.id}, type: ${job.type}, data:`, jobData);

        // Skip immediate jobs
        if (job.type === "immediate") {
          results.push({
            jobId: jobDoc.id,
            businessId,
            status: "skipped",
            type: "immediate",
          });
          continue;
        }

        try {
          if (job.type === "planned") {
            const plannedJob = job as PlannedJob;

            if (!plannedJob.isExecuted) {
              const scheduledTime = plannedJob.scheduledAt?.toDate();
              logger.info(`Planned job ${jobDoc.id}: scheduledAt=${scheduledTime}, now=${now}, isExecuted=${plannedJob.isExecuted}`);

              if (scheduledTime && scheduledTime <= now) {
                logger.info(`Executing planned job ${jobDoc.id}`);

                // Create task for tracking
                const taskId = await createTaskForJob(
                  businessId,
                  plannedJob.task,
                  "planned",
                  jobDoc.id
                );

                const success = await sendTaskToBackend(
                  serverUrl,
                  plannedJob.task,
                  businessId,
                  taskId
                );

                if (success) {
                  await jobDoc.ref.update({
                    isExecuted: true,
                    executedAt: FieldValue.serverTimestamp(),
                  });
                  processedCount++;
                  results.push({
                    jobId: jobDoc.id,
                    businessId,
                    status: "executed",
                    type: "planned",
                  });
                } else {
                  errorCount++;
                  results.push({
                    jobId: jobDoc.id,
                    businessId,
                    status: "failed",
                    type: "planned",
                  });
                }
              } else {
                results.push({
                  jobId: jobDoc.id,
                  businessId,
                  status: "not_due",
                  type: "planned",
                });
              }
            } else {
              results.push({
                jobId: jobDoc.id,
                businessId,
                status: "already_executed",
                type: "planned",
              });
            }
          } else if (job.type === "routine") {
            const routineJob = job as RoutineJob;
            const shouldExecute = shouldExecuteRoutineJob(routineJob, now);

            logger.info(`Routine job ${jobDoc.id}: isActive=${routineJob.isActive}, shouldExecute=${shouldExecute}`);

            if (shouldExecute) {
              logger.info(`Executing routine job ${jobDoc.id}`);

              // Create task for tracking
              const taskId = await createTaskForJob(
                businessId,
                routineJob.task,
                "routine",
                jobDoc.id
              );

              const success = await sendTaskToBackend(
                serverUrl,
                routineJob.task,
                businessId,
                taskId
              );

              if (success) {
                await jobDoc.ref.update({
                  lastExecutedAt: FieldValue.serverTimestamp(),
                });
                processedCount++;
                results.push({
                  jobId: jobDoc.id,
                  businessId,
                  status: "executed",
                  type: "routine",
                });
              } else {
                errorCount++;
                results.push({
                  jobId: jobDoc.id,
                  businessId,
                  status: "failed",
                  type: "routine",
                });
              }
            } else {
              results.push({
                jobId: jobDoc.id,
                businessId,
                status: "not_due",
                type: "routine",
              });
            }
          } else {
            results.push({
              jobId: jobDoc.id,
              businessId,
              status: "unknown_type",
              type: String((job as { type?: string }).type || "unknown"),
            });
          }
        } catch (jobError) {
          logger.error(`Error processing job ${jobDoc.id}:`, jobError);
          errorCount++;
          results.push({
            jobId: jobDoc.id,
            businessId,
            status: "error",
            type: String((job as { type?: string }).type || "unknown"),
          });
        }
      }
    }
  } catch (error) {
    logger.error("Error:", error);
    res.status(500).json({ success: false, error: String(error) });
    return;
  }

  res.json({
    success: true,
    serverUrl,
    timestamp: now.toISOString(),
    processedCount,
    errorCount,
    results,
  });
});
