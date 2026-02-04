import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: "super_admin" | "admin" | "editor";
}

export interface AuthSuccess {
  success: true;
  user: AuthenticatedUser;
}

export interface AuthError {
  success: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthError;

/**
 * Verify API authentication from Authorization header
 * Extracts Bearer token, verifies with Firebase Admin, checks admin role
 *
 * @param request - The incoming request with Authorization header
 * @returns AuthResult with user info on success, or NextResponse error on failure
 *
 * @example
 * const authResult = await verifyApiAuth(request);
 * if (!authResult.success) {
 *   return authResult.response;
 * }
 * const { user } = authResult;
 */
export async function verifyApiAuth(request: Request): Promise<AuthResult> {
  // Check if Firebase Admin is initialized
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin not initialized");
    return {
      success: false,
      response: NextResponse.json(
        { error: "Sunucu yapılandırma hatası" },
        { status: 500 }
      ),
    };
  }

  // Extract token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Oturum açılmamış. Lütfen giriş yapın." },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    // Check admin status in Firestore using uid (matching AuthContext pattern)
    const adminDoc = await adminDb.collection("admins").doc(uid).get();

    if (!adminDoc.exists) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Bu işlemi yapmaya yetkiniz yok." },
          { status: 403 }
        ),
      };
    }

    const adminData = adminDoc.data();
    const role = adminData?.role as "super_admin" | "admin" | "editor" | undefined;

    if (!role || !["super_admin", "admin", "editor"].includes(role)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Bu işlemi yapmaya yetkiniz yok." },
          { status: 403 }
        ),
      };
    }

    // Use email from token, fallback to admin document
    const userEmail = email || (adminData?.email as string) || "";

    return {
      success: true,
      user: {
        uid,
        email: userEmail,
        role,
      },
    };
  } catch (error) {
    console.error("Token verification error:", error);

    // Handle specific Firebase auth errors
    const errorCode = (error as { code?: string }).code;
    if (errorCode === "auth/id-token-expired") {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." },
          { status: 401 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş oturum." },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verify API authentication with minimum required role
 *
 * @param request - The incoming request
 * @param minRole - Minimum required role ("editor" < "admin" < "super_admin")
 * @returns AuthResult
 */
export async function verifyApiAuthWithRole(
  request: Request,
  minRole: "editor" | "admin" | "super_admin"
): Promise<AuthResult> {
  const authResult = await verifyApiAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  const roleHierarchy = {
    editor: 1,
    admin: 2,
    super_admin: 3,
  };

  const userRoleLevel = roleHierarchy[authResult.user.role];
  const requiredRoleLevel = roleHierarchy[minRole];

  if (userRoleLevel < requiredRoleLevel) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Bu işlemi yapmaya yetkiniz yok." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
