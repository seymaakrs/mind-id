import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import { adminDb } from "@/lib/firebase/admin";

// Cache duration: 15 minutes
const CACHE_DURATION = 60 * 15;

// Service name mappings for BigQuery queries
const SERVICE_FILTERS: Record<string, string[]> = {
  gemini: [
    "Gemini API",
    "Vertex AI",
    "Cloud AI Platform",
    "Generative Language API",
    "AI Platform",
  ],
  veo: ["Gemini API", "Vertex AI", "Video Intelligence API", "Cloud AI Platform"],
};

// SKU filters for more accurate service filtering
const SKU_FILTERS: Record<string, string[]> = {
  gemini: ["gemini", "generative", "language model", "llm"],
  veo: ["veo", "video generation", "imagen"],
};

// Project configurations
interface ProjectConfig {
  projectId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
  billingAccountId: string;
  bigqueryDataset: string;
  bigqueryTable: string;
}

// Cache for Firestore secrets
let secretsCache: {
  data: Record<string, unknown> | null;
  fetchedAt: number;
} = {
  data: null,
  fetchedAt: 0,
};

// Fetch secrets from Firestore
async function getSecretsFromFirestore(): Promise<Record<
  string,
  unknown
> | null> {
  if (
    secretsCache.data &&
    Date.now() - secretsCache.fetchedAt < CACHE_DURATION * 1000
  ) {
    return secretsCache.data;
  }

  if (!adminDb) {
    console.log("[Secrets] Firebase Admin not initialized");
    return null;
  }

  try {
    const doc = await adminDb.collection("secrets").doc("gcp-ai").get();
    if (doc.exists) {
      const data = doc.data() as Record<string, unknown>;
      secretsCache = { data, fetchedAt: Date.now() };
      console.log("[Secrets] Loaded GCP AI credentials from Firestore");
      return data;
    }
  } catch (error) {
    console.error("[Secrets] Error fetching from Firestore:", error);
  }

  return null;
}

