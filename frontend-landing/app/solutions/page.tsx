import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "RentSlab for residential, commercial, and mixed portfolios across East Africa.",
};

export default function SolutionsPage() {
  return (
    <MarketingPage title="Solutions">
      <p>
        Whether you run residential blocks, commercial parks, or mixed assets,
        the same lease-centric model applies: clear occupancy, predictable
        billing, and collections you can reconcile.
      </p>
      <p>
        RentSlab adapts to how teams actually operate: owners who need oversight,
        managers who need daily execution, and finance teams who need trusted
        monthly numbers.
      </p>
    </MarketingPage>
  );
}
