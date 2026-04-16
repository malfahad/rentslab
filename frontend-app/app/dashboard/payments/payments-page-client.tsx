"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listPayments } from "@/services/payment-service";
import type { PaginatedResponse } from "@/types/api";
import type { PaymentDto } from "@/types/billing";

const METHOD_OPTIONS = [
  { value: "", label: "Any method" },
  { value: "bank", label: "Bank" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function parsePositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function PaymentsPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { orgReady, orgId } = useOrg();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const [method, setMethod] = useState("");
  const [data, setData] = useState<PaginatedResponse<PaymentDto> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tenantFromUrl = searchParams.get("tenant") ?? "";
  const leaseFromUrl = searchParams.get("lease") ?? "";
  const unitFromUrl = searchParams.get("unit") ?? "";
  const buildingFromUrl = searchParams.get("building") ?? "";

  const scopeParams = useMemo(
    () => ({
      tenant: parsePositiveInt(tenantFromUrl),
      lease: parsePositiveInt(leaseFromUrl),
      lease__unit: parsePositiveInt(unitFromUrl),
      lease__unit__building: parsePositiveInt(buildingFromUrl),
    }),
    [tenantFromUrl, leaseFromUrl, unitFromUrl, buildingFromUrl],
  );

  const scopeSignature = useMemo(() => JSON.stringify(scopeParams), [scopeParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, method, scopeSignature]);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const r = await listPayments({
        page,
        pageSize: 24,
        search: debouncedSearch || undefined,
        method: method || undefined,
        ordering: "-payment_date",
        tenant: scopeParams.tenant,
        lease: scopeParams.lease,
        lease__unit: scopeParams.lease__unit,
        lease__unit__building: scopeParams.lease__unit__building,
      });
      setData(r);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load payments.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, debouncedSearch, method, scopeParams]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  if (!orgReady) {
    return (
      <DashboardListView title="Payments" description="Loading…">
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

  const scopeDescriptionParts: string[] = [];
  if (tenantFromUrl.trim() !== "") {
    scopeDescriptionParts.push(`tenant #${tenantFromUrl.trim()}`);
  }
  if (leaseFromUrl.trim() !== "") {
    scopeDescriptionParts.push(`lease #${leaseFromUrl.trim()}`);
  }
  if (unitFromUrl.trim() !== "") {
    scopeDescriptionParts.push(`unit #${unitFromUrl.trim()}`);
  }
  if (buildingFromUrl.trim() !== "") {
    scopeDescriptionParts.push(`building #${buildingFromUrl.trim()}`);
  }
  const scopeDescription = scopeDescriptionParts.join(", ");

  return (
    <DashboardListView
      title="Payments"
      description="Incoming rent and charges recorded against tenants and leases."
      actions={
        <Link
          href="/dashboard/payments/create"
          className="btn-primary-sm"
          data-testid="payments-add"
        >
          Add payment
        </Link>
      }
    >
      <div className="mx-auto max-w-content space-y-4">
        {hasScopeFilter ? (
          <p className="text-sm text-[#6B7280]">
            Filtered to {scopeDescription}.{" "}
            <Link
              href={pathname}
              className="font-medium text-brand-blue hover:underline"
            >
              Clear scope
            </Link>
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <label className="block min-w-[200px] max-w-md flex-1 text-sm">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Search reference, payer, tenant…"
              className="h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-[#6B7280]">Method</span>
            <select
              className="mt-1 h-10 min-w-[160px] rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHOD_OPTIONS.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-[#6B7280] sm:ml-auto">
            {loading ? "Loading…" : `${total} payment${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}

        {!loadError && !loading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center text-sm text-[#6B7280]">
            No payments match your filters.
          </div>
        ) : null}

        {!loadError && rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Date</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Tenant</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Amount</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Method</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Reference</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFBFC]">
                    <td className="whitespace-nowrap px-4 py-3 text-[#6B7280]">
                      {formatWhen(p.payment_date)}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">
                      {p.tenant_name?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{p.amount}</td>
                    <td className="px-4 py-3 capitalize text-[#6B7280]">{p.method}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-[#6B7280]">
                      {p.reference?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/payments/${p.id}`}
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

export function PaymentsPageClient() {
  return (
    <Suspense
      fallback={
        <DashboardListView title="Payments" description="Loading…">
          <div className="text-sm text-[#6B7280]">Loading…</div>
        </DashboardListView>
      }
    >
      <PaymentsPageContent />
    </Suspense>
  );
}
