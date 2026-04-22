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
        Talk to the RentSlab team about sales, onboarding, support, or
        partnerships. We help property operators map the right rollout path for
        their portfolio and workflows.
      </p>
      <p>
        The fastest way to reach us is by email at{" "}
        <a href="mailto:support@rentslab.com" className="underline">
          support@rentslab.com
        </a>{" "}
        or by phone at{" "}
        <a href="tel:+256776881563" className="underline">
          +256 776 881 563
        </a>
        .
      </p>
      <p>
        You can also visit{" "}
        <a
          href="https://pvugtech.com"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          pvugtech.com
        </a>{" "}
        for company information. We are based in Kampala, Uganda and support
        property teams across East Africa.
      </p>
    </MarketingPage>
  );
}
