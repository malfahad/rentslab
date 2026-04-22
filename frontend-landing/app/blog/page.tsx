import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product updates, operator notes, and ideas on running rent rolls well.",
};

export default function BlogPage() {
  return (
    <MarketingPage title="Blog">
      <p>
        RentSlab publishes product updates, operator notes, and practical guides
        for running rent operations with fewer surprises.
      </p>
      <p>
        Expect short, useful posts on collections workflows, lease operations,
        reporting discipline, and what we are shipping next.
      </p>
    </MarketingPage>
  );
}
