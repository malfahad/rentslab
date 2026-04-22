import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  title: string;
  subtitle: string;
  illustration: ReactNode;
  children: ReactNode;
};

/**
 * Split layout: illustration + copy on large screens, stacked on small.
 */
export function AuthPageLayout({
  title,
  subtitle,
  illustration,
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-main lg:flex-row">
      <aside className="flex flex-col gap-8 border-b border-[#E5E7EB] bg-gradient-to-b from-white via-white to-[#F1F4F7] px-6 py-10 lg:w-[44%] lg:max-w-xl lg:justify-center lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
        <div className="mx-auto hidden w-full max-w-[300px] shrink-0 md:block lg:mx-0">
          {illustration}
        </div>
        <div className="mx-auto max-w-md text-center lg:mx-0 lg:text-left">
          <h1 className="font-serif text-[28px] font-medium leading-snug tracking-tight text-brand-navy md:text-[32px]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
            {subtitle}
          </p>
        </div>
      </aside>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 lg:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
