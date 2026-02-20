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

    // Validate token with Firestore transaction (atomic check + update)
    const inviteRef = adminDb.collection("form_invites").doc(token);

    const result = await adminDb.runTransaction(async (transaction) => {
      const inviteDoc = await transaction.get(inviteRef);

      if (!inviteDoc.exists) {
        return { error: "Geçersiz davet linki", status: 404 };
      }

      const invite = inviteDoc.data()!;

      if (invite.used) {
        return { error: "Bu davet linki zaten kullanılmış", status: 410 };
      }

      const now = new Date();
      const expiresAt = new Date(invite.expiresAt);

      if (now > expiresAt) {
        return { error: "Bu davet linkinin süresi dolmuş", status: 410 };
      }

      // Upload logo if provided
      let logoUrl = "";
      if (logoFile) {
        const bucket = adminStorage!.bucket();
        const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
        const ext = logoFile.name.split(".").pop() || "png";
        const storagePath = `businesses/pending_${Date.now()}/logo.${ext}`;
        const file = bucket.file(storagePath);

        await file.save(logoBuffer, {
          metadata: {
            contentType: logoFile.type,
          },
        });

        // Make the file publicly accessible
        await file.makePublic();
        logoUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
      }

      // Create business document
      const businessDoc = {
        name: (businessData.name as string).trim(),
        logo: logoUrl,
        colors: Array.isArray(businessData.colors) ? businessData.colors : [],
        website: typeof businessData.website === "string" ? businessData.website.trim() : "",
        profile: typeof businessData.profile === "object" && businessData.profile !== null
          ? businessData.profile
          : {},
        status: "pending",
        submitted_via: token,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const businessRef = adminDb!.collection("businesses").doc();
      transaction.set(businessRef, businessDoc);

      // Mark invite as used
      transaction.update(inviteRef, {
        used: true,
        usedAt: now.toISOString(),
        businessId: businessRef.id,
      });

      return { success: true, businessId: businessRef.id };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      businessId: result.businessId,
    });
  } catch (error) {
    console.error("Form submit error:", error);
    return NextResponse.json(
      { error: "Form gönderilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
