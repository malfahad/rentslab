import type { ReactNode } from "react";

export function PortfolioEmptyState({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  illustration: ReactNode;
  title: string;
  description: string;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center shadow-sm"
      data-testid="portfolio-empty-state"
    >
      <div className="mb-6 w-full max-w-[240px]">{illustration}</div>
      <h2 className="font-serif text-xl font-medium text-brand-navy md:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6B7280]">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
}
