import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !adminStorage) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const token = formData.get("token") as string;
    const businessDataJson = formData.get("businessData") as string;
    const logoFile = formData.get("logo") as File | null;

    if (!token || !businessDataJson) {
      return NextResponse.json(
        { error: "Token ve işletme bilgileri gerekli" },
        { status: 400 }
      );
    }

    // Parse business data
    let businessData: Record<string, unknown>;
    try {
      businessData = JSON.parse(businessDataJson);
    } catch {
      return NextResponse.json(
        { error: "Geçersiz işletme verisi" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!businessData.name || typeof businessData.name !== "string") {
      return NextResponse.json(
        { error: "İşletme adı zorunludur" },
        { status: 400 }
      );
    }

    // Validate logo
    if (logoFile) {
      if (!logoFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Logo geçerli bir resim dosyası olmalıdır" },
          { status: 400 }
        );
      }
      if (logoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Logo dosyası 5MB'dan küçük olmalıdır" },
          { status: 400 }
        );
      }
    }

    // Validate token — only check expiry, not used status
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
    const expiresAt = new Date(invite.expiresAt);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Bu davet linkinin süresi dolmuş" },
        { status: 410 }
      );
    }

    // Upload logo if provided
    let logoUrl = "";
    if (logoFile) {
      const bucket = adminStorage.bucket();
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      const ext = logoFile.name.split(".").pop() || "png";
      const storagePath = `form_submissions/${token}/logo.${ext}`;
      const file = bucket.file(storagePath);

      await file.save(logoBuffer, {
        metadata: { contentType: logoFile.type },
      });

      await file.makePublic();
      logoUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    }

    const nowISO = now.toISOString();

    // Check if a submission already exists
    const submissionsSnapshot = await adminDb
      .collection("form_submissions")
      .where("token", "==", token)
      .limit(1)
      .get();

    let submissionId: string;

    if (!submissionsSnapshot.empty) {
      const existingDoc = submissionsSnapshot.docs[0];
      const existing = existingDoc.data();
      submissionId = existingDoc.id;

      const updateData: Record<string, unknown> = {
        data: businessData,
        updatedAt: nowISO,
        submittedAt: nowISO,
      };

      // Only update logo if a new one was uploaded
      if (logoUrl) {
        updateData.logoUrl = logoUrl;
      }

      // Keep status as submitted (or re-submit)
      if (existing.status === "draft") {
        updateData.status = "submitted";
      }
      // If already submitted or approved, keep current status but update data

      await existingDoc.ref.update(updateData);

      // If approved, also sync to business
      if (existing.status === "approved" && existing.businessId) {
        try {
          const businessRef = adminDb.collection("businesses").doc(existing.businessId);
          const profile = typeof businessData.profile === "object" && businessData.profile !== null ? businessData.profile : {};
          const businessUpdate: Record<string, unknown> = {
            name: ((businessData.name as string) || "").trim(),
            colors: Array.isArray(businessData.colors) ? businessData.colors : [],
            website: typeof businessData.website === "string" ? businessData.website.trim() : "",
            profile,
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (logoUrl) {
            businessUpdate.logo = logoUrl;
          }
          await businessRef.update(businessUpdate);
        } catch (error) {
          console.error("Business sync error:", error);
        }
      }
    } else {
      // Create new submission
      const newRef = await adminDb.collection("form_submissions").add({
        token,
        status: "submitted",
        data: businessData,
        logoUrl,
        createdAt: nowISO,
        updatedAt: nowISO,
        submittedAt: nowISO,
      });
      submissionId = newRef.id;
    }

    // Mark invite as used (first time only, idempotent)
    if (!invite.used) {
      await inviteRef.update({
        used: true,
        usedAt: nowISO,
        submissionId,
      });
    }

    return NextResponse.json({
      success: true,
      submissionId,
    });
  } catch (error) {
    console.error("Form submit error:", error);
    return NextResponse.json(
      { error: "Form gönderilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
