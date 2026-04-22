import { MarketingPage } from "@/components/marketing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of Service for RentSlab property management software.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms of service"
      contentClassName="mt-6 max-w-4xl space-y-6 text-base leading-relaxed text-[#374151]"
    >
      <p className="text-sm text-[#6B7280]">
        <span className="font-medium text-[#374151]">Effective date:</span> June 22, 2025
        <br />
        <span className="font-medium text-[#374151]">Last updated:</span> June 22, 2025
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          1. Agreement to terms
        </h2>
        <p>
          These Terms of Service ("Terms") govern your access to and use of
          RentSlab, including our website, software, and related services. By
          using RentSlab, you agree to these Terms.
        </p>
        <p>
          If you are using RentSlab on behalf of a company or organization, you
          represent that you have authority to bind that entity to these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          2. Services provided
        </h2>
        <p>
          RentSlab provides property operations software for managing portfolios,
          tenants, leases, billing, payment workflows, and reporting.
        </p>
        <p>
          We may add, update, or discontinue features from time to time to
          improve service quality and security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          3. Eligibility and account registration
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>You must provide accurate registration information.</li>
          <li>
            You are responsible for maintaining confidentiality of account
            credentials and for activity under your account.
          </li>
          <li>
            You must promptly notify us of unauthorized access or security
            concerns.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          4. Customer responsibilities
        </h2>
        <p>When using RentSlab, you agree to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Use the service in compliance with applicable laws and regulations.</li>
          <li>Maintain lawful rights to data you upload or process through the platform.</li>
          <li>Not misuse the platform, attempt unauthorized access, or disrupt service operations.</li>
          <li>Not use RentSlab to process unlawful, fraudulent, or harmful activity.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          5. Data protection and privacy
        </h2>
        <p>
          Your use of RentSlab is also governed by our Privacy Policy. Where
          applicable, customers act as data controllers for tenant and property
          data, and RentSlab acts as a processor or controller depending on the
          processing purpose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          6. Fees and billing
        </h2>
        <p>
          Paid features are billed based on the pricing model presented during
          signup, agreement, or purchase. Unless otherwise agreed in writing,
          fees are non-refundable except where required by law.
        </p>
        <p>
          You are responsible for applicable taxes, duties, or charges
          associated with your subscription or use of paid services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          7. Intellectual property
        </h2>
        <p>
          RentSlab and all related software, trademarks, and content are owned
          by PVUG Technologies LTD or its licensors. These Terms grant you a
          limited, non-exclusive, non-transferable right to use the service
          during the active subscription period.
        </p>
        <p>
          You retain ownership of your data. You grant us the rights necessary
          to host, process, and display your data solely to provide the service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          8. Third-party services
        </h2>
        <p>
          RentSlab may integrate with or rely on third-party services such as
          payment providers, communication tools, or infrastructure providers.
          We are not responsible for the independent acts or terms of third
          parties outside our control.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          9. Service availability and changes
        </h2>
        <p>
          We aim to maintain reliable service availability but do not guarantee
          uninterrupted or error-free operation. We may perform scheduled
          maintenance, upgrades, or emergency interventions when needed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          10. Suspension and termination
        </h2>
        <p>
          We may suspend or terminate access if you materially breach these
          Terms, fail to pay required fees, or use the service in a way that
          creates security, legal, or operational risk.
        </p>
        <p>
          You may stop using the service at any time. Upon termination, your
          access ends, and data handling follows our retention and legal
          obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          11. Disclaimers
        </h2>
        <p>
          RentSlab is provided on an "as available" basis. To the maximum extent
          permitted by law, we disclaim implied warranties including fitness for
          a particular purpose, merchantability, and non-infringement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          12. Limitation of liability
        </h2>
        <p>
          To the extent permitted by law, RentSlab and PVUG Technologies LTD
          will not be liable for indirect, incidental, special, consequential,
          or punitive damages, or for loss of profits, data, or goodwill.
        </p>
        <p>
          Our aggregate liability for claims arising from these Terms is limited
          to the amounts paid by you for the service during the twelve months
          preceding the claim.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          13. Indemnification
        </h2>
        <p>
          You agree to indemnify and hold harmless RentSlab, PVUG Technologies
          LTD, and its team from claims, losses, and expenses arising from your
          misuse of the service, breach of these Terms, or violation of
          applicable law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          14. Governing law and dispute resolution
        </h2>
        <p>
          These Terms are governed by the laws of Uganda, unless otherwise
          required by mandatory consumer protection laws. Parties will first seek
          to resolve disputes in good faith before escalation to competent courts
          or applicable dispute resolution processes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          15. Changes to these terms
        </h2>
        <p>
          We may update these Terms from time to time. Material changes may be
          communicated via email or platform notice. Continued use after updated
          Terms take effect constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
          16. Contact information
        </h2>
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed">
          <span className="font-medium text-[#111827]">RentSlab (PVUG Technologies LTD)</span>
          <br />
          Email:{" "}
          <a href="mailto:support@rentslab.com" className="underline">
            support@rentslab.com
          </a>
          <br />
          Phone:{" "}
          <a href="tel:+256776881563" className="underline">
            +256 776 881 563
          </a>
          <br />
          Address: Uganda, Central, Kampala, Nakawa Division, Ntinda
        </p>
      </section>
    </MarketingPage>
  );
}
