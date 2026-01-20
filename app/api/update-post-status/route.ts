import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type PostStatus = "planned" | "created" | "posted" | "skipped";

interface UpdatePostStatusRequest {
  business_id: string;
  plan_id: string;
  post_id: string;
  status: PostStatus;
  instagram_post_id?: string; // Optional: Instagram post ID after posting
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON istegi." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Gecersiz veri formati." }, { status: 400 });
  }

  const { business_id, plan_id, post_id, status, instagram_post_id } = body as UpdatePostStatusRequest;

  // Validate required fields
  if (!business_id || typeof business_id !== "string") {
    return NextResponse.json({ error: "`business_id` alani zorunludur." }, { status: 400 });
  }

  if (!plan_id || typeof plan_id !== "string") {
    return NextResponse.json({ error: "`plan_id` alani zorunludur." }, { status: 400 });
  }

  if (!post_id || typeof post_id !== "string") {
    return NextResponse.json({ error: "`post_id` alani zorunludur." }, { status: 400 });
  }

  const validStatuses: PostStatus[] = ["planned", "created", "posted", "skipped"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "`status` alani gecerli bir deger olmalidir (planned, created, posted, skipped)." },
      { status: 400 }
    );
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin yapilandirilmamis." }, { status: 500 });
  }

  try {
    // Get the content plan document
    const planRef = adminDb
      .collection("businesses")
      .doc(business_id)
      .collection("content_calendar")
      .doc(plan_id);

    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return NextResponse.json({ error: "Plan bulunamadi." }, { status: 404 });
    }

    const planData = planDoc.data();
    if (!planData || !Array.isArray(planData.posts)) {
      return NextResponse.json({ error: "Plan verisi gecersiz." }, { status: 500 });
    }

    // Find and update the post
    let postFound = false;
    const updatedPosts = planData.posts.map((post: { id: string; status: PostStatus; instagram_post_id?: string }) => {
      if (post.id === post_id) {
        postFound = true;
        const updatedPost = { ...post, status };
        // Add instagram_post_id if provided
        if (instagram_post_id) {
          updatedPost.instagram_post_id = instagram_post_id;
        }
        return updatedPost;
      }
      return post;
    });

    if (!postFound) {
      return NextResponse.json({ error: "Post bulunamadi." }, { status: 404 });
    }

    // Update the plan with new posts array
    await planRef.update({
      posts: updatedPosts,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Post durumu '${status}' olarak guncellendi.`,
      post_id,
      status,
    });
  } catch (error) {
    console.error("Error updating post status:", error);
    return NextResponse.json(
      {
        error: "Post durumu guncellenirken hata olustu.",
        details: error instanceof Error ? error.message : "Bilinmeyen hata.",
      },
      { status: 500 }
    );
  }
}

// Also support GET for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "update-post-status",
    method: "POST",
    required_fields: ["business_id", "plan_id", "post_id", "status"],
    optional_fields: ["instagram_post_id"],
    valid_statuses: ["planned", "created", "posted", "skipped"],
  });
}
