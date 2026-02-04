import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Verify authentication
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

    // Get business document to get late_profile_id
    const businessDoc = await adminDb.collection("businesses").doc(businessId).get();

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: "Isletme bulunamadi" },
        { status: 404 }
      );
    }

    const business = businessDoc.data();
    const lateProfileId = business?.late_profile_id;

    if (!lateProfileId) {
      return NextResponse.json(
        { error: "Late Profile ID tanimli degil" },
        { status: 400 }
      );
    }

    // Get Late API key from secrets
    const secretDoc = await adminDb.collection("secrets").doc("other").get();

    if (!secretDoc.exists) {
      return NextResponse.json(
        { error: "API anahtari bulunamadi" },
        { status: 500 }
      );
    }

    const secrets = secretDoc.data();
    const lateApiKey = secrets?.late_api_key;

    if (!lateApiKey) {
      return NextResponse.json(
        { error: "Late API anahtari yapilandirilmamis" },
        { status: 500 }
      );
    }

    // Make request to Late API
    const lateApiUrl = `https://getlate.dev/api/v1/accounts?profileId=${encodeURIComponent(lateProfileId)}`;

    const response = await fetch(lateApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${lateApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Late API error:", errorText);
      return NextResponse.json(
        { error: `Late API hatasi: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const accounts = data.accounts || [];

    // Process accounts and create update object
    const platformUpdates: Record<string, string> = {};
    const accountsSummary: Array<{ platform: string; id: string; username?: string }> = [];

    for (const account of accounts) {
      if (account.platform && account._id) {
        const fieldName = `${account.platform}_id`;
        platformUpdates[fieldName] = account._id;
        accountsSummary.push({
          platform: account.platform,
          id: account._id,
          username: account.username,
        });
      }
    }

    // Update business document with platform IDs
    if (Object.keys(platformUpdates).length > 0) {
      await adminDb.collection("businesses").doc(businessId).update({
        ...platformUpdates,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `${accountsSummary.length} hesap senkronize edildi`,
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
