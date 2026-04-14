"use client";

import { useEffect, useState } from "react";

export type PortfolioViewMode = "table" | "grid";

export function usePortfolioViewMode(
  storageKey: string,
): readonly [PortfolioViewMode, (m: PortfolioViewMode) => void] {
  const [mode, setMode] = useState<PortfolioViewMode>("table");
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "grid" || v === "table") setMode(v);
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  const persist = (m: PortfolioViewMode) => {
    setMode(m);
    try {
      localStorage.setItem(storageKey, m);
    } catch {
      /* ignore */
    }
  };
  return [mode, persist] as const;
}

export function PortfolioViewToggle({
  mode,
  onChange,
  testId = "portfolio-view-toggle",
}: {
  mode: PortfolioViewMode;
  onChange: (m: PortfolioViewMode) => void;
  testId?: string;
}) {
  const btn =
    "rounded-md px-3 py-1.5 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30";
  return (
    <div
      className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5 text-sm"
      role="group"
      aria-label="View mode"
      data-testid={testId}
    >
      <button
        type="button"
        className={`${btn} ${
          mode === "table"
            ? "bg-white text-brand-navy shadow-sm"
            : "text-[#6B7280] hover:text-[#374151]"
        }`}
        onClick={() => onChange("table")}
      >
        Table
      </button>
      <button
        type="button"
        className={`${btn} ${
          mode === "grid"
            ? "bg-white text-brand-navy shadow-sm"
            : "text-[#6B7280] hover:text-[#374151]"
        }`}
        onClick={() => onChange("grid")}
      >
        Grid
      </button>
    </div>
  );
}
