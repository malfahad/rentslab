"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import {
  createPublicPaymentAttempt,
  getPublicPaymentLink,
} from "@/services/payment-link-service";
import type { PublicPaymentLinkDto } from "@/types/payment-links";

type Step = "verified" | "pay" | "confirmed";
const STEP_LABELS: Record<Step, string> = {
  verified: "Your details",
  pay: "Payment information",
  confirmed: "Confirmation",
};

export default function PublicPaymentLinkPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [data, setData] = useState<PublicPaymentLinkDto | null>(null);
  const [step, setStep] = useState<Step>("verified");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkNotFound, setLinkNotFound] = useState(false);
  const [linkGone, setLinkGone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setError(null);
    setLinkNotFound(false);
    setLinkGone(false);
    void getPublicPaymentLink(slug)
      .then(setData)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) {
          setLinkNotFound(true);
          return;
        }
        if (e instanceof ApiError && e.status === 410) {
          setLinkGone(true);
          return;
        }
        setError("We could not load this payment link. Please confirm the code and try again.");
      });
  }, [slug]);

  const primaryInvoice = useMemo(() => data?.invoices[0] ?? null, [data]);
  const maskedTenant = useMemo(() => {
    const name = (data?.tenant_name || "").trim();
    if (!name) return "Verified tenant";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      const first = parts[0];
      return `${first.slice(0, 1)}${"*".repeat(Math.max(first.length - 1, 2))}`;
    }
    return parts
      .map((part, idx) => {
        if (!part) return "";
        if (idx === 0) return `${part.slice(0, 1)}${"*".repeat(Math.max(part.length - 1, 2))}`;
        return `${part.slice(0, 1)}.`;
      })
      .join(" ");
  }, [data?.tenant_name]);

  async function payNow() {
    if (!slug || !primaryInvoice) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createPublicPaymentAttempt(slug, {
        invoice_id: primaryInvoice.id,
        amount: primaryInvoice.outstanding_amount,
        payer_name: payerName,
        payer_email: payerEmail,
        payer_phone: payerPhone,
        payment_method: paymentMethod,
      });
      setMessage(res.message);
      setStep("confirmed");
    } catch {
      setError("We could not initialize your payment right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (linkNotFound) {
    return (
      <main className="min-h-screen bg-surface-main px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">404</p>
          <h1 className="mt-2 font-serif text-2xl font-medium text-brand-navy">
            Payment link not found
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            This payment link is invalid or no longer available. Please confirm the link with your
            property manager and try again.
          </p>
        </div>
      </main>
    );
  }

  if (linkGone) {
    return (
      <main className="min-h-screen bg-surface-main px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">410</p>
          <h1 className="mt-2 font-serif text-2xl font-medium text-brand-navy">
            Payment link is no longer active
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            This payment link has been deactivated or has expired. Please contact your property
            manager for a new payment link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-main px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm md:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            RentSlab Secure Payment
          </p>
          <h1 className="mt-1 font-serif text-xl font-medium text-brand-navy md:text-2xl">
            Pay your rent invoice
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Verified payment link for your unit. Review the details below before proceeding.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Invoice details
            </p>
          {data ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Property</p>
                <p className="mt-1 text-base font-semibold text-brand-navy">
                  {data.property_name} · Unit {data.unit_number}
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Tenant verified</p>
                <p className="mt-1 font-medium text-[#111827]">
                  {maskedTenant}
                </p>
              </div>
              <div className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-3">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Amount due</p>
                <p className="mt-1 text-2xl font-semibold text-brand-navy">
                  {primaryInvoice?.outstanding_amount ?? "0.00"}
                </p>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Invoice {primaryInvoice?.invoice_number || `#${primaryInvoice?.id ?? ""}`} · Due{" "}
                  {primaryInvoice?.due_date || "N/A"}
                </p>
              </div>
              <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-brand-blue ring-1 ring-[#BFDBFE]">
                Payment code: {data.payment_code}
              </span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#6B7280]">Loading payment details...</p>
          )}
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">3-step flow</p>
            <ol className="mt-3 flex flex-wrap gap-2 text-xs">
              {(["verified", "pay", "confirmed"] as Step[]).map((s) => (
                <li
                  key={s}
                  className={`rounded-full px-3 py-1 font-semibold capitalize ${
                    step === s ? "bg-brand-navy text-white" : "bg-[#F3F4F6] text-[#4B5563]"
                  }`}
                >
                  {STEP_LABELS[s]}
                </li>
              ))}
            </ol>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            {step !== "confirmed" ? (
              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="text-[#374151]">Full name</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-[#111827]"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-[#374151]">Email</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-[#111827]"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-[#374151]">Phone</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-[#111827]"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-[#374151]">Payment method</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[#111827]"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="card">Card</option>
                    <option value="bank">Bank transfer</option>
                    <option value="mobile_money">Mobile money</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled
                  className="btn-primary-sm mt-1 inline-flex h-11 w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pay (coming soon)
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">Payment initialized</p>
                <p className="mt-1 text-sm text-emerald-700">
                  {message ||
                    "Your payment request has been created and is waiting for gateway confirmation."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
