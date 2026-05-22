import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

function httpsGet(url: string, headers: Record<string, string>): Promise<{ ok: boolean; status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, family: 4 }, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => {
        const status = res.statusCode || 500;
        resolve({ ok: status >= 200 && status < 300, status, data });
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("Request timeout")));
  });
}

export const maxDuration = 30;

const ZERNIO_BASE_URL = process.env.ZERNIO_BASE_URL || "https://api.zernio.com/v1";

export async function POST(request: NextRequest) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin yapilandirilmamis" },
        { status: 500 }
      );
    }

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId gerekli" },
        { status: 400 }
      );
    }

    const businessDoc = await adminDb.collection("businesses").doc(businessId).get();

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: "Isletme bulunamadi" },
        { status: 404 }
      );
    }

    const business = businessDoc.data();
    // Zernio'ya öncelik ver; eski işletmelerde Late ID kaldıysa onu kullan.
    const profileId = business?.zernio_profile_id || business?.late_profile_id;
    const usingZernio = Boolean(business?.zernio_profile_id);

    if (!profileId) {
      return NextResponse.json(
        { error: "Zernio Profile ID tanimli degil" },
        { status: 400 }
      );
    }

    // Secrets dokümanı: Zernio anahtarı yoksa Late'e geri düş (geçiş dönemi).
    const secretDoc = await adminDb.collection("secrets").doc("other").get();
    if (!secretDoc.exists) {
      return NextResponse.json(
        { error: "API anahtari bulunamadi" },
        { status: 500 }
      );
    }
    const secrets = secretDoc.data();
    const zernioApiKey = secrets?.zernio_api_key as string | undefined;
    const lateApiKey = secrets?.late_api_key as string | undefined;

    let apiUrl: string;
    let apiKey: string | undefined;
    let backend: "zernio" | "late";

    if (usingZernio && zernioApiKey) {
      apiUrl = `${ZERNIO_BASE_URL}/accounts?profileId=${encodeURIComponent(profileId)}`;
      apiKey = zernioApiKey;
      backend = "zernio";
    } else if (lateApiKey) {
      apiUrl = `https://getlate.dev/api/v1/accounts?profileId=${encodeURIComponent(profileId)}`;
      apiKey = lateApiKey;
      backend = "late";
    } else {
      return NextResponse.json(
        { error: "Zernio veya Late API anahtari yapilandirilmamis" },
        { status: 500 }
      );
    }

    const response = await httpsGet(apiUrl, {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    });

    if (!response.ok) {
      console.error(`${backend} API error:`, response.data);
      return NextResponse.json(
        { error: `${backend === "zernio" ? "Zernio" : "Late"} API hatasi: ${response.status}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(response.data);
    console.log(`${backend} API response:`, JSON.stringify(data, null, 2));
    const accounts = data.accounts || [];

    const platformUpdates: Record<string, string> = {};
    const accountsSummary: Array<{ platform: string; id: string; username?: string }> = [];

    const fieldNameOverrides: Record<string, string> = {
      tiktok: "tiktok_account_id",
      linkedin: "linkedin_account_id",
    };

    for (const account of accounts) {
      if (account.platform && account._id) {
        const fieldName = fieldNameOverrides[account.platform] || `${account.platform}_id`;
        platformUpdates[fieldName] = account._id;
        accountsSummary.push({
          platform: account.platform,
          id: account._id,
          username: account.username,
        });
      }
    }

    if (Object.keys(platformUpdates).length > 0) {
      await adminDb.collection("businesses").doc(businessId).update({
        ...platformUpdates,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `${accountsSummary.length} hesap senkronize edildi (${backend})`,
      backend,
      accounts: accountsSummary,
    });
  } catch (error) {
    console.error("Sync accounts error:", error);
    return NextResponse.json(
      { error: "Hesaplar senkronize edilirken bir hata olustu" },
      { status: 500 }
    );
  }
}
