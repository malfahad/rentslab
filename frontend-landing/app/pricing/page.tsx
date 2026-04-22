import { MarketingPage } from "@/components/marketing-page";
import { PricingCalculator } from "@/components/pricing-calculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans and pricing for RentSlab. Straightforward fees, no surprise implementation line items.",
};

export default function PricingPage() {
  return (
    <MarketingPage
      title="Pricing"
      contentClassName="mt-6 max-w-6xl text-base leading-relaxed text-[#374151]"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-start">
        <section className="space-y-4">
          <p>
            RentSlab uses straightforward per-unit licensing so your cost scales
            with your portfolio. Use the calculator to estimate monthly and
            yearly pricing based on your current unit count.
          </p>
          <p>
            If you are evaluating for multiple buildings or phased rollout,
            contact the team for a tailored plan and onboarding timeline.
          </p>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <PricingCalculator />
        </aside>
      </div>
    </MarketingPage>
  );
}
