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
        Core workflows include landlord/building/unit management, tenant and
        lease lifecycle, invoicing, payment allocation context, credit notes,
        maintenance-linked expenses, and role-based access for operations and
        finance.
      </p>
    </MarketingPage>
  );
}
