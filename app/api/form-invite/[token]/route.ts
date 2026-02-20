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

    if (invite.used) {
      return NextResponse.json(
        { valid: false, error: "Bu davet linki zaten kullanılmış" },
        { status: 410 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);

    if (now > expiresAt) {
      return NextResponse.json(
        { valid: false, error: "Bu davet linkinin süresi dolmuş" },
        { status: 410 }
      );
    }

    // Check if there's an existing draft submission
    let savedData: Record<string, unknown> | null = null;
    const submissionsSnapshot = await adminDb
      .collection("form_submissions")
      .where("token", "==", token)
      .where("status", "==", "draft")
      .limit(1)
      .get();

    if (!submissionsSnapshot.empty) {
      const submission = submissionsSnapshot.docs[0].data();
      savedData = submission.data as Record<string, unknown>;
    }

    return NextResponse.json({
      valid: true,
      label: invite.label || null,
      expiresAt: invite.expiresAt,
      savedData,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Token doğrulanırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
