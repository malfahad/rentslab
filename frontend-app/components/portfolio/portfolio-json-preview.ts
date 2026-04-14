import type { JsonObject } from "@/types/portfolio";

/** Short label for table cells; full value in `title` tooltip. */
export function jsonCellPreview(value: JsonObject | null | undefined): string {
  if (value == null || Object.keys(value).length === 0) return "—";
  try {
    const s = JSON.stringify(value);
    return s.length > 48 ? `${s.slice(0, 45)}…` : s;
  } catch {
    return "…";
  }
}
