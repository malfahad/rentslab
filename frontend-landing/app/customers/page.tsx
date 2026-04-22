import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
  description: "How operators use RentSlab to run portfolios with financial clarity.",
};

export default function CustomersPage() {
  return (
    <MarketingPage title="Customers">
      <p>
        Property managers, landlords, and finance teams use RentSlab to run
        portfolios with fewer handoffs and cleaner month-end workflows.
      </p>
      <p>
        The strongest patterns are consistent: better rent roll visibility,
        faster reconciliation, and clearer accountability across operations and
        finance.
      </p>
    </MarketingPage>
  );
}
