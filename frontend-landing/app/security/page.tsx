import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security",
  description:
    "High-level security and data handling practices for RentSlab (summary for customers and prospects).",
};

export default function SecurityPage() {
  return (
    <MarketingPage title="Security">
      <p>
        RentSlab is built for finance-grade expectations: access control by
        organization and role, audit-friendly workflows, and careful handling of
        customer data. A fuller security overview, including subprocessors and
        compliance posture, will be published here after legal review.
      </p>
    </MarketingPage>
  );
}
