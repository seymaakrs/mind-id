import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

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

    const { label, expiresInDays } = await request.json();

    if (!expiresInDays || expiresInDays < 1 || expiresInDays > 30) {
      return NextResponse.json(
        { error: "Geçerlilik süresi 1-30 gün arası olmalıdır" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const inviteData = {
      createdBy: authResult.user.email,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      ...(label && { label: label.trim() }),
    };

    const docRef = await adminDb.collection("form_invites").add(inviteData);

    return NextResponse.json({
      success: true,
      token: docRef.id,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Form invite creation error:", error);
    return NextResponse.json(
      { error: "Davet linki oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}

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

    const snapshot = await adminDb
      .collection("form_invites")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const invites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Form invites list error:", error);
    return NextResponse.json(
      { error: "Davet linkleri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
