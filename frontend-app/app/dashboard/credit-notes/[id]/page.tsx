"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getCreditNote } from "@/services/credit-note-service";
import type { CreditNoteDto } from "@/types/billing";

export default function CreditNoteDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [row, setRow] = useState<CreditNoteDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid credit note.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      setRow(await getCreditNote(id));
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load credit note.",
      );
      setRow(null);
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
        backHref="/dashboard/credit-notes"
        backLabel="Back to credit notes"
        title="Credit note"
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

  return (
    <DashboardDetailView
      backHref="/dashboard/credit-notes"
      backLabel="Back to credit notes"
      title={loading ? "Credit note" : `Credit note #${row?.id ?? id}`}
      subtitle={
        loading
          ? "Loading…"
          : row
            ? `${row.credit_date} · ${row.amount}`
            : undefined
      }
      suggestedActions={
        row ? (
          <>
            <Link
              href={`/dashboard/invoices/${row.invoice}`}
              className="btn-primary w-full"
            >
              View invoice
            </Link>
            {row.invoice_lease != null ? (
              <Link
                href={`/dashboard/leases/${row.invoice_lease}`}
                className="btn-secondary w-full"
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
      {row && !loadError ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Details
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#6B7280]">Amount</dt>
                <dd className="font-medium text-[#1A1A1A]">{row.amount}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Credit date</dt>
                <dd className="text-[#1A1A1A]">{row.credit_date}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6B7280]">Reason</dt>
                <dd className="text-[#1A1A1A]">{row.reason?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280]">Invoice</dt>
                <dd>
                  <Link
                    href={`/dashboard/invoices/${row.invoice}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {row.invoice_number?.trim() || `#${row.invoice}`}
                  </Link>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </DashboardDetailView>
  );
}
