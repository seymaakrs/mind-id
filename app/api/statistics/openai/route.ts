import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";

// OpenAI Admin API endpoint for costs
const OPENAI_COSTS_URL = "https://api.openai.com/v1/organization/costs";

// Cache duration: 10 minutes
const CACHE_DURATION = 60 * 10;

// Default USD to TRY rate (will be overridden by Firestore if available)
// This should match the rate used in Google Cloud billing (~42.86 as of Jan 2026)
const DEFAULT_USD_TRY_RATE = 42.86;

// Get exchange rate from Firestore or use default
async function getExchangeRate(): Promise<number> {
  if (!adminDb) return DEFAULT_USD_TRY_RATE;

  try {
    const doc = await adminDb.collection("secrets").doc("exchange-rates").get();
    if (doc.exists) {
      const data = doc.data();
      return data?.usdTry || DEFAULT_USD_TRY_RATE;
    }
  } catch (error) {
    console.error("[Exchange Rate] Error fetching from Firestore:", error);
  }

  return DEFAULT_USD_TRY_RATE;
}

interface OpenAICostResult {
  object: string;
  amount: {
    value: number;
    currency: string;
  };
  line_item?: string;
  project_id?: string;
}

interface OpenAIBucket {
  object: string;
  start_time: number;
  end_time: number;
  start_time_iso: string;
  end_time_iso: string;
  results: OpenAICostResult[];
}

// Cached fetch function
const fetchOpenAIStats = unstable_cache(
  async (timeRange: string, adminKey: string) => {
    // Calculate start time based on time range
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case "1d":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        // Last 365 days for "all"
        startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build URL with query parameters
    const url = new URL(OPENAI_COSTS_URL);
    url.searchParams.set("start_time", Math.floor(startTime.getTime() / 1000).toString());
    url.searchParams.set("limit", "100");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Transform data to our format
    const dailyData: { date: string; amount: number }[] = [];
    let totalSpend = 0;
    const dailyMap = new Map<string, number>();

    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((bucket: OpenAIBucket) => {
        const date = bucket.start_time_iso
          ? bucket.start_time_iso.split("T")[0]
          : new Date(bucket.start_time * 1000).toISOString().split("T")[0];

        let bucketTotal = 0;
        if (bucket.results && Array.isArray(bucket.results)) {
          bucket.results.forEach((result: OpenAICostResult) => {
            if (result.amount?.value) {
              bucketTotal += Number(result.amount.value) || 0;
            }
          });
        }

        if (bucketTotal > 0) {
          const current = dailyMap.get(date) || 0;
          dailyMap.set(date, current + bucketTotal);
          totalSpend += bucketTotal;
        }
      });

      dailyMap.forEach((amount, date) => {
        dailyData.push({ date, amount: Number(Number(amount).toFixed(4)) });
      });
      dailyData.sort((a, b) => a.date.localeCompare(b.date));
    }

    const totalResults = data.data?.reduce(
      (sum: number, bucket: OpenAIBucket) => sum + (bucket.results?.length || 0),
      0
    ) || 0;

    const finalTotalSpend = Number(Number(totalSpend).toFixed(2));

    return {
      provider: "openai",
      summary: {
        provider: "openai",
        label: "OpenAI API",
        totalSpend: finalTotalSpend,
        currentPeriodSpend: finalTotalSpend,
        trend: 0,
      },
      dailyData,
      debug: {
        bucketCount: data.data?.length || 0,
        totalResults,
        cachedAt: new Date().toISOString(),
      },
    };
  },
  ["openai-stats"], // Cache key prefix
  {
    revalidate: CACHE_DURATION,
    tags: ["openai-stats"],
  }
);

export async function GET(request: NextRequest) {
  try {
    const adminKey = process.env.OPENAI_ADMIN_KEY;

    if (!adminKey) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI Admin API key yapilandirilmamis",
          note: "OPENAI_ADMIN_KEY environment variable gerekli.",
        },
        { status: 500 }
      );
    }

    if (!adminKey.startsWith("sk-admin-")) {
      return NextResponse.json(
        {
          success: false,
          error: "Gecersiz OpenAI key formati",
          note: "Admin key 'sk-admin-' ile baslamali.",
        },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "30d";

    // Use cached function (returns USD values)
    const usdData = await fetchOpenAIStats(timeRange, adminKey);

    // Get exchange rate for USD to TRY conversion
    const exchangeRate = await getExchangeRate();

    // Convert USD to TRY
    const data = {
      ...usdData,
      currency: "TRY",
      summary: {
        ...usdData.summary,
        totalSpend: Math.round(usdData.summary.totalSpend * exchangeRate * 100) / 100,
        currentPeriodSpend: Math.round(usdData.summary.currentPeriodSpend * exchangeRate * 100) / 100,
      },
      dailyData: usdData.dailyData.map((d: { date: string; amount: number }) => ({
        ...d,
        amount: Math.round(d.amount * exchangeRate * 100) / 100,
      })),
      usdEquivalent: {
        totalSpend: usdData.summary.totalSpend,
        currentPeriodSpend: usdData.summary.currentPeriodSpend,
        exchangeRate,
      },
    };

    return NextResponse.json({
      success: true,
      data,
      cached: true,
      cacheInfo: {
        duration: `${CACHE_DURATION / 60} dakika`,
        cachedAt: usdData.debug?.cachedAt,
      },
    });
  } catch (error) {
    console.error("[OpenAI Stats] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}
