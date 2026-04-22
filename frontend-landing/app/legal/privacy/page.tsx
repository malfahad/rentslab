import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Privacy Policy for RentSlab Property Management Software, including GDPR and Uganda Data Protection and Privacy Act context.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      title="Privacy policy"
      contentClassName="mt-6 max-w-4xl space-y-6 text-base leading-relaxed text-[#374151]"
    >
      <p className="text-sm text-[#6B7280]">
        <span className="font-medium text-[#374151]">Effective date:</span> June 22, 2025
        <br />
        <span className="font-medium text-[#374151]">Last updated:</span> June 22, 2025
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          1. Introduction
        </h2>
        <p>
          RentSlab ("we," "our," or "us") is property management software built
          to help landlords, property managers, and real estate teams run rental
          operations efficiently.
        </p>
        <p>
          We are committed to handling personal data in line with the General
          Data Protection Regulation (GDPR) (EU) 2016/679 and the Data
          Protection and Privacy Act, 2019 (Uganda). This policy explains how
          we collect, use, share, and protect personal data when you use
          RentSlab.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          2. Scope of this policy
        </h2>
        <p>This policy applies to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Property managers and landlords using RentSlab</li>
          <li>Tenants whose data is processed through the platform</li>
          <li>Website visitors and users of our services</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          3. Definitions
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <span className="font-medium text-[#111827]">Personal Data:</span>{" "}
            Information relating to an identified or identifiable individual.
          </li>
          <li>
            <span className="font-medium text-[#111827]">Data Controller:</span>{" "}
            The person or entity that determines the purposes and means of
            processing personal data.
          </li>
          <li>
            <span className="font-medium text-[#111827]">Data Processor:</span>{" "}
            An entity that processes personal data on behalf of the controller.
          </li>
        </ul>
        <p>
          In most cases, property managers and landlords are Data Controllers,
          while RentSlab acts as a Data Processor. Where we determine processing
          purposes directly (for example account management), we act as a Data
          Controller.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          4. Information we collect
        </h2>
        <h3 className="text-lg font-medium text-[#111827]">4.1 Account information</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Name, email address, and phone number</li>
          <li>Company or business details</li>
          <li>Login credentials</li>
        </ul>
        <h3 className="text-lg font-medium text-[#111827]">4.2 Tenant and property data</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Tenant names and contact details</li>
          <li>Lease agreements and rental history</li>
          <li>Payment and billing information</li>
          <li>Identification documents, where uploaded by users</li>
        </ul>
        <h3 className="text-lg font-medium text-[#111827]">4.3 Technical data</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>IP address</li>
          <li>Browser and device information</li>
          <li>Usage logs and analytics data</li>
        </ul>
        <h3 className="text-lg font-medium text-[#111827]">4.4 Financial data</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Payment transaction records</li>
          <li>Billing and invoicing details</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          5. Lawful basis for processing (GDPR)
        </h2>
        <p>We process personal data based on:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Contractual necessity to provide our services</li>
          <li>Legal obligations under applicable laws</li>
          <li>Legitimate interests in service quality and security</li>
          <li>Consent, where required (for example marketing communications)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          6. Use of personal data
        </h2>
        <p>We use personal data to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide and maintain RentSlab services</li>
          <li>Manage user accounts</li>
          <li>Support rent collection and property operations workflows</li>
          <li>Improve platform performance and security</li>
          <li>Communicate support updates, notices, and service messages</li>
          <li>Comply with legal and regulatory obligations</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          7. Data sharing and disclosure
        </h2>
        <p>We may share personal data with:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Service providers (hosting, payment processing, IT support)</li>
          <li>Property managers and landlords as part of service delivery</li>
          <li>Regulatory or law enforcement authorities where required by law</li>
          <li>Other third parties with consent or where necessary to provide services</li>
        </ul>
        <p>
          We require third parties handling personal data on our behalf to
          follow applicable data protection standards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          8. International data transfers
        </h2>
        <p>
          Where personal data is transferred outside Uganda or the European
          Economic Area (EEA), we implement appropriate safeguards, which may
          include Standard Contractual Clauses (SCCs) or transfers to
          jurisdictions recognized as having adequate protection.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          9. Data retention
        </h2>
        <p>
          We retain personal data only for as long as needed to deliver services
          and satisfy legal, accounting, or regulatory requirements.
        </p>
        <p>
          Users may request deletion of personal data, subject to legal and
          contractual obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          10. Data security
        </h2>
        <p>
          We implement technical and organizational measures designed to protect
          personal data, including:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Encryption controls</li>
          <li>Role-based access controls</li>
          <li>Secure server infrastructure</li>
          <li>Ongoing security review and monitoring practices</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          11. Your rights
        </h2>
        <p>Subject to applicable law, you may have the right to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of personal data</li>
          <li>Restrict or object to certain processing</li>
          <li>Request data portability</li>
          <li>Withdraw consent where processing relies on consent</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>
        <p>
          In Uganda, complaints may be directed to the Personal Data Protection
          Office (PDPO).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          12. Cookies and tracking technologies
        </h2>
        <p>
          We may use cookies and similar technologies to improve user
          experience, understand usage patterns, and enhance services. You can
          control cookies through browser settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          13. Children's privacy
        </h2>
        <p>
          RentSlab is not intended for individuals under 18 years of age. We do
          not knowingly collect personal data from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          14. Changes to this policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes
          may be communicated through email notifications or in-platform
          announcements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          15. Contact us
        </h2>
        <p>
          For questions or requests related to this Privacy Policy, contact:
        </p>
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed">
          <span className="font-medium text-[#111827]">RentSlab Data Protection Contact</span>
          <br />
          Email:{" "}
          <a href="mailto:support@rentslab.com" className="underline">
            support@rentslab.com
          </a>
          <br />
          Address: Uganda, Central, Kampala, Nakawa Division, Ntinda
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          16. Compliance statement
        </h2>
        <p>
          RentSlab is committed to compliance with the GDPR and the Uganda Data
          Protection and Privacy Act, 2019. We regularly review our data
          protection practices to align with legal and operational requirements.
        </p>
      </section>
    </MarketingPage>
  );
}
