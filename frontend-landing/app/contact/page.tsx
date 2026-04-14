import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with RentSlab for sales, support, or partnerships.",
};

export default function ContactPage() {
  return (
    <MarketingPage title="Contact">
      <p>
        A contact form and routing to the right inbox will be added here. For
        now, reach out using the channel your team has shared with you, or
        continue from the home page calls to action.
      </p>
    </MarketingPage>
  );
}
