import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans and pricing for RentSlab. Straightforward fees, no surprise implementation line items.",
};

export default function PricingPage() {
  return (
    <MarketingPage title="Pricing">
      <p>
        We are finalizing public tiers and FAQs. For now, use the home page
        pricing band for time-to-value messaging, or reach out through Contact
        for a tailored quote.
      </p>
    </MarketingPage>
  );
}
