import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "RentSlab terms of service (placeholder until legal review).",
};

export default function TermsPage() {
  return (
    <MarketingPage title="Terms of service">
      <p>
        This is a placeholder page. Replace with counsel-approved terms before
        requiring acceptance in the product.
      </p>
    </MarketingPage>
  );
}
