import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  getAccessToken,
  getStoredOrgId,
  signOutAndRedirectToLogin,
} from "@/lib/auth-storage";

/**
 * Authenticated request with `Authorization` and `X-Org-ID` (from storage).
 * Missing token or org context triggers sign-out and redirect to `/login`.
 * @see API Reference — Organization context (`X-Org-ID`)
 */
export async function apiRequestAuthed<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    signOutAndRedirectToLogin("no_token");
    throw new Error("Not authenticated");
  }
  const orgId = getStoredOrgId();
  if (orgId == null) {
    signOutAndRedirectToLogin("no_org");
    throw new Error("No organization selected");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Org-ID", String(orgId));

  try {
    return await apiRequest<T>(path, { ...options, headers });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      signOutAndRedirectToLogin("session_expired");
    }
    throw e;
  }
}
