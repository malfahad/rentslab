import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth-storage";

/** Authenticated request without org header (e.g. list orgs, bootstrap). */
export async function apiRequestBearer<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return apiRequest<T>(path, { ...options, headers });
}
