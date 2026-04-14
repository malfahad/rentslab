import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "RentSlab privacy policy (placeholder until jurisdiction-reviewed copy is published).",
};

export default function PrivacyPage() {
  return (
    <MarketingPage title="Privacy policy">
      <p>
        This is a placeholder page. Replace with jurisdiction-reviewed privacy
        policy text before linking prominently from signup and marketing forms.
      </p>
    </MarketingPage>
  );
}
