import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";
import { FieldValue } from "firebase-admin/firestore";
import { buildBrandIdentityFromBusiness } from "@/lib/brandIdentity";

// Onaylanan işletme için kanonik marka kimliği dokümanını
// (businesses/{id}/brand_identity/v1) formdan eşleyerek yazar.
// Hata olsa bile onay akışını BOZMAZ (sadece loglar) — additive/güvenli.
async function writeBrandIdentity(
  businessId: string,
  data: Record<string, unknown>,
  logoUrl: string
): Promise<void> {
  try {
    if (!adminDb) return;
    const bi = buildBrandIdentityFromBusiness({
      businessId,
      name: (data.name as string) || "",
      logo: logoUrl,
      colors: data.colors,
      profile:
        typeof data.profile === "object" && data.profile !== null
          ? (data.profile as Record<string, unknown>)
          : {},
      source: "manual",
    });
    await adminDb
      .collection("businesses")
      .doc(businessId)
      .collection("brand_identity")
      .doc("v1")
      .set(bi);
  } catch (error) {
    console.error("Brand identity write error (non-critical):", error);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin yapılandırılmamış" },
        { status: 500 }
      );
    }

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID gerekli" },
        { status: 400 }
      );
    }

    const submissionRef = adminDb.collection("form_submissions").doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: "Başvuru bulunamadı" },
        { status: 404 }
      );
    }

    const submission = submissionDoc.data()!;

    if (submission.status !== "submitted") {
      return NextResponse.json(
        { error: "Bu başvuru henüz tamamlanmamış" },
        { status: 400 }
      );
    }

    const data = submission.data as Record<string, unknown>;

    // Move logo from form_submissions/ to businesses/ path if exists
    let logoUrl = submission.logoUrl || "";
    if (logoUrl && adminStorage) {
      try {
        const bucket = adminStorage.bucket();
        const oldPath = logoUrl.split(`${bucket.name}/`)[1];
        if (oldPath && oldPath.startsWith("form_submissions/")) {
          const ext = oldPath.split(".").pop() || "png";
          const newBusinessRef = adminDb.collection("businesses").doc();
          const newPath = `businesses/${newBusinessRef.id}/logo.${ext}`;
          const oldFile = bucket.file(oldPath);
          await oldFile.copy(bucket.file(newPath));
          await bucket.file(newPath).makePublic();
          logoUrl = `https://storage.googleapis.com/${bucket.name}/${newPath}`;

          // Create business with the pre-generated ID
          await newBusinessRef.set({
            name: ((data.name as string) || "").trim(),
            logo: logoUrl,
            colors: Array.isArray(data.colors) ? data.colors : [],
            website: typeof data.website === "string" ? data.website.trim() : "",
            profile: typeof data.profile === "object" && data.profile !== null ? data.profile : {},
            status: "approved",
            submitted_via: submission.token,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Update submission status
          await submissionRef.update({
            status: "approved",
            approvedAt: new Date().toISOString(),
            approvedBy: authResult.user.email,
            businessId: newBusinessRef.id,
          });

          // Clean up old logo
          try {
            await oldFile.delete();
          } catch {
            // Non-critical, ignore
          }

          await writeBrandIdentity(newBusinessRef.id, data, logoUrl);

          return NextResponse.json({
            success: true,
            businessId: newBusinessRef.id,
          });
        }
      } catch (error) {
        console.error("Logo copy error:", error);
        // Continue with original logoUrl
      }
    }

    // Fallback: create business without logo copy
    const businessDoc = {
      name: ((data.name as string) || "").trim(),
      logo: logoUrl,
      colors: Array.isArray(data.colors) ? data.colors : [],
      website: typeof data.website === "string" ? data.website.trim() : "",
      profile: typeof data.profile === "object" && data.profile !== null ? data.profile : {},
      status: "approved",
      submitted_via: submission.token,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const businessRef = await adminDb.collection("businesses").add(businessDoc);

    await writeBrandIdentity(businessRef.id, data, logoUrl);

    await submissionRef.update({
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: authResult.user.email,
      businessId: businessRef.id,
    });

    return NextResponse.json({
      success: true,
      businessId: businessRef.id,
    });
  } catch (error) {
    console.error("Submission approve error:", error);
    return NextResponse.json(
      { error: "Başvuru onaylanırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
