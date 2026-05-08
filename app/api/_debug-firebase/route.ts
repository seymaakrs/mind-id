import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? "";
  const diag = {
    has_FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    has_FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    private_key_length: key.length,
    private_key_starts_with_quote: key.startsWith('"'),
    private_key_ends_with_quote: key.endsWith('"'),
    private_key_has_literal_backslash_n: key.includes("\\n"),
    private_key_has_real_newline: key.includes("\n"),
    private_key_first_30: key.slice(0, 30),
    private_key_last_30: key.slice(-30),
    admin_db_initialized: !!adminDb,
    NODE_OPTIONS: process.env.NODE_OPTIONS ?? null,
    BASE_URL: process.env.BASE_URL ?? null,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? null,
  };

  if (!adminDb) {
    return NextResponse.json({ ok: false, stage: "admin_init", diag });
  }

  try {
    const doc = await adminDb.collection("settings").doc("app_settings").get();
    return NextResponse.json({
      ok: true,
      stage: "firestore_get",
      diag,
      docExists: doc.exists,
      serverUrl: doc.exists ? (doc.data()?.serverUrl ?? null) : null,
    });
  } catch (e) {
    const err = e as Error & { code?: string | number };
    return NextResponse.json({
      ok: false,
      stage: "firestore_get",
      diag,
      error: {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack?.split("\n").slice(0, 5),
      },
    });
  }
}
