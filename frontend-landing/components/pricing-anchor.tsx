import { AuthCtas } from "@/components/auth-ctas";

export function PricingAnchor() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-y border-gray-200 bg-white py-16 md:py-20"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-content px-4 text-center md:px-6">
        <h2
          id="pricing-heading"
          className="font-serif text-2xl font-medium tracking-wide text-brand-navy md:text-3xl"
        >
          You could start onboarding your first property today
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[#374151]">
          No implementation fees. Add your units, set up your team, and start
          getting clean visibility into occupancy, billing, and collections.
        </p>
        <AuthCtas theme="light" className="mt-8 justify-center" />
      </div>
    </section>
  );
}
