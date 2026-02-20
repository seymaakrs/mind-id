import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

    // Validate token exists and is not expired
    const inviteRef = adminDb.collection("form_invites").doc(token);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return NextResponse.json(
        { error: "Geçersiz davet linki" },
        { status: 404 }
      );
    }

    const invite = inviteDoc.data()!;

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
      // Update existing submission (draft, submitted, or approved)
      const existingDoc = existingSnapshot.docs[0];
      const existing = existingDoc.data();

      await existingDoc.ref.update({
        data,
        updatedAt: nowISO,
      });

      // If approved, also update the linked business
      if (existing.status === "approved" && existing.businessId) {
        try {
          const businessRef = adminDb.collection("businesses").doc(existing.businessId);
          const profile = typeof data.profile === "object" && data.profile !== null ? data.profile : {};
          await businessRef.update({
            name: ((data.name as string) || "").trim(),
            colors: Array.isArray(data.colors) ? data.colors : [],
            website: typeof data.website === "string" ? data.website.trim() : "",
            profile,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (error) {
          console.error("Business sync error:", error);
          // Non-critical: submission saved, business sync failed
        }
      }

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