// Parse private key
function parsePrivateKey(key: string | undefined): string | null {
  if (!key) return null;
  let parsed = key.replace(/^["']|["']$/g, "");
  parsed = parsed.replace(/\\n/g, "\n");
  if (!parsed.includes("-----BEGIN") || !parsed.includes("-----END")) {
    console.error("Invalid private key format");
    return null;
  }
  return parsed;
}

// Get project config
async function getProjectConfig(): Promise<ProjectConfig | null> {
  const secrets = await getSecretsFromFirestore();

  if (secrets) {
    const projectId = secrets.projectId as string;
    const clientEmail = secrets.clientEmail as string;
    const privateKey = parsePrivateKey(secrets.privateKey as string);
    const billingAccountId = secrets.billingAccountId as string;
    const bigqueryDataset = secrets.bigqueryDataset as string;
    const bigqueryTable = secrets.bigqueryTable as string;

    if (
      projectId &&
      clientEmail &&
      privateKey &&
      billingAccountId &&
      bigqueryDataset &&
      bigqueryTable
    ) {
      return {
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        billingAccountId,
        bigqueryDataset,
        bigqueryTable,
      };
    }
  }

  // Fallback to env variables
  const projectId = process.env.GCP_AI_PROJECT_ID;
  const clientEmail = process.env.GCP_AI_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.GCP_AI_PRIVATE_KEY);
  const billingAccountId = process.env.GCP_AI_BILLING_ACCOUNT_ID;
  const bigqueryDataset = process.env.GCP_AI_BIGQUERY_DATASET;
  const bigqueryTable = process.env.GCP_AI_BIGQUERY_TABLE;

  if (
    !projectId ||
    !clientEmail ||
    !privateKey ||
    !billingAccountId ||
    !bigqueryDataset ||
    !bigqueryTable
  ) {
    console.log("GCP AI config missing:", {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      hasBillingAccountId: !!billingAccountId,
      hasBigqueryDataset: !!bigqueryDataset,
      hasBigqueryTable: !!bigqueryTable,
    });
    return null;
  }

  return {
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    billingAccountId,
    bigqueryDataset,
    bigqueryTable,
  };
}

// Get service label
function getServiceLabel(service: string): string {
  switch (service) {
    case "gemini":
      return "Google AI - Gemini";
    case "veo":
      return "Google AI - Veo 3.1";
    default:
      return service;
  }
}

// Calculate date range based on timeRange parameter
function getDateRange(timeRange: string): { startDate: string; periodDays: number } {
  const now = new Date();

  let startDate: string;
  let periodDays: number;
  switch (timeRange) {
    case "1d":
      periodDays = 1;
      startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
    case "7d":
      periodDays = 7;
      startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
    case "30d":
      periodDays = 30;
      startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
    case "all":
    default:
      // Last 365 days for "all" - BigQuery billing export tipik olarak 1 yillik veri tutar
      periodDays = 365;
      startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      break;
  }

  return { startDate, periodDays };
}

// Fetch billing data from BigQuery
async function fetchBillingFromBigQuery(
  config: ProjectConfig,
  service: string,
  timeRange: string,
  debug: boolean = false
) {
  const bigquery = new BigQuery({
    projectId: config.projectId,
    credentials: config.credentials,
  });

  const { startDate, periodDays } = getDateRange(timeRange);
  const serviceFilters = SERVICE_FILTERS[service] || [];
  const skuFilters = SKU_FILTERS[service] || [];

  // Build WHERE clause for service filtering
  const serviceConditions = serviceFilters
    .map((s) => `service.description LIKE '%${s}%'`)
    .join(" OR ");

  const skuConditions = skuFilters
    .map((s) => `LOWER(sku.description) LIKE '%${s}%'`)
    .join(" OR ");

  const tableRef = `\`${config.projectId}.${config.bigqueryDataset}.${config.bigqueryTable}\``;

  // Query for total and period spend (with currency info)
  // totalSpend: secilen donem icindeki toplam harcama
  // periodSpend: ayni deger (eskiden tum zamanlar vs donem karsilastirmasi icindi)
  const summaryQuery = `
    SELECT
      SUM(cost) as total_cost,
      SUM(cost) as period_cost,
      COUNT(*) as request_count,
      ANY_VALUE(currency) as currency,
      AVG(currency_conversion_rate) as avg_conversion_rate
    FROM ${tableRef}
    WHERE
      (${serviceConditions})
      ${skuConditions ? `AND (${skuConditions})` : ""}
      AND usage_start_time >= TIMESTAMP('${startDate}')
  `;

  // Query for daily spending
  const dailyQuery = `
    SELECT
      DATE(usage_start_time) as date,
      SUM(cost) as amount
    FROM ${tableRef}
    WHERE
      (${serviceConditions})
      ${skuConditions ? `AND (${skuConditions})` : ""}
      AND usage_start_time >= TIMESTAMP('${startDate}')
    GROUP BY date
    ORDER BY date ASC
  `;

  // Query for previous period (for trend calculation)
  const previousPeriodQuery = `
    SELECT
      SUM(cost) as previous_cost
    FROM ${tableRef}
    WHERE
      (${serviceConditions})
      ${skuConditions ? `AND (${skuConditions})` : ""}
      AND usage_start_time >= TIMESTAMP(DATE_SUB(DATE('${startDate}'), INTERVAL ${periodDays} DAY))
      AND usage_start_time < TIMESTAMP('${startDate}')
  `;

  // Debug query - shows breakdown by service and SKU
  const debugQuery = `
    SELECT
      service.description as service_name,
      sku.description as sku_name,
      SUM(cost) as total_cost,
      COUNT(*) as row_count
    FROM ${tableRef}
    WHERE
      (${serviceConditions})
      ${skuConditions ? `AND (${skuConditions})` : ""}
      AND usage_start_time >= TIMESTAMP('${startDate}')
    GROUP BY service.description, sku.description
    ORDER BY total_cost DESC
    LIMIT 50
  `;

  // Detailed usage query - shows individual records with timestamps
  const detailedUsageQuery = `
    SELECT
      DATE(usage_start_time) as date,
      FORMAT_TIMESTAMP('%H:%M', usage_start_time) as time,
      service.description as service_name,
      sku.description as sku_name,
      project.id as project_id,
      cost,
      usage.amount as usage_amount,
      usage.unit as usage_unit,
      credits
    FROM ${tableRef}
    WHERE
      (${serviceConditions})
      ${skuConditions ? `AND (${skuConditions})` : ""}
      AND usage_start_time >= TIMESTAMP('${startDate}')
      AND cost > 0.01
    ORDER BY cost DESC
    LIMIT 100
  `;

  try {
    const [summaryRows] = await bigquery.query({ query: summaryQuery });
    const [dailyRows] = await bigquery.query({ query: dailyQuery });
    const [previousRows] = await bigquery.query({ query: previousPeriodQuery });

    // Fetch debug data if requested
    let debugData = null;
    if (debug) {
      const [debugRows] = await bigquery.query({ query: debugQuery });
      const [detailedRows] = await bigquery.query({ query: detailedUsageQuery });
      debugData = {
        serviceFilters,
        skuFilters,
        dateRange: { startDate, endDate: new Date().toISOString().split("T")[0] },
        queries: {
          summary: summaryQuery.trim(),
          daily: dailyQuery.trim(),
          debug: debugQuery.trim(),
        },
        breakdown: debugRows.map((row: { service_name: string; sku_name: string; total_cost: number; row_count: number }) => ({
          serviceName: row.service_name,
          skuName: row.sku_name,
          cost: Number(row.total_cost) || 0,
          rowCount: Number(row.row_count) || 0,
        })),
        detailedUsage: detailedRows.map((row: {
          date: { value: string } | string;
          time: string;
          service_name: string;
          sku_name: string;
          project_id: string;
          cost: number;
          usage_amount: number;
          usage_unit: string;
          credits: Array<{ amount: number; name: string }> | null;
        }) => ({
          date: typeof row.date === "object" && row.date.value ? row.date.value : String(row.date),
          time: row.time,
          serviceName: row.service_name,
          skuName: row.sku_name,
          projectId: row.project_id,
          cost: Number(row.cost) || 0,
          usageAmount: Number(row.usage_amount) || 0,
          usageUnit: row.usage_unit,
          credits: row.credits,
        })),
      };
    }

    const summary = summaryRows[0] || {
      total_cost: 0,
      period_cost: 0,
      request_count: 0,
      currency: "USD",
      avg_conversion_rate: 1,
    };
    const previousCost = previousRows[0]?.previous_cost || 0;

    // Get currency info
    const currency = summary.currency || "USD";
    const conversionRate = Number(summary.avg_conversion_rate) || 1;

    // Convert to USD if not already in USD
    // Note: currency_conversion_rate in BigQuery is "1 USD = X local currency"
    // So to convert local to USD, we DIVIDE by the rate
    const isLocalCurrency = currency !== "USD";
    const totalCostLocal = Number(summary.total_cost) || 0;
    const periodCostLocal = Number(summary.period_cost) || 0;
    const previousCostLocal = Number(previousCost) || 0;

    // Convert to USD by dividing by conversion rate
    const totalCostUSD = isLocalCurrency && conversionRate > 0
      ? totalCostLocal / conversionRate
      : totalCostLocal;
    const periodCostUSD = isLocalCurrency && conversionRate > 0
      ? periodCostLocal / conversionRate
      : periodCostLocal;
    const previousCostUSD = isLocalCurrency && conversionRate > 0
      ? previousCostLocal / conversionRate
      : previousCostLocal;

    // Calculate trend percentage
    let trend = 0;
    if (previousCostUSD > 0) {
      trend = ((periodCostUSD - previousCostUSD) / previousCostUSD) * 100;
    }

    // Use local currency values directly (TL)
    return {
      configured: true,
      service,
      label: getServiceLabel(service),
      projectId: config.projectId,
      currency: currency, // "TRY", "USD", etc.
      summary: {
        provider: service,
        label: getServiceLabel(service),
        totalSpend: Math.round(totalCostLocal * 100) / 100,
        currentPeriodSpend: Math.round(periodCostLocal * 100) / 100,
        trend: Math.round(trend * 100) / 100,
        requests: Number(summary.request_count) || 0,
      },
      // Also include USD conversion for reference
      usdEquivalent: {
        totalSpend: Math.round(totalCostUSD * 100) / 100,
        currentPeriodSpend: Math.round(periodCostUSD * 100) / 100,
        conversionRate,
      },
      dailyData: dailyRows.map((row: { date: { value: string }; amount: number }) => ({
        date:
          typeof row.date === "object" && row.date.value
            ? row.date.value
            : String(row.date),
        amount: Number(row.amount) || 0, // Keep in local currency
      })),
      cachedAt: new Date().toISOString(),
      ...(debug && { debug: debugData }),
    };
  } catch (error) {
    console.error(`[BigQuery] Error fetching ${service} stats:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const service = searchParams.get("service");
    const timeRange = searchParams.get("timeRange") || "30d";
    const debug = searchParams.get("debug") === "true";

    const config = await getProjectConfig();

    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          services: [
            {
              configured: false,
              service: service || "gemini",
              label: getServiceLabel(service || "gemini"),
              summary: {
                provider: service || "gemini",
                label: getServiceLabel(service || "gemini"),
                totalSpend: 0,
                currentPeriodSpend: 0,
                trend: 0,
              },
              dailyData: [],
              note: "GCP AI credentials veya BigQuery ayarlari yapilandirilmamis.",
            },
          ],
        },
      });
    }

    // If specific service requested
    if (service && (service === "gemini" || service === "veo")) {
      const data = await fetchBillingFromBigQuery(config, service, timeRange, debug);

      return NextResponse.json({
        success: true,
        data: {
          services: [data],
        },
        cached: false,
      });
    }

    // Fetch both services
    const services = ["gemini", "veo"];
    const results = await Promise.all(
      services.map((svc) => fetchBillingFromBigQuery(config, svc, timeRange, debug))
    );

    return NextResponse.json({
      success: true,
      data: {
        services: results,
      },
      cached: false,
    });
  } catch (error) {
    console.error("[Google Cloud Stats] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Bilinmeyen hata";
    const isBigQueryError =
      errorMessage.includes("BigQuery") ||
      errorMessage.includes("Not found") ||
      errorMessage.includes("Access Denied");

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: isBigQueryError
          ? "BigQuery dataset/table bulunamadi veya erisim izni yok. Service account'a 'BigQuery Data Viewer' rolu eklenmeli."
          : undefined,
      },
      { status: 500 }
    );
  }
}
