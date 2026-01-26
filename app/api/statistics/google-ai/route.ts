import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { GoogleAuth } from "google-auth-library";
import { adminDb } from "@/lib/firebase/admin";

// Cache duration: 15 minutes
const CACHE_DURATION = 60 * 15;

// Google Cloud Billing API base URL
const BILLING_API_BASE = "https://cloudbilling.googleapis.com/v1";

// Project configurations
interface ProjectConfig {
  projectId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
  billingAccountId: string;
}

// Cache for Firestore secrets (in-memory, refreshed every 15 minutes)
let secretsCache: { data: Record<string, unknown> | null; fetchedAt: number } = {
  data: null,
  fetchedAt: 0,
};

// Fetch secrets from Firestore
async function getSecretsFromFirestore(): Promise<Record<string, unknown> | null> {
  // Return cached data if fresh (less than 15 minutes old)
  if (secretsCache.data && Date.now() - secretsCache.fetchedAt < CACHE_DURATION * 1000) {
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

// Parse private key - handle both literal \n and actual newlines
function parsePrivateKey(key: string | undefined): string | null {
  if (!key) return null;

  // Remove surrounding quotes if present
  let parsed = key.replace(/^["']|["']$/g, "");

  // Replace literal \n with actual newlines
  parsed = parsed.replace(/\\n/g, "\n");

  // Ensure proper PEM format
  if (!parsed.includes("-----BEGIN") || !parsed.includes("-----END")) {
    console.error("Invalid private key format - missing PEM headers");
    return null;
  }

  return parsed;
}

// Get project config based on service type
async function getProjectConfig(service: string): Promise<ProjectConfig | null> {
  // AI Services (Gemini, Veo) - uses GCP AI project
  if (service === "gemini" || service === "veo") {
    // Try to load from Firestore first
    const secrets = await getSecretsFromFirestore();

    if (secrets) {
      const projectId = secrets.projectId as string;
      const clientEmail = secrets.clientEmail as string;
      const privateKey = parsePrivateKey(secrets.privateKey as string);
      const billingAccountId = secrets.billingAccountId as string;

      if (projectId && clientEmail && privateKey && billingAccountId) {
        return {
          projectId,
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
          billingAccountId,
        };
      }
    }

    // Fallback to env variables (for local development)
    const billingAccountId = process.env.GCP_AI_BILLING_ACCOUNT_ID;
    const projectId = process.env.GCP_AI_PROJECT_ID;
    const clientEmail = process.env.GCP_AI_CLIENT_EMAIL;
    const privateKey = parsePrivateKey(process.env.GCP_AI_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey || !billingAccountId) {
      console.log("GCP AI config missing:", {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        hasBillingAccountId: !!billingAccountId,
        hasFirestoreSecrets: !!secrets
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
    };
  }

  // Firebase - uses Firebase project (always from env vars)
  if (service === "firebase") {
    const billingAccountId = process.env.FIREBASE_BILLING_ACCOUNT_ID;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey || !billingAccountId) {
      console.log("Firebase config missing:", {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        hasBillingAccountId: !!billingAccountId
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
    };
  }

  return null;
}

// Create Google Auth client for a specific project
function createAuthClient(config: ProjectConfig) {
  return new GoogleAuth({
    credentials: config.credentials,
    projectId: config.projectId,
    scopes: [
      "https://www.googleapis.com/auth/cloud-billing.readonly",
      "https://www.googleapis.com/auth/cloud-platform",
    ],
  });
}

// Get access token
async function getAccessToken(config: ProjectConfig): Promise<string> {
  const auth = createAuthClient(config);
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse.token) {
    throw new Error("Access token alinamadi");
  }

  return tokenResponse.token;
}

// Fetch billing account info
async function fetchBillingAccountInfo(billingAccountId: string, accessToken: string) {
  const url = `${BILLING_API_BASE}/billingAccounts/${billingAccountId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Billing API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Fetch projects linked to billing account
async function fetchBillingProjects(billingAccountId: string, accessToken: string) {
  const url = `${BILLING_API_BASE}/billingAccounts/${billingAccountId}/projects`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.warn("Could not fetch billing projects:", response.status);
    return { projectBillingInfo: [] };
  }

  return response.json();
}

// Get service label
function getServiceLabel(service: string): string {
  switch (service) {
    case "gemini":
      return "Google AI - Gemini";
    case "veo":
      return "Google AI - Veo 3.1";
    case "firebase":
      return "Firebase";
    default:
      return service;
  }
}

// Cached fetch function for a specific service
const fetchServiceStats = unstable_cache(
  async (service: string) => {
    const config = await getProjectConfig(service);

    if (!config) {
      return {
        configured: false,
        service,
        label: getServiceLabel(service),
        summary: {
          provider: service,
          label: getServiceLabel(service),
          totalSpend: 0,
          currentPeriodSpend: 0,
          trend: 0,
        },
        dailyData: [],
        note: `${service} icin credentials yapilandirilmamis.`,
      };
    }

    const accessToken = await getAccessToken(config);
    const accountInfo = await fetchBillingAccountInfo(config.billingAccountId, accessToken);
    const projectsInfo = await fetchBillingProjects(config.billingAccountId, accessToken);

    return {
      configured: true,
      service,
      label: getServiceLabel(service),
      projectId: config.projectId,
      billingAccount: {
        name: accountInfo.name,
        displayName: accountInfo.displayName,
        open: accountInfo.open,
      },
      linkedProjects: projectsInfo.projectBillingInfo?.length || 0,
      summary: {
        provider: service,
        label: getServiceLabel(service),
        totalSpend: 0,
        currentPeriodSpend: 0,
        trend: 0,
      },
      dailyData: [],
      cachedAt: new Date().toISOString(),
      note: "Detayli maliyet verisi icin BigQuery Billing Export kurulumu gerekli.",
    };
  },
  ["google-cloud-service-stats"],
  {
    revalidate: CACHE_DURATION,
    tags: ["google-cloud-stats"],
  }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const service = searchParams.get("service"); // gemini, veo, or firebase

    // If specific service requested
    if (service) {
      const data = await fetchServiceStats(service);

      return NextResponse.json({
        success: true,
        data: {
          services: [data],
          note: data.note,
        },
        cached: true,
        cacheInfo: {
          duration: `${CACHE_DURATION / 60} dakika`,
          cachedAt: data.cachedAt,
        },
      });
    }

    // Fetch all services
    const services = ["gemini", "veo", "firebase"];
    const results = await Promise.all(
      services.map((svc) => fetchServiceStats(svc))
    );

    return NextResponse.json({
      success: true,
      data: {
        services: results,
        note: "Detayli maliyet verisi icin BigQuery Billing Export kurulumu gerekli.",
      },
      cached: true,
      cacheInfo: {
        duration: `${CACHE_DURATION / 60} dakika`,
      },
    });
  } catch (error) {
    console.error("[Google Cloud Stats] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
    const isPermissionError =
      errorMessage.includes("403") ||
      errorMessage.includes("permission") ||
      errorMessage.includes("PERMISSION_DENIED");

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: isPermissionError
          ? "Service account'a 'Billing Account Viewer' rolu eklenmeli."
          : undefined,
      },
      { status: 500 }
    );
  }
}
