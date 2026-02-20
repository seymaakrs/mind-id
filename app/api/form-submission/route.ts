import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

// GET: List submissions (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "submitted";

    const snapshot = await adminDb
      .collection("form_submissions")
      .where("status", "==", status)
      .limit(50)
      .get();

    const submissions = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const aDate = (a as Record<string, unknown>).updatedAt as string || "";
        const bDate = (b as Record<string, unknown>).updatedAt as string || "";
        return bDate.localeCompare(aDate);
      });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Submissions list error:", error);
    return NextResponse.json(
      { error: "Başvurular yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE: Reject/delete a submission (admin only)
export async function DELETE(request: NextRequest) {
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

    await submissionRef.update({
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: authResult.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submission reject error:", error);
    return NextResponse.json(
      { error: "Başvuru reddedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
