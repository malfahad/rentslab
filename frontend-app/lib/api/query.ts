/** Build `?a=1&b=2` (no leading `?` in path — pass `path + '?' + buildQuery(...)` or embed). */
export function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
