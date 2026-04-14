"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listAllCreditNotesForInvoice } from "@/services/credit-note-service";
import { getInvoice } from "@/services/invoice-service";
import { listAllLineItemsForInvoice } from "@/services/invoice-line-item-service";
import type { CreditNoteDto, InvoiceDto, InvoiceLineItemDto } from "@/types/billing";

function addr(inv: InvoiceDto): string {
  return [
    inv.bill_to_address_line1,
    inv.bill_to_address_line2,
    inv.bill_to_city,
    inv.bill_to_region,
    inv.bill_to_postal_code,
    inv.bill_to_country_code,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [inv, setInv] = useState<InvoiceDto | null>(null);
  const [lines, setLines] = useState<InvoiceLineItemDto[]>([]);
  const [credits, setCredits] = useState<CreditNoteDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid invoice.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [invoice, li, cr] = await Promise.all([
        getInvoice(id),
        listAllLineItemsForInvoice(id),
        listAllCreditNotesForInvoice(id),
      ]);
      setInv(invoice);
      setLines(li);
      setCredits(cr);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load invoice.",
      );
      setInv(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/invoices"
        backLabel="Back to invoices"
        title="Invoice"
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

  const title =
    inv != null
      ? inv.invoice_number?.trim() || `Invoice #${inv.id}`
      : "Invoice";

  return (
    <DashboardDetailView
      backHref="/dashboard/invoices"
      backLabel="Back to invoices"
      title={loading ? "Invoice" : title}
      subtitle={
        loading
          ? "Loading…"
          : inv
            ? `${inv.tenant_name?.trim() || "Tenant"} · ${inv.lease_label?.trim() || "Lease"}`
            : undefined
      }
      suggestedActions={
        inv ? (
          <>
            <Link
              href={`/dashboard/leases/${inv.lease}`}
              className="btn-primary w-full"
            >
              View lease
            </Link>
            <Link
              href={`/dashboard/credit-notes?invoice=${inv.id}`}
              className="btn-secondary w-full"
            >
              Credit notes for this invoice
            </Link>
          </>
        ) : null
      }
    >
      {loadError ? (
        <p className="text-sm text-red-800">{loadError}</p>
      ) : null}
      {inv && !loadError ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Summary
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#6B7280]">Status</dt>
                <dd className="font-medium capitalize text-[#1A1A1A]">{inv.status}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Total</dt>
                <dd className="font-medium text-[#1A1A1A]">{inv.total_amount}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Issue date</dt>
                <dd className="text-[#1A1A1A]">{inv.issue_date}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Due date</dt>
                <dd className="text-[#1A1A1A]">{inv.due_date}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Bill to
            </h2>
            <p className="mt-2 text-sm text-[#1A1A1A]">
              {inv.bill_to_name?.trim() || inv.tenant_name?.trim() || "—"}
            </p>
            {addr(inv) ? (
              <p className="mt-1 text-sm text-[#6B7280]">{addr(inv)}</p>
            ) : null}
            {inv.bill_to_tax_id?.trim() ? (
              <p className="mt-2 text-sm text-[#6B7280]">
                Tax ID: {inv.bill_to_tax_id}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Line items
            </h2>
            {lines.length === 0 ? (
              <p className="mt-2 text-sm text-[#6B7280]">No line items.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-[#374151]">#</th>
                      <th className="px-3 py-2 font-semibold text-[#374151]">Description</th>
                      <th className="px-3 py-2 font-semibold text-[#374151]">Service</th>
                      <th className="px-3 py-2 text-right font-semibold text-[#374151]">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {lines.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 text-[#6B7280]">{row.line_number}</td>
                        <td className="px-3 py-2 text-[#1A1A1A]">{row.description}</td>
                        <td className="px-3 py-2 text-[#6B7280]">
                          {row.service_name?.trim() || "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-[#1A1A1A]">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Credit notes
            </h2>
            {credits.length === 0 ? (
              <p className="mt-2 text-sm text-[#6B7280]">None applied.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#F3F4F6]">
                {credits.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="text-[#1A1A1A]">
                      {c.credit_date} · {c.amount}
                    </span>
                    <span className="text-[#6B7280]">{c.reason || "—"}</span>
                    <Link
                      href={`/dashboard/credit-notes/${c.id}`}
                      className="text-sm font-medium text-brand-blue hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </DashboardDetailView>
  );
}
