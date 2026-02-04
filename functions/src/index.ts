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

// Admin API key for HTTP function authentication
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

/**
 * Verify admin API key from x-admin-key header
 * Returns true if valid, false otherwise
 */
function verifyAdminApiKey(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  if (!ADMIN_API_KEY) {
    logger.warn("ADMIN_API_KEY not configured - all requests will be rejected");
    return false;
  }
  const providedKey = req.headers["x-admin-key"];
  return providedKey === ADMIN_API_KEY;
}

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
 * Get current time in Istanbul timezone
 */
function getIstanbulTime(date: Date): { hour: number; minute: number; day: number; dateStr: string } {
  const istanbulStr = date.toLocaleString("en-US", {
    timeZone: "Europe/Istanbul",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });

  // Parse the Istanbul time string
  const parts = istanbulStr.split(", ");
  const dayOfWeek = parts[0]; // "Mon", "Tue", etc.
  const datePart = parts[1]; // "01/25/2024"
  const timePart = parts[2]; // "19:00"

  const [hourStr, minuteStr] = timePart.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Convert day name to number (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
    "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
  };
  const day = dayMap[dayOfWeek] ?? 0;

  return { hour, minute, day, dateStr: datePart };
}

/**
 * Check if a routine job should be executed based on its interval
 */
function shouldExecuteRoutineJob(job: RoutineJob, now: Date): boolean {
  if (!job.isActive) return false;

  const lastExecuted = job.lastExecutedAt?.toDate();
  const config = job.intervalConfig;

  // Get Istanbul time for comparison
  const istanbulNow = getIstanbulTime(now);

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
      // Execute at specific hour:minute every day (Istanbul time)
      const targetHour = config.hour ?? 9;
      const targetMinute = config.minute ?? 0;

      // Check if we're within the execution window (current hour matches target)
      if (istanbulNow.hour !== targetHour) return false;
      if (Math.abs(istanbulNow.minute - targetMinute) > 30) return false;

      // Check if already executed today (Istanbul time)
      if (lastExecuted) {
        const lastExecutedIstanbul = getIstanbulTime(lastExecuted);
        if (lastExecutedIstanbul.dateStr === istanbulNow.dateStr) return false;
      }
      return true;
    }

    case "weekly": {
      // Execute on specific day at specific hour:minute (Istanbul time)
      const targetDay = config.dayOfWeek ?? 1; // Monday default
      const targetHour = config.hour ?? 9;
      const targetMinute = config.minute ?? 0;

      // Check if it's the correct day (Istanbul time)
      if (istanbulNow.day !== targetDay) return false;

      // Check if we're within the execution window (Istanbul time)
      if (istanbulNow.hour !== targetHour) return false;
      if (Math.abs(istanbulNow.minute - targetMinute) > 30) return false;

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

// ============================================
// Instagram Weekly Stats Collection
// ============================================

// Types for Instagram stats
interface InstagramContentTypeMetrics {
  count: number;
  reach: number;
  likes: number;
  saves: number;
}

interface InstagramTopPost {
  url: string;
  type: "reels" | "image" | "carousel";
  reach: number;
  engagement_rate: number;
}

interface InstagramWeeklyMetrics {
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  total_likes: number;
  total_comments: number;
  total_saves: number;
  total_shares: number;
  total_views: number;
  avg_engagement_rate: number;
  by_content_type: {
    reels: InstagramContentTypeMetrics;
    image: InstagramContentTypeMetrics;
    carousel: InstagramContentTypeMetrics;
  };
  top_posts: InstagramTopPost[];
}

// Late API response types
interface LatePostAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number;
  engagementRate: number;
  lastUpdated: string;
}

interface LatePost {
  postId: string;
  latePostId: string;
  platformPostUrl: string;
  content: string;
  publishedAt: string;
  status: string;
  analytics: LatePostAnalytics;
  isExternal: boolean;
}

