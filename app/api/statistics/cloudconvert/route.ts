import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

// CloudConvert API endpoint for user info
const CLOUDCONVERT_USER_URL = "https://api.cloudconvert.com/v2/users/me";

// Cache duration: 10 minutes
const CACHE_DURATION = 60 * 10;

// Cached fetch function
const fetchCloudConvertStats = unstable_cache(
  async (apiKey: string) => {
    const response = await fetch(CLOUDCONVERT_USER_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CloudConvert API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const credits = data.data?.credits || 0;
    const jobCount = data.data?.job_count || 0;
    const conversionCount = data.data?.conversion_count || 0;

    return {
      provider: "cloudconvert",
      summary: {
        provider: "cloudconvert",
        label: "CloudConvert",
        totalSpend: 0,
        currentPeriodSpend: 0,
        trend: 0,
        creditsRemaining: credits,
        requests: jobCount,
      },
      dailyData: [],
      additionalInfo: {
        totalJobs: jobCount,
        totalConversions: conversionCount,
        createdAt: data.data?.created_at,
        cachedAt: new Date().toISOString(),
      },
    };
  },
  ["cloudconvert-stats"],
  {
    revalidate: CACHE_DURATION,
    tags: ["cloudconvert-stats"],
  }
);

export async function GET() {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "CloudConvert API key yapilandirilmamis",
          note: "CLOUDCONVERT_API_KEY environment variable gerekli.",
        },
        { status: 500 }
      );
    }

    // Use cached function
    const data = await fetchCloudConvertStats(apiKey);

    return NextResponse.json({
      success: true,
      data,
      cached: true,
      cacheInfo: {
        duration: `${CACHE_DURATION / 60} dakika`,
        cachedAt: data.additionalInfo?.cachedAt,
      },
    });
  } catch (error) {
    console.error("[CloudConvert Stats] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}
