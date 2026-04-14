import { useCallback, useEffect, useState } from "react";

export function usePersistedColumnVisibility(
  storageKey: string,
  defaultVisible: Set<string>,
): readonly [Set<string>, (next: Set<string>) => void] {
  const [visible, setVisible] = useState<Set<string>>(defaultVisible);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const arr = JSON.parse(raw) as unknown;
      if (!Array.isArray(arr) || arr.length === 0) return;
      const next = new Set<string>();
      for (const x of arr) {
        if (typeof x === "string") next.add(x);
      }
      if (next.size > 0) setVisible(next);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      setVisible(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  return [visible, persist] as const;
}
