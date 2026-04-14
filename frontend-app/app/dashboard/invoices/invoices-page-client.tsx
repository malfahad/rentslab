"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { issueInvoices, listInvoices } from "@/services/invoice-service";
import type { PaginatedResponse } from "@/types/api";
import type { InvoiceDto, IssueInvoicesResultDto } from "@/types/billing";

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "void", label: "Void" },
];

export function InvoicesPageClient() {
  const { orgReady, orgId } = useOrg();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<PaginatedResponse<InvoiceDto> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState<IssueInvoicesResultDto | null>(
    null,
  );
  const [issueError, setIssueError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const r = await listInvoices({
        page,
        pageSize: 24,
        search: debouncedSearch || undefined,
        status: status || undefined,
        ordering: "-issue_date",
      });
      setData(r);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load invoices.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, debouncedSearch, status]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  async function runIssueInvoices(dryRun: boolean) {
    if (orgId == null) return;
    setIssuing(true);
    setIssueError(null);
    setIssueResult(null);
    try {
      const r = await issueInvoices({ dry_run: dryRun });
      setIssueResult(r);
      await load();
    } catch (e) {
      setIssueError(
        e instanceof ApiError ? e.messageForUser : "Could not issue invoices.",
      );
    } finally {
      setIssuing(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardListView title="Invoices" description="Loading…">
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

  return (
    <DashboardListView
      title="Invoices"
      description="Rent and service charges billed to leases."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary-sm"
            disabled={issuing}
            onClick={() => void runIssueInvoices(false)}
          >
            {issuing ? "Issuing…" : "Issue invoices"}
          </button>
          <button
            type="button"
            className="btn-secondary-sm"
            disabled={issuing}
            onClick={() => void runIssueInvoices(true)}
          >
            Dry run
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-content space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <label className="block min-w-[200px] max-w-md flex-1 text-sm">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Search number, tenant, unit…"
              className="h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-[#6B7280]">Status</span>
            <select
              className="mt-1 h-10 min-w-[140px] rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-[#6B7280] sm:ml-auto">
            {loading ? "Loading…" : `${total} invoice${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {issueError ? (
          <p className="text-sm text-red-800">{issueError}</p>
        ) : null}
        {issueResult ? (
          <div
            className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#374151]"
            role="status"
          >
            {issueResult.dry_run ? (
              <p className="font-medium text-brand-navy">Dry run (no writes)</p>
            ) : null}
            <p>
              Created:{" "}
              <span className="font-medium">
                {issueResult.dry_run
                  ? issueResult.would_create_count
                  : issueResult.created_count}
              </span>{" "}
              invoice
              {(issueResult.dry_run
                ? issueResult.would_create_count
                : issueResult.created_count) === 1
                ? ""
                : "s"}
            </p>
            {issueResult.truncated_lease_ids.length > 0 ? (
              <p className="mt-2 text-amber-800">
                Some leases hit the 100-period cap (IDs:{" "}
                {issueResult.truncated_lease_ids.join(", ")}). Run again to
                continue.
              </p>
            ) : null}
            {issueResult.errors.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-red-800">
                {issueResult.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}

        {!loadError && !loading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center text-sm text-[#6B7280]">
            No invoices match your filters.
          </div>
        ) : null}

        {!loadError && rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Number</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Tenant</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Unit</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Issue</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Due</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Amount</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                      {inv.invoice_number?.trim() || `Invoice #${inv.id}`}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {inv.tenant_name?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {inv.lease_label?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{inv.issue_date}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{inv.due_date}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{inv.total_amount}</td>
                    <td className="px-4 py-3 capitalize text-[#6B7280]">{inv.status}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
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
