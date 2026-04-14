import Link from "next/link";
import type { ReactNode } from "react";

/** List / index pages: title row + actions on the right. */
export function DashboardListView({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="dashboard-list-view">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 py-4 md:px-6">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-medium text-brand-navy md:text-[26px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

/** Detail pages: back link, title, main column + suggested actions sidebar. */
export function DashboardDetailView({
  backHref,
  backLabel,
  title,
  subtitle,
  suggestedActions,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  suggestedActions: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="dashboard-detail-view"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-4 py-3 md:px-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-navy"
            data-testid="dashboard-detail-back"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {backLabel}
          </Link>
          <h1 className="mt-3 font-serif text-2xl font-medium text-brand-navy md:text-[26px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
          {children}
        </div>
      </div>
      <aside
        className="shrink-0 border-t border-[#E5E7EB] bg-white lg:w-80 lg:border-l lg:border-t-0"
        data-testid="dashboard-detail-suggestions"
      >
        <div className="sticky top-0 p-4 md:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Suggested actions
          </h2>
          <div className="mt-3 space-y-3">{suggestedActions}</div>
        </div>
      </aside>
    </div>
  );
}
