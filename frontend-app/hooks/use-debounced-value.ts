import { useEffect, useRef, useState } from "react";

/**
 * Debounces `value`. When `syncKey` changes (e.g. URL query string), `debounced`
 * updates immediately so list filters stay aligned with the address bar.
 */
export function useDebouncedValue<T>(
  value: T,
  delayMs: number,
  syncKey?: string,
): T {
  const [debounced, setDebounced] = useState(value);
  const prevSyncKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (syncKey !== undefined && syncKey !== prevSyncKey.current) {
      prevSyncKey.current = syncKey;
      setDebounced(value);
      return;
    }
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs, syncKey]);

  return debounced;
}
