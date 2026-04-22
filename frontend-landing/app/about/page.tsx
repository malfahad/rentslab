import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "RentSlab helps property teams run leases, billing, collections, and reporting in one connected workflow.",
};

export default function AboutPage() {
  return (
    <MarketingPage title="About">
      <p>
        RentSlab is built for property managers and landlords who need clean
        control of portfolio operations and monthly collections. We bring units,
        tenants, leases, billing, and payments into one system so teams can
        work from the same numbers.
      </p>
      <p>
        Our focus is practical rent operations for East African portfolios:
        clear occupancy, predictable invoicing, payment visibility, and
        reporting finance teams can trust.
      </p>
      <p>
        The goal is simple: reduce back-and-forth, improve collection
        consistency, and make month-end less painful for everyone involved.
      </p>
      <p>
        RentSlab is developed by PVUG Technologies LTD, a Kampala-based company
        focused on practical business software. The wider PVUG brand, Platform
        Value Utilisation Gateway, reflects the same mission behind RentSlab:
        driving productivity through tools teams can use every day.
      </p>
      <p>
        For partnerships, onboarding conversations, or procurement requests, you
        can reach the team at{" "}
        <a href="mailto:support@rentslab.com" className="underline">
          support@rentslab.com
        </a>{" "}
        or{" "}
        <a href="tel:+256776881563" className="underline">
          +256 776 881 563
        </a>
        .
      </p>
    </MarketingPage>
  );
}
