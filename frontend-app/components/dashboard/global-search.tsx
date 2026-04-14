"use client";

import { useEffect, useId, useRef } from "react";
import { useDashboardUI } from "@/components/dashboard/dashboard-ui-context";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "buildings", label: "Buildings" },
  { id: "units", label: "Units" },
  { id: "tenants", label: "Tenants" },
  { id: "leases", label: "Leases" },
  { id: "payments", label: "Payments" },
] as const;

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useDashboardUI();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (globalSearchOpen) {
      inputRef.current?.focus();
    }
  }, [globalSearchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGlobalSearchOpen(false);
    }
    if (globalSearchOpen) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [globalSearchOpen, setGlobalSearchOpen]);

  return (
    <>
      <div className="flex min-w-0 flex-1 justify-center px-2 md:px-8">
        <button
          type="button"
          data-testid="global-search-trigger"
          onClick={() => setGlobalSearchOpen(true)}
          className="flex h-10 w-full max-w-xl items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-left text-sm text-white/70 transition hover:bg-white/15 md:max-w-2xl"
          aria-expanded={globalSearchOpen}
          aria-controls={panelId}
        >
          <svg
            className="h-4 w-4 shrink-0 text-white/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
          <span className="truncate">Search buildings, tenants, leases…</span>
          <kbd className="ml-auto hidden shrink-0 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60 sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      {globalSearchOpen ? (
        <div
          id={panelId}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${panelId}-title`}
          data-testid="global-search-panel"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close search"
            onClick={() => setGlobalSearchOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xl">
            <h2 id={`${panelId}-title`} className="sr-only">
              Global search
            </h2>
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <svg
                className="h-5 w-5 text-[#9CA3AF]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                placeholder="Search across your organization…"
                className="h-10 flex-1 border-0 bg-transparent text-[#1A1A1A] outline-none placeholder:text-[#9CA3AF]"
                data-testid="global-search-input"
              />
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-[#6B7280] hover:bg-[#F3F4F6]"
                onClick={() => setGlobalSearchOpen(false)}
              >
                Esc
              </button>
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              Filters
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="rounded-full border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-brand-navy hover:bg-white"
                  data-testid={`global-search-filter-${f.id}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-[#9CA3AF]">
              Results will appear here when search is connected to the API.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
