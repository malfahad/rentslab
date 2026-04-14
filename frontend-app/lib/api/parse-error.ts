/** Maps DRF-style JSON error bodies to a single user-visible string. */
export function formatApiErrorBody(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "Something went wrong.";
  }
  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string") return d.detail;
  if (
    Array.isArray(d.detail) &&
    d.detail.length &&
    typeof d.detail[0] === "string"
  ) {
    return d.detail[0];
  }
  const firstKey = Object.keys(d).find((k) => k !== "detail");
  if (firstKey) {
    const v = d[firstKey];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return "Something went wrong.";
}
