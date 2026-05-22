import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";
import type {
  ConnectionPlatform,
  ConnectionState,
  ConnectionStatus,
} from "@/types/firebase";

export const maxDuration = 30;

const ZERNIO_BASE_URL = process.env.ZERNIO_BASE_URL || "https://api.zernio.com/v1";

const SUPPORTED_PLATFORMS: ConnectionPlatform[] = [
  "instagram",
  "facebook",
  "twitter",
  "tiktok",
  "youtube",
  "linkedin",
  "whatsapp",
];

function httpsGet(
  url: string,
  headers: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: string }> {
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

type ZernioAccount = {
  platform?: string;
  _id?: string;
  username?: string;
  status?: string;
  expires_at?: string;
  expiresAt?: string;
  token_expires_at?: string;
};

function computeState(account: ZernioAccount): ConnectionState {
  const explicit = (account.status || "").toLowerCase();
  if (explicit === "disconnected" || explicit === "expired" || explicit === "revoked") {
    return "disconnected";
  }
  const expiresIso = account.expires_at || account.expiresAt || account.token_expires_at;
  if (expiresIso) {
    const expiresMs = Date.parse(expiresIso);
    if (Number.isFinite(expiresMs)) {
      const now = Date.now();
      if (expiresMs <= now) return "disconnected";
      const daysLeft = (expiresMs - now) / (1000 * 60 * 60 * 24);
      if (daysLeft < 7) return "expiring";
    }
  }
  return "connected";
}

export async function POST(request: NextRequest) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin yapilandirilmamis" },
        { status: 500 },
      );
    }

    const { businessId } = (await request.json()) as { businessId?: string };
    if (!businessId) {
      return NextResponse.json({ error: "businessId gerekli" }, { status: 400 });
    }

    const businessRef = adminDb.collection("businesses").doc(businessId);
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) {
      return NextResponse.json({ error: "Isletme bulunamadi" }, { status: 404 });
    }

    const business = businessDoc.data() ?? {};
    const profileId =
      (business.zernio_profile_id as string | undefined) ||
      (business.late_profile_id as string | undefined);

    if (!profileId) {
      return NextResponse.json(
        { error: "Zernio Profile ID tanimli degil" },
        { status: 400 },
      );
    }

    const secretDoc = await adminDb.collection("secrets").doc("other").get();
    const secrets = secretDoc.exists ? secretDoc.data() ?? {} : {};
    const zernioApiKey = secrets.zernio_api_key as string | undefined;
    if (!zernioApiKey) {
      return NextResponse.json(
        { error: "Zernio API anahtari yapilandirilmamis" },
        { status: 500 },
      );
    }

    const apiUrl = `${ZERNIO_BASE_URL}/accounts?profileId=${encodeURIComponent(profileId)}`;
    const response = await httpsGet(apiUrl, {
      Authorization: `Bearer ${zernioApiKey}`,
      "Content-Type": "application/json",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Zernio API hatasi: ${response.status}` },
        { status: response.status },
      );
    }

    const parsed = JSON.parse(response.data) as { accounts?: ZernioAccount[] };
    const accounts = parsed.accounts ?? [];
    const nowIso = new Date().toISOString();

    const connections: Record<string, ConnectionStatus> = {};

    // Önce her platformu "never" olarak başlat — sonra dönen verilerle güncelle.
    for (const platform of SUPPORTED_PLATFORMS) {
      const existing = (business.connections as Record<string, ConnectionStatus> | undefined)?.[
        platform
      ];
      connections[platform] = existing ?? {
        status: "never",
        source: "zernio",
      };
    }

    for (const account of accounts) {
      const platform = (account.platform || "").toLowerCase() as ConnectionPlatform;
      if (!SUPPORTED_PLATFORMS.includes(platform)) continue;
      connections[platform] = {
        status: computeState(account),
        username: account.username ?? null,
        account_id: account._id ?? null,
        last_synced_at: nowIso,
        expires_at:
          account.expires_at || account.expiresAt || account.token_expires_at || null,
        source: "zernio",
      };
    }

    await businessRef.update({
      connections,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      connections,
    });
  } catch (error) {
    console.error("Connection status error:", error);
    return NextResponse.json(
      { error: "Bağlantı durumu alınırken hata oluştu" },
      { status: 500 },
    );
  }
}
