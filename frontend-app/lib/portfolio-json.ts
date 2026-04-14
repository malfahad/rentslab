/** Parse optional JSON object fields for landlord/bank_details style API fields. */
export function parseJsonObjectField(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const v = JSON.parse(t) as unknown;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    throw new Error("Must be a JSON object");
  } catch {
    throw new Error("Invalid JSON object");
  }
}

export function stringifyJsonObjectField(
  v: Record<string, unknown> | null | undefined,
): string {
  if (v == null) return "";
  return JSON.stringify(v, null, 2);
}
