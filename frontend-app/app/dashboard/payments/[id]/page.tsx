"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listAllPaymentAllocationsForPayment } from "@/services/payment-allocation-service";
import { getPayment } from "@/services/payment-service";
import { getLease } from "@/services/lease-service";
import type { PaymentAllocationDto, PaymentDto } from "@/types/billing";
import type { LeaseDto } from "@/types/operations";

const METHOD_LABELS: Record<string, string> = {
  bank: "Bank transfer",
  mobile_money: "Mobile money",
  card: "Card",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function methodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method.replace(/_/g, " ");
}

function parseAmount(s: string): number {
  const n = Number.parseFloat(s.replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function leaseTitle(l: LeaseDto): string {
  const u = l.unit_label?.trim() || `Unit lease`;
  const b = l.building_name?.trim();
  return b ? `${u} · ${b}` : u;
}

export default function PaymentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [p, setP] = useState<PaymentDto | null>(null);
  const [allocations, setAllocations] = useState<PaymentAllocationDto[]>([]);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allocationsError, setAllocationsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid payment.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setAllocationsError(null);
    try {
      const pay = await getPayment(id);
      setP(pay);
      try {
        const allocs = await listAllPaymentAllocationsForPayment(id);
        setAllocations(allocs);
      } catch (e) {
        setAllocations([]);
        setAllocationsError(
          e instanceof ApiError
            ? e.messageForUser
            : "Could not load invoice allocations.",
        );
      }
      if (pay.lease != null) {
        try {
          setLease(await getLease(pay.lease));
        } catch {
          setLease(null);
        }
      } else {
        setLease(null);
      }
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load payment.",
      );
      setP(null);
      setAllocations([]);
      setLease(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  const totals = useMemo(() => {
    if (!p) {
      return { applied: 0, unallocated: 0 };
    }
    const paymentAmt = parseAmount(p.amount);
    const applied = allocations.reduce(
      (sum, a) => sum + parseAmount(a.amount_applied),
      0,
    );
    const unallocated = Math.round((paymentAmt - applied) * 100) / 100;
    return { applied, unallocated };
  }, [p, allocations]);

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/payments"
        backLabel="Back to payments"
        title="Payment"
        suggestedActions={null}
      >
        <p className="text-sm text-[#6B7280]">Preparing workspace…</p>
      </DashboardDetailView>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  const subtitle =
    loading || !p
      ? loading
        ? "Loading…"
        : undefined
      : `${formatWhen(p.payment_date)} · ${p.amount} · ${methodLabel(p.method)}`;

  return (
    <DashboardDetailView
      backHref="/dashboard/payments"
      backLabel="Back to payments"
      title={loading ? "Payment" : `Payment #${p?.id ?? id}`}
      subtitle={subtitle}
      suggestedActions={
        p ? (
          <>
            <Link
              href={`/dashboard/tenants/${p.tenant}`}
              className="btn-secondary w-full"
            >
              View tenant
            </Link>
            {p.lease != null ? (
              <Link
                href={`/dashboard/leases/${p.lease}`}
                className="btn-primary w-full"
              >
                View lease
              </Link>
            ) : null}
          </>
        ) : null
      }
    >
      {loadError ? (
        <p className="text-sm text-red-800">{loadError}</p>
      ) : null}
      {allocationsError ? (
        <p className="text-sm text-amber-800" role="status">
          {allocationsError}
        </p>
      ) : null}
      {p && !loadError ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Amount &amp; method
            </h2>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-[#6B7280]">Payment amount</dt>
                <dd className="text-lg font-semibold tabular-nums text-[#1A1A1A]">
                  {p.amount}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Method</dt>
                <dd className="font-medium capitalize text-[#1A1A1A]">
                  {methodLabel(p.method)}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Reference</dt>
                <dd className="font-mono text-[#1A1A1A]">
                  {p.reference?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Received</dt>
                <dd className="text-[#1A1A1A]">{formatWhen(p.payment_date)}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Applied to invoices</dt>
                <dd className="tabular-nums font-medium text-[#1A1A1A]">
                  {totals.applied.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Unallocated</dt>
                <dd
                  className={`tabular-nums font-medium ${
                    totals.unallocated > 0.0001
                      ? "text-[#B45309]"
                      : "text-[#1A1A1A]"
                  }`}
                >
                  {totals.unallocated.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Tenant &amp; lease
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#6B7280]">Tenant</dt>
                <dd>
                  <Link
                    href={`/dashboard/tenants/${p.tenant}`}
                    className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                  >
                    {p.tenant_name?.trim() || `Tenant #${p.tenant}`}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Lease</dt>
                <dd className="text-[#1A1A1A]">
                  {p.lease == null ? (
                    <span className="text-[#6B7280]">Not linked</span>
                  ) : lease ? (
                    <Link
                      href={`/dashboard/leases/${p.lease}`}
                      className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                    >
                      {leaseTitle(lease)}
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/leases/${p.lease}`}
                      className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                    >
                      Lease #{p.lease}
                    </Link>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {allocations.length > 0 ? (
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Invoice allocations
              </h2>
              <p className="mt-1 text-xs text-[#6B7280]">
                How this payment was applied to open invoices.
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-[#E5E7EB]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <tr>
                      <th className="px-3 py-2 font-medium text-[#374151]">
                        Invoice
                      </th>
                      <th className="px-3 py-2 font-medium text-[#374151]">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-[#374151]">
                        Invoice total
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-[#374151]">
                        Applied
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {allocations.map((a) => (
                      <tr key={a.id}>
                        <td className="px-3 py-2">
                          <Link
                            href={`/dashboard/invoices/${a.invoice}`}
                            className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                          >
                            {a.invoice_number?.trim() || `Invoice #${a.invoice}`}
                          </Link>
                        </td>
                        <td className="px-3 py-2 capitalize text-[#6B7280]">
                          {a.invoice_status ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {a.invoice_total_amount ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium tabular-nums text-[#1A1A1A]">
                          {a.amount_applied}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFBFC] p-4 text-sm text-[#6B7280]">
              No amounts were allocated to invoices for this payment. The full
              amount is unallocated unless recorded elsewhere.
            </section>
          )}

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Payer (as recorded)
            </h2>
            {![
              p.payer_name,
              p.payer_type,
              p.payer_email,
              p.payer_phone,
              p.payer_address_line1,
            ].some((x) => (x ?? "").toString().trim()) ? (
              <p className="mt-2 text-sm text-[#6B7280]">No payer details stored.</p>
            ) : (
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {p.payer_name?.trim() ? (
                  <div>
                    <dt className="text-[#6B7280]">Name</dt>
                    <dd className="text-[#1A1A1A]">{p.payer_name}</dd>
                  </div>
                ) : null}
                {p.payer_type?.trim() ? (
                  <div>
                    <dt className="text-[#6B7280]">Type</dt>
                    <dd className="capitalize text-[#1A1A1A]">{p.payer_type}</dd>
                  </div>
                ) : null}
                {p.payer_email?.trim() ? (
                  <div>
                    <dt className="text-[#6B7280]">Email</dt>
                    <dd className="text-[#1A1A1A]">{p.payer_email}</dd>
                  </div>
                ) : null}
                {p.payer_phone?.trim() ? (
                  <div>
                    <dt className="text-[#6B7280]">Phone</dt>
                    <dd className="text-[#1A1A1A]">{p.payer_phone}</dd>
                  </div>
                ) : null}
                {[
                  p.payer_address_line1,
                  p.payer_address_line2,
                  p.payer_city,
                  p.payer_region,
                  p.payer_postal_code,
                  p.payer_country_code,
                ].some((x) => (x ?? "").toString().trim()) ? (
                  <div className="sm:col-span-2">
                    <dt className="text-[#6B7280]">Address</dt>
                    <dd className="whitespace-pre-line text-[#1A1A1A]">
                      {[
                        p.payer_address_line1,
                        p.payer_address_line2,
                        [p.payer_city, p.payer_region, p.payer_postal_code]
                          .filter(Boolean)
                          .join(", "),
                        p.payer_country_code,
                      ]
                        .filter((x) => (x ?? "").toString().trim())
                        .join("\n")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            )}
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Record
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#6B7280]">Organization</dt>
                <dd className="font-mono text-xs text-[#374151]">#{p.org}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Created</dt>
                <dd className="text-[#1A1A1A]">{formatWhen(p.created_at)}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Last updated</dt>
                <dd className="text-[#1A1A1A]">{formatWhen(p.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </DashboardDetailView>
  );
}
