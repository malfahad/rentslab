import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function MarketingPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface-main py-16 md:py-20">
        <div className="mx-auto max-w-content px-4 md:px-6">
          <h1 className="font-serif text-3xl font-medium tracking-wide text-brand-navy md:text-4xl">
            {title}
          </h1>
          <div className="mt-6 max-w-[65ch] space-y-4 text-base leading-relaxed text-[#374151]">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
