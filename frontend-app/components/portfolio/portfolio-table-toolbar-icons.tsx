"use client";

import type { ReactNode } from "react";

/** Flat toolbar control: icon button with optional “active” state when a panel is open. */
export function tableToolbarIconClass(active?: boolean): string {
  return [
    "rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30",
    active
      ? "bg-[#EEF2FF] text-brand-navy"
      : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-brand-navy",
  ].join(" ");
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconFilter({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 4h16l-6 7v5l-4 2v-7L4 4z" />
    </svg>
  );
}

/** Reset / clear filters (stroke X). */
export function IconClearFilters({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconColumns({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h5v12H4V6zM10.5 6H20v12H10.5V6z" />
      <path d="M10.5 12H20" opacity="0.35" />
    </svg>
  );
}

export function PortfolioToolbarIconButton({
  label,
  active,
  onClick,
  children,
  testId,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className={tableToolbarIconClass(active)}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
