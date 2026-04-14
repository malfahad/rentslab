import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Portfolio, leases, billing, payments, and reporting in one property management system.",
};

export default function ProductPage() {
  return (
    <MarketingPage title="Product">
      <p>
        RentSlab brings portfolios, leases, billing, and collections into one
        ledger so your team sees the same numbers from the rent roll to the bank.
      </p>
      <p>
        This page will expand with module-level detail aligned with how you work:
        units and tenants, recurring charges, partial payments, allocations, and
        role-based access for operations and finance.
      </p>
    </MarketingPage>
  );
}
