import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth/verifyApiAuth";

export const maxDuration = 30;

interface GraphAPIResponse {
  permalink: string;
  owner: {
    username: string;
    id: string;
  };
  id: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyApiAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { postId, accessToken } = body;

    if (!postId || !accessToken) {
      return NextResponse.json(
        { error: "postId ve accessToken zorunludur" },
        { status: 400 }
      );
    }

    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(postId)}?fields=permalink,owner{username,id}&access_token=${accessToken}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: GraphAPIResponse = await response.json();

    if (data.error) {
      console.error("Graph API error:", data.error);
      return NextResponse.json(
        { error: data.error.message },
        { status: response.status }
      );
    }

    return NextResponse.json({
      permalink: data.permalink,
      owner: data.owner,
      id: data.id,
    });
  } catch (error) {
    console.error("Instagram permalink fetch error:", error);
    return NextResponse.json(
      { error: "Permalink alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
