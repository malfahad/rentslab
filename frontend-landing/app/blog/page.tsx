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
        Articles and changelog cross-links will appear here. For product news,
        check back as we ship.
      </p>
    </MarketingPage>
  );
}