interface LateApiResponse {
  posts: LatePost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get Late API key from Firestore secrets
 */
async function getLateApiKey(): Promise<string | null> {
  try {
    const secretsDoc = await db.collection("secrets").doc("other").get();
    if (secretsDoc.exists) {
      const data = secretsDoc.data();
      return data?.late_api_key || null;
    }
    return null;
  } catch (error) {
    logger.error("Error fetching Late API key:", error);
    return null;
  }
}

/**
 * Calculate week ID and date range for the previous week
 */
function getWeekInfo(date: Date): {
  week_id: string;
  week_number: number;
  year: number;
  date_range: { start: string; end: string };
} {
  // Get the Monday of the previous week
  const d = new Date(date);
  d.setDate(d.getDate() - 7); // Go back one week

  // Find Monday of that week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  // Find Sunday of that week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Calculate week number (ISO week)
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const days = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  const year = monday.getFullYear();
  const week_id = `week-${year}-${String(weekNumber).padStart(2, "0")}`;

  // Format dates as YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    week_id,
    week_number: weekNumber,
    year,
    date_range: {
      start: formatDate(monday),
      end: formatDate(sunday),
    },
  };
}

/**
 * Determine post type from URL or views
 * - /reel/ in URL = reels
 * - views > 0 without /reel/ = likely video (treat as reels)
 * - otherwise = image (carousel detection not available from API)
 */
function detectPostType(post: LatePost): "reels" | "image" | "carousel" {
  const url = post.platformPostUrl.toLowerCase();

  // Check URL patterns
  if (url.includes("/reel/") || url.includes("/reels/")) {
    return "reels";
  }

  // If has significant views, likely a video/reel
  if (post.analytics.views > 0) {
    return "reels";
  }

  // Default to image (carousel detection not available)
  return "image";
}

/**
 * Fetch all posts from Late API (handles pagination)
 * Uses profileId (not accountId) and fromDate/toDate (not dateFrom/dateTo)
 */
async function fetchAllPostsFromLateApi(
  profileId: string,
  fromDate: string,
  toDate: string,
  apiKey: string
): Promise<LatePost[]> {
  const allPosts: LatePost[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://getlate.dev/api/v1/analytics?platform=instagram&profileId=${profileId}&fromDate=${fromDate}&toDate=${toDate}&sortBy=date&order=desc&limit=100&page=${page}`;

    logger.info(`Late API Request - profileId: ${profileId}, page: ${page}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Late API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Late API error: ${response.status}`);
    }

    const data: LateApiResponse = await response.json();
    logger.info(`Late API Response - page ${page}: ${data.posts.length} posts, total: ${data.pagination.total}`);
    allPosts.push(...data.posts);

    // Check if there are more pages
    hasMore = page < data.pagination.totalPages;
    page++;

    // Safety limit
    if (page > 10) {
      logger.warn("Reached page limit (10), stopping pagination");
      break;
    }
  }

  return allPosts;
}

/**
 * Fetch and aggregate Instagram stats from Late API
 */
