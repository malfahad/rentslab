"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listCreditNotes } from "@/services/credit-note-service";
import type { PaginatedResponse } from "@/types/api";
import type { CreditNoteDto } from "@/types/billing";

function parsePositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function CreditNotesPageClient() {
  const searchParams = useSearchParams();
  const invoiceFromUrl = searchParams.get("invoice") ?? "";
  const tenantFromUrl = searchParams.get("tenant") ?? "";
  const leaseFromUrl = searchParams.get("lease") ?? "";
  const unitFromUrl = searchParams.get("unit") ?? "";
  const buildingFromUrl = searchParams.get("building") ?? "";
  const { orgReady, orgId } = useOrg();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const [data, setData] = useState<PaginatedResponse<CreditNoteDto> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const scopeParams = useMemo(
    () => ({
      invoice__lease__tenant: parsePositiveInt(tenantFromUrl),
      invoice__lease: parsePositiveInt(leaseFromUrl),
      invoice__lease__unit: parsePositiveInt(unitFromUrl),
      invoice__lease__unit__building: parsePositiveInt(buildingFromUrl),
    }),
    [tenantFromUrl, leaseFromUrl, unitFromUrl, buildingFromUrl],
  );

  const scopeSignature = useMemo(() => JSON.stringify(scopeParams), [scopeParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, invoiceFromUrl, scopeSignature]);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const invRaw = invoiceFromUrl.trim();
      const invNum = invRaw === "" ? NaN : Number(invRaw);
      const r = await listCreditNotes({
        page,
        pageSize: 24,
        search: debouncedSearch || undefined,
        invoice: Number.isFinite(invNum) ? invNum : undefined,
        invoice__lease: scopeParams.invoice__lease,
        invoice__lease__tenant: scopeParams.invoice__lease__tenant,
        invoice__lease__unit: scopeParams.invoice__lease__unit,
        invoice__lease__unit__building: scopeParams.invoice__lease__unit__building,
        ordering: "-credit_date",
      });
      setData(r);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load credit notes.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, debouncedSearch, invoiceFromUrl, scopeParams]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  if (!orgReady) {
    return (
      <DashboardListView title="Credit notes" description="Loading…">
        <p className="text-sm text-[#6B7280]">Preparing workspace…</p>
      </DashboardListView>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 24));

  const hasScopeFilter =
    tenantFromUrl.trim() !== "" ||
    leaseFromUrl.trim() !== "" ||
    unitFromUrl.trim() !== "" ||
    buildingFromUrl.trim() !== "";

  const filterDescriptionParts: string[] = [];
  if (invoiceFromUrl.trim() !== "") {
    filterDescriptionParts.push(`invoice #${invoiceFromUrl.trim()}`);
  }
  if (tenantFromUrl.trim() !== "") {
    filterDescriptionParts.push(`tenant #${tenantFromUrl.trim()}`);
  }
  if (leaseFromUrl.trim() !== "") {
    filterDescriptionParts.push(`lease #${leaseFromUrl.trim()}`);
  }
  if (unitFromUrl.trim() !== "") {
    filterDescriptionParts.push(`unit #${unitFromUrl.trim()}`);
  }
  if (buildingFromUrl.trim() !== "") {
    filterDescriptionParts.push(`building #${buildingFromUrl.trim()}`);
  }
  const filterDescription = filterDescriptionParts.join(", ");

  return (
    <DashboardListView
      title="Credit notes"
      description="Adjustments and reductions applied to invoices."
      actions={
        <Link
          href={
            invoiceFromUrl.trim() !== ""
              ? `/dashboard/credit-notes/create?invoice=${encodeURIComponent(invoiceFromUrl.trim())}`
              : "/dashboard/credit-notes/create"
          }
          className="btn-primary-sm"
          data-testid="credit-notes-add"
        >
          New credit note
        </Link>
      }
    >
      <div className="mx-auto max-w-content space-y-4">
        {invoiceFromUrl.trim() !== "" || hasScopeFilter ? (
          <p className="text-sm text-[#6B7280]">
            Filtered to {filterDescription}.{" "}
            <Link href="/dashboard/credit-notes" className="font-medium text-brand-blue hover:underline">
              Clear filters
            </Link>
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block max-w-md flex-1 text-sm">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Search reason, invoice number…"
              className="h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <p className="text-sm text-[#6B7280]">
            {loading ? "Loading…" : `${total} credit note${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}

        {!loadError && !loading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center text-sm text-[#6B7280]">
            No credit notes found.
          </div>
        ) : null}

        {!loadError && rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Date</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Invoice</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Amount</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Reason</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 text-[#1A1A1A]">{c.credit_date}</td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {c.invoice_number?.trim() || `Invoice #${c.invoice}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{c.amount}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-[#6B7280]">
                      {c.reason || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/credit-notes/${c.id}`}
                        className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loadError && totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4">
            <p className="text-sm text-[#6B7280]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="h-9 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="h-9 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardListView>
  );
}
