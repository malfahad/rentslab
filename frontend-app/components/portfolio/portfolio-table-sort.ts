/** DRF-style: `field` ascending, `-field` descending, empty = API default ordering. */
export function cycleOrdering(field: string, current: string): string {
  const asc = field;
  const desc = `-${field}`;
  if (current === asc) return desc;
  if (current === desc) return "";
  return asc;
}

export function sortIndicator(field: string, ordering: string): "asc" | "desc" | null {
  if (ordering === field) return "asc";
  if (ordering === `-${field}`) return "desc";
  return null;
}
