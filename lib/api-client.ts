import { auth } from "@/lib/firebase/config";

/**
 * Get the current user's Firebase ID token
 * Returns null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  const user = auth?.currentUser;
  if (!user) {
    return null;
  }

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper that adds Authorization header
 * Automatically gets the current user's Firebase ID token
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns Fetch response
 * @throws Error if not authenticated
 *
 * @example
 * const response = await authenticatedFetch("/api/agent-task", {
 *   method: "POST",
 *   body: JSON.stringify(data),
 * });
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Oturum açılmamış. Lütfen giriş yapın.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  // Ensure Content-Type is set for JSON requests
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Type-safe authenticated fetch that parses JSON response
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns Parsed JSON response
 * @throws Error if not authenticated or response is not ok
 */
export async function authenticatedFetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