async function fetchInstagramStatsFromLateApi(
  profileId: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<InstagramWeeklyMetrics | null> {
  try {
    // Fetch all posts for the date range
    const posts = await fetchAllPostsFromLateApi(profileId, startDate, endDate, apiKey);

    if (posts.length === 0) {
      logger.info(`No posts found for profile ${profileId} in date range ${startDate} - ${endDate}`);
      // Return empty metrics instead of null
      return {
        total_posts: 0,
        total_reach: 0,
        total_impressions: 0,
        total_likes: 0,
        total_comments: 0,
        total_saves: 0,
        total_shares: 0,
        total_views: 0,
        avg_engagement_rate: 0,
        by_content_type: {
          reels: { count: 0, reach: 0, likes: 0, saves: 0 },
          image: { count: 0, reach: 0, likes: 0, saves: 0 },
          carousel: { count: 0, reach: 0, likes: 0, saves: 0 },
        },
        top_posts: [],
      };
    }

    // Initialize aggregation
    let totalReach = 0;
    let totalImpressions = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalSaves = 0;
    let totalShares = 0;
    let totalViews = 0;
    let totalEngagementRate = 0;

    const byContentType: InstagramWeeklyMetrics["by_content_type"] = {
      reels: { count: 0, reach: 0, likes: 0, saves: 0 },
      image: { count: 0, reach: 0, likes: 0, saves: 0 },
      carousel: { count: 0, reach: 0, likes: 0, saves: 0 },
    };

    // Process each post
    for (const post of posts) {
      const analytics = post.analytics;
      const postType = detectPostType(post);

      // Aggregate totals
      totalReach += analytics.reach || 0;
      totalImpressions += analytics.impressions || 0;
      totalLikes += analytics.likes || 0;
      totalComments += analytics.comments || 0;
      totalSaves += analytics.saves || 0;
      totalShares += analytics.shares || 0;
      totalViews += analytics.views || 0;
      totalEngagementRate += analytics.engagementRate || 0;

      // Aggregate by content type
      byContentType[postType].count += 1;
      byContentType[postType].reach += analytics.reach || 0;
      byContentType[postType].likes += analytics.likes || 0;
      byContentType[postType].saves += analytics.saves || 0;
    }

    // Calculate average engagement rate
    const avgEngagementRate = posts.length > 0 ? totalEngagementRate / posts.length : 0;

    // Get top 5 posts (already sorted by engagement from API)
    const topPosts: InstagramTopPost[] = posts.slice(0, 5).map((post) => ({
      url: post.platformPostUrl,
      type: detectPostType(post),
      reach: post.analytics.reach || 0,
      engagement_rate: post.analytics.engagementRate || 0,
    }));

    const metrics: InstagramWeeklyMetrics = {
      total_posts: posts.length,
      total_reach: totalReach,
      total_impressions: totalImpressions,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_saves: totalSaves,
      total_shares: totalShares,
      total_views: totalViews,
      avg_engagement_rate: avgEngagementRate,
      by_content_type: byContentType,
      top_posts: topPosts,
    };

    return metrics;
  } catch (error) {
    logger.error(`Error fetching from Late API for profile ${profileId}:`, error);
    return null;
  }
}

/**
 * Collect Instagram weekly stats for all businesses
 * Runs every Monday at 03:00 Istanbul time (Sunday night to Monday morning)
 */
export const collectInstagramWeeklyStats = onSchedule({
  schedule: "0 3 * * 1", // Every Monday at 03:00
  timeZone: "Europe/Istanbul",
  retryCount: 3,
}, async () => {
  logger.info("Starting Instagram weekly stats collection...");

  // Get Late API key
  const apiKey = await getLateApiKey();
  if (!apiKey) {
    logger.error("Late API not configured. Add late_api_key to secrets/other");
    return;
  }

  // Get server URL for task endpoint
  const serverUrl = await getServerUrl();

  const now = new Date();
  const weekInfo = getWeekInfo(now);
  logger.info(`Collecting stats for ${weekInfo.week_id} (${weekInfo.date_range.start} - ${weekInfo.date_range.end})`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let tasksTriggered = 0;

  try {
    // Get all businesses with late_profile_id
    const businessesSnapshot = await db.collection("businesses").get();
    logger.info(`Found ${businessesSnapshot.size} businesses`);

    for (const businessDoc of businessesSnapshot.docs) {
      const businessId = businessDoc.id;
      const businessData = businessDoc.data();
      const lateProfileId = businessData.late_profile_id;
      const businessName = businessData.name || "unnamed";

      if (!lateProfileId) {
        logger.info(`Business ${businessId} has no late_profile_id, skipping`);
        skippedCount++;
        continue;
      }

      logger.info(`Processing business ${businessId} (${businessName}) with late_profile_id: ${lateProfileId}`);

      try {
        // Check if we already have stats for this week
        const existingStats = await db
          .collection("businesses")
          .doc(businessId)
          .collection("instagram_stats")
          .doc(weekInfo.week_id)
          .get();

        if (existingStats.exists) {
          logger.info(`Stats for ${weekInfo.week_id} already exist for business ${businessId}, skipping`);
          skippedCount++;
          continue;
        }

        // Fetch stats from Late API
        const metrics = await fetchInstagramStatsFromLateApi(
          lateProfileId,
          weekInfo.date_range.start,
          weekInfo.date_range.end,
          apiKey
        );

        if (!metrics) {
          logger.error(`Failed to fetch stats for business ${businessId}`);
          errorCount++;
          continue;
        }

        // Save to Firestore
        const weekDocPath = `businesses/${businessId}/instagram_stats/${weekInfo.week_id}`;
        await db
          .collection("businesses")
          .doc(businessId)
          .collection("instagram_stats")
          .doc(weekInfo.week_id)
          .set({
            week_id: weekInfo.week_id,
            week_number: weekInfo.week_number,
            year: weekInfo.year,
            date_range: weekInfo.date_range,
            metrics,
            summary: null,
            analyzed_at: null,
            analyzed_by: null,
            created_at: new Date().toISOString(),
            created_by: "cloud_function",
          });

        logger.info(`Successfully saved stats for business ${businessId}`);
        successCount++;

        // Trigger AI analysis task
        if (serverUrl) {
          const statsCollectionPath = `businesses/${businessId}/instagram_stats`;
          const taskContent = `Instagram istatistik analizi yap:

1. Firestore'daki Instagram istatistiklerini incele:
   - İstatistik koleksiyonu: ${statsCollectionPath}
   - Analiz edilecek hafta: ${weekInfo.week_id}
   - Hafta doc yolu: ${weekDocPath}
   - Tarih aralığı: ${weekInfo.date_range.start} - ${weekInfo.date_range.end}

2. Bu haftanın metriklerini değerlendir:
   - Toplam post sayısı, reach, likes, comments, saves, shares
   - İçerik türlerine göre performans (reels, image, carousel)
   - En iyi performans gösteren postlar
   - Engagement rate analizi

3. Değerlendirmeyi Türkçe olarak yaz ve "${weekDocPath}" dokümanındaki "summary" alanına kaydet.

4. Summary şunları içermeli:
   - insights: Genel bulgular listesi
   - recommendations: Öneriler listesi
   - week_over_week: Haftalık karşılaştırma (reach_change, engagement_change, trend)`;

          const taskId = await createTaskForJob(businessId, taskContent, "immediate");
          const taskSuccess = await sendTaskToBackend(serverUrl, taskContent, businessId, taskId);

          if (taskSuccess) {
            tasksTriggered++;
            logger.info(`Analysis task triggered for business ${businessId}, taskId: ${taskId}`);
          }
        }
      } catch (businessError) {
        logger.error(`Error processing business ${businessId}:`, businessError);
        errorCount++;
      }
    }
  } catch (error) {
    logger.error("Error in Instagram stats collection:", error);
    throw error;
  }

  logger.info(
    `Instagram stats collection complete. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}, Tasks: ${tasksTriggered}`
  );
});

/**
 * Manual trigger for Instagram stats collection (for testing)
 * Supports optional query params:
 * - businessId: Only process specific business
 * - forceRefresh: Overwrite existing stats
 * - triggerAnalysis: Set to "true" to trigger AI analysis
 */
export const collectInstagramStatsNow = onRequest({
  cors: true,
  timeoutSeconds: 300,
}, async (req, res) => {
  // Verify admin API key
  if (!verifyAdminApiKey(req)) {
    res.status(401).json({ success: false, error: "Yetkisiz erisim" });
    return;
  }

  logger.info("Manual Instagram stats collection triggered");

  // Get Late API key
  const apiKey = await getLateApiKey();
  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: "Late API not configured. Add late_api_key to secrets/other",
    });
    return;
  }

  // Get server URL for task endpoint
  const serverUrl = await getServerUrl();

  const now = new Date();
  const weekInfo = getWeekInfo(now);

  // Optional query params
  const targetBusinessId = req.query.businessId as string | undefined;
  const forceRefresh = req.query.forceRefresh === "true";
  const triggerAnalysis = req.query.triggerAnalysis === "true";

  const results: Array<{ businessId: string; businessName?: string; status: string; weekId: string; postsCount?: number; taskId?: string }> = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let tasksTriggered = 0;

  try {
    let businessDocs;

    if (targetBusinessId) {
      // Fetch single business
      const businessDoc = await db.collection("businesses").doc(targetBusinessId).get();
      businessDocs = businessDoc.exists ? [businessDoc] : [];
    } else {
      // Fetch all businesses
      const businessesSnapshot = await db.collection("businesses").get();
      businessDocs = businessesSnapshot.docs;
    }

    logger.info(`Processing ${businessDocs.length} business(es)`);

    for (const businessDoc of businessDocs) {
      const businessId = businessDoc.id;
      const businessData = businessDoc.data();
      const lateProfileId = businessData?.late_profile_id;
      const businessName = businessData?.name;

      if (!lateProfileId) {
        results.push({ businessId, businessName, status: "skipped_no_late_profile_id", weekId: weekInfo.week_id });
        skippedCount++;
        continue;
      }

      logger.info(`Processing business ${businessId} (${businessName || 'unnamed'}) with late_profile_id: ${lateProfileId}`);

      try {
        if (!forceRefresh) {
          const existingStats = await db
            .collection("businesses")
            .doc(businessId)
            .collection("instagram_stats")
            .doc(weekInfo.week_id)
            .get();

          if (existingStats.exists) {
            results.push({ businessId, businessName, status: "skipped_exists", weekId: weekInfo.week_id });
            skippedCount++;
            continue;
          }
        }

        const metrics = await fetchInstagramStatsFromLateApi(
          lateProfileId,
          weekInfo.date_range.start,
          weekInfo.date_range.end,
          apiKey
        );

        if (!metrics) {
          results.push({ businessId, businessName, status: "api_error", weekId: weekInfo.week_id });
          errorCount++;
          continue;
        }

        const weekDocPath = `businesses/${businessId}/instagram_stats/${weekInfo.week_id}`;
        await db
          .collection("businesses")
          .doc(businessId)
          .collection("instagram_stats")
          .doc(weekInfo.week_id)
          .set({
            week_id: weekInfo.week_id,
            week_number: weekInfo.week_number,
            year: weekInfo.year,
            date_range: weekInfo.date_range,
            metrics,
            summary: null,
            analyzed_at: null,
            analyzed_by: null,
            created_at: new Date().toISOString(),
            created_by: "manual_trigger",
          });

        let taskId: string | undefined;

        // Trigger AI analysis if requested
        if (triggerAnalysis && serverUrl) {
          const statsCollectionPath = `businesses/${businessId}/instagram_stats`;
          const taskContent = `Instagram istatistik analizi yap:

1. Firestore'daki Instagram istatistiklerini incele:
   - İstatistik koleksiyonu: ${statsCollectionPath}
   - Analiz edilecek hafta: ${weekInfo.week_id}
   - Hafta doc yolu: ${weekDocPath}
   - Tarih aralığı: ${weekInfo.date_range.start} - ${weekInfo.date_range.end}

2. Bu haftanın metriklerini değerlendir:
   - Toplam post sayısı, reach, likes, comments, saves, shares
   - İçerik türlerine göre performans (reels, image, carousel)
   - En iyi performans gösteren postlar
   - Engagement rate analizi

3. Değerlendirmeyi Türkçe olarak yaz ve "${weekDocPath}" dokümanındaki "summary" alanına kaydet.

4. Summary şunları içermeli:
   - insights: Genel bulgular listesi
   - recommendations: Öneriler listesi
   - week_over_week: Haftalık karşılaştırma (reach_change, engagement_change, trend)`;

          taskId = await createTaskForJob(businessId, taskContent, "immediate");
          const taskSuccess = await sendTaskToBackend(serverUrl, taskContent, businessId, taskId);

          if (taskSuccess) {
            tasksTriggered++;
            logger.info(`Analysis task triggered for business ${businessId}, taskId: ${taskId}`);
          }
        }

        results.push({
          businessId,
          businessName,
          status: "success",
          weekId: weekInfo.week_id,
          postsCount: metrics.total_posts,
          taskId,
        });
        successCount++;
      } catch (businessError) {
        logger.error(`Error processing business ${businessId}:`, businessError);
        results.push({ businessId, businessName, status: "error", weekId: weekInfo.week_id });
        errorCount++;
      }
    }
  } catch (error) {
    logger.error("Error:", error);
    res.status(500).json({ success: false, error: String(error) });
    return;
  }

  res.json({
    success: true,
    weekInfo,
    timestamp: now.toISOString(),
    successCount,
    errorCount,
    skippedCount,
    tasksTriggered,
    results,
  });
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
  // Verify admin API key
  if (!verifyAdminApiKey(req)) {
    res.status(401).json({ success: false, error: "Yetkisiz erisim" });
    return;
  }

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
