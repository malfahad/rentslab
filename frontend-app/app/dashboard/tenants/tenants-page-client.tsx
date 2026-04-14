"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listTenants } from "@/services/tenant-service";
import type { PaginatedResponse } from "@/types/api";
import type { TenantDto } from "@/types/operations";

type ViewMode = "table" | "grid";

function loadViewMode(): ViewMode {
  if (typeof window === "undefined") return "table";
  return window.localStorage.getItem("tenants:view") === "grid" ? "grid" : "table";
}

function TableIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={active ? "text-brand-navy" : "text-[#9CA3AF]"}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={active ? "text-brand-navy" : "text-[#9CA3AF]"}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

export function TenantsPageClient() {
  const { orgReady, orgId } = useOrg();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<PaginatedResponse<TenantDto> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setViewMode(loadViewMode());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("tenants:view", viewMode);
  }, [mounted, viewMode]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const r = await listTenants({
        page,
        pageSize: 24,
        search: debouncedSearch || undefined,
        ordering: "name",
      });
      setData(r);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load tenants.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, debouncedSearch]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  if (!orgReady) {
    return (
      <DashboardListView title="Tenants" description="People and companies you rent to.">
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
      title="Tenants"
      description="People and companies you rent to."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 ${viewMode === "table" ? "bg-[#F3F4F6]" : "hover:bg-[#F9FAFB]"}`}
              onClick={() => setViewMode("table")}
              title="Table"
            >
              <TableIcon active={viewMode === "table"} />
            </button>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 ${viewMode === "grid" ? "bg-[#F3F4F6]" : "hover:bg-[#F9FAFB]"}`}
              onClick={() => setViewMode("grid")}
              title="Grid"
            >
              <GridIcon active={viewMode === "grid"} />
            </button>
          </div>
          <Link
            href="/dashboard/tenants/onboarding"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-navy px-4 text-sm font-medium text-white hover:bg-[#152a45]"
          >
            New tenant onboarding
          </Link>
        </div>
      }
    >
      <div className="mx-auto max-w-content space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="block max-w-md flex-1 text-sm">
            <span className="sr-only">Search tenants</span>
            <input
              type="search"
              placeholder="Search name, email, phone, city…"
              className="h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <p className="text-sm text-[#6B7280]">
            {loading ? "Loading…" : `${total} tenant${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}

        {!loadError && !loading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
            <p className="text-sm text-[#6B7280]">No tenants match your filters.</p>
            <Link
              href="/dashboard/tenants/onboarding"
              className="mt-4 inline-block font-medium text-brand-blue hover:text-brand-navy"
            >
              Start onboarding →
            </Link>
          </div>
        ) : null}

        {!loadError && viewMode === "table" && rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Name</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Type</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Email</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Phone</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">City</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Leases</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{t.name}</td>
                    <td className="px-4 py-3 capitalize text-[#6B7280]">{t.tenant_type}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{t.email || "—"}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{t.phone || "—"}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{t.city || "—"}</td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {t.leases_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/tenants/${t.id}`}
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

        {!loadError && viewMode === "grid" && rows.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/tenants/${t.id}`}
                  className="block h-full rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-brand-navy/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-lg font-medium text-brand-navy line-clamp-2">
                      {t.name}
                    </h2>
                    <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs capitalize text-[#4B5563]">
                      {t.tenant_type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#6B7280] line-clamp-1">
                    {t.email || "No email"}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {t.city ? `${t.city}` : "No city"}
                    {t.country_code ? ` · ${t.country_code}` : ""}
                  </p>
                  <p className="mt-3 text-xs font-medium text-[#9CA3AF]">
                    {t.leases_count ?? 0} lease{(t.leases_count ?? 0) === 1 ? "" : "s"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
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
