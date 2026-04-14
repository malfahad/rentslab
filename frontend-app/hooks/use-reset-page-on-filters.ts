import { useEffect, useRef } from "react";

/**
 * When `signature` changes (filters / sort), reset `tablePage` to 1 if needed.
 * Skips the first run.
 */
export function useResetPageOnFilters(
  tablePage: number,
  setTablePage: (n: number) => void,
  signature: string,
): void {
  const first = useRef(true);
  const prev = useRef(signature);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      prev.current = signature;
      return;
    }
    if (prev.current !== signature) {
      prev.current = signature;
      if (tablePage !== 1) setTablePage(1);
    }
  }, [signature, tablePage, setTablePage]);
}
