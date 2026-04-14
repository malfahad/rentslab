/** True when both have the same keys and values (order-independent). */
export function urlSearchParamsEqual(
  a: URLSearchParams,
  b: URLSearchParams,
): boolean {
  const keys = new Set<string>([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    if ((a.get(k) ?? "") !== (b.get(k) ?? "")) return false;
  }
  return true;
}
