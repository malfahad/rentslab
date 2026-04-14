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
        Case studies and quotes will live here once we publish named stories.
        Until then, the home page highlights how teams use RentSlab day to day.
      </p>
    </MarketingPage>
  );
}
