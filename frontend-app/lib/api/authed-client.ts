import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { getAccessToken, getStoredOrgId } from "@/lib/auth-storage";

/**
 * Authenticated request with `Authorization` and `X-Org-ID` (from storage).
 * @see API Reference — Organization context (`X-Org-ID`)
 */
export async function apiRequestAuthed<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const orgId = getStoredOrgId();
  if (orgId == null) {
    throw new Error("No organization selected");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Org-ID", String(orgId));
  return apiRequest<T>(path, { ...options, headers });
}
