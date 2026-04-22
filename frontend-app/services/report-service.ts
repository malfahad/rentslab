import { apiRequestAuthed } from "@/lib/api/authed-client";

/**
 * Org-scoped report payload (live or stub). Query keys match backend
 * ``periodStart`` / ``periodEnd`` / ``asOf`` etc.
 */
export async function fetchReport(
  slug: string,
  query: Record<string, string>,
): Promise<unknown> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") qs.set(k, v);
  }
  const path = `/reports/${encodeURIComponent(slug)}/`;
  const q = qs.toString();
  return apiRequestAuthed<unknown>(`${path}${q ? `?${q}` : ""}`);
}
