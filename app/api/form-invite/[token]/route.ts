import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token gerekli" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("form_invites").doc(token);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { valid: false, error: "Geçersiz davet linki" },
        { status: 404 }
      );
    }

    const invite = docSnap.data()!;

    // Check expiry — this is the only hard block
    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);

    if (now > expiresAt) {
      return NextResponse.json(
        { valid: false, error: "Bu davet linkinin süresi dolmuş" },
        { status: 410 }
      );
    }

    // Check if there's an existing submission (draft, submitted, or approved)
    let savedData: Record<string, unknown> | null = null;
    let submissionStatus: string | null = null;
    let logoUrl: string | null = null;
    let businessId: string | null = null;

    const submissionsSnapshot = await adminDb
      .collection("form_submissions")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (!submissionsSnapshot.empty) {
      const submission = submissionsSnapshot.docs[0].data();
      submissionStatus = submission.status as string;
      savedData = submission.data as Record<string, unknown>;
      logoUrl = submission.logoUrl || null;
      businessId = submission.businessId || null;
    }

    return NextResponse.json({
      valid: true,
      label: invite.label || null,
      expiresAt: invite.expiresAt,
      savedData,
      submissionStatus, // "draft" | "submitted" | "approved" | null
      logoUrl,
      businessId,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Token doğrulanırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
