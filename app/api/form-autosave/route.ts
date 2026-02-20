import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

// POST: Save/update draft data for a token
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    const { token, data } = await request.json();

    if (!token || !data) {
      return NextResponse.json(
        { error: "Token ve form verisi gerekli" },
        { status: 400 }
      );
    }

    // Validate token exists and is not expired/used
    const inviteRef = adminDb.collection("form_invites").doc(token);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return NextResponse.json(
        { error: "Geçersiz davet linki" },
        { status: 404 }
      );
    }

    const invite = inviteDoc.data()!;

    if (invite.used) {
      return NextResponse.json(
        { error: "Bu davet linki zaten kullanılmış" },
        { status: 410 }
      );
    }

    const now = new Date();
    if (now > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { error: "Bu davet linkinin süresi dolmuş" },
        { status: 410 }
      );
    }

    // Check if a submission already exists for this token
    const existingSnapshot = await adminDb
      .collection("form_submissions")
      .where("token", "==", token)
      .limit(1)
      .get();

    const nowISO = now.toISOString();

    if (existingSnapshot.empty) {
      // Create new draft
      const docRef = await adminDb.collection("form_submissions").add({
        token,
        status: "draft",
        data,
        createdAt: nowISO,
        updatedAt: nowISO,
      });

      // Link submission to invite
      await inviteRef.update({ submissionId: docRef.id });

      return NextResponse.json({ success: true, submissionId: docRef.id });
    } else {
      // Update existing draft
      const existingDoc = existingSnapshot.docs[0];
      const existing = existingDoc.data();

      // Don't overwrite if already submitted
      if (existing.status === "submitted") {
        return NextResponse.json(
          { error: "Bu form zaten gönderilmiş" },
          { status: 410 }
        );
      }

      await existingDoc.ref.update({
        data,
        updatedAt: nowISO,
      });

      return NextResponse.json({ success: true, submissionId: existingDoc.id });
    }
  } catch (error) {
    console.error("Form autosave error:", error);
    return NextResponse.json(
      { error: "Form kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
