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
        customer data.
      </p>
      <p>
        We are preparing a deeper security overview covering controls,
        subprocessors, and compliance posture. For due diligence in active
        evaluations, contact the team and we will share the latest materials.
      </p>
    </MarketingPage>
  );
}
