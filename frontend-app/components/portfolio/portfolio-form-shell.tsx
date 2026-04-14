import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Full-page layout for resource create/edit: back link, title, scrollable body, footer with Cancel + primary submit.
 */
export function PortfolioFormShell({
  backHref,
  backLabel,
  title,
  description,
  children,
  footer,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="portfolio-form-shell"
    >
      <header className="shrink-0 border-b border-[#E5E7EB] bg-white px-4 py-3 md:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-navy"
          data-testid="portfolio-form-back"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path
              d="M15 6l-6 6 6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel}
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-medium text-brand-navy md:text-[26px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
      <footer className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-2xl flex-wrap justify-end gap-2">
          {footer}
        </div>
      </footer>
    </div>
  );
}
