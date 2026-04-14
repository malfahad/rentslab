"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOrg } from "@/contexts/org-context";
import {
  JOB_ORDER_STATUS_LABELS,
  JOB_ORDER_STATUSES,
  jobOrderStatusLabel,
} from "@/lib/constants/job-order-status";
import { ApiError } from "@/lib/api/errors";
import { listAllBuildings } from "@/services/building-service";
import { listAllJobOrders } from "@/services/job-order-service";
import type { BuildingDto } from "@/types/portfolio";
import type { JobOrderDto } from "@/types/operations";

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function JobOrdersPageClient() {
  const { orgReady, orgId } = useOrg();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<JobOrderDto[]>([]);
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [jo, b] = await Promise.all([
        listAllJobOrders(),
        listAllBuildings(),
      ]);
      setRows(jo);
      setBuildings(b);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load job orders.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  const buildingName = useMemo(() => {
    const m = new Map<number, string>();
    for (const b of buildings) m.set(b.id, b.name);
    return m;
  }, [buildings]);

  const filtered = useMemo(() => {
    let list = rows;
    if (status) {
      list = list.filter((j) => j.status === status);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.job_number ?? "").toLowerCase().includes(q) ||
          (j.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, status, debouncedSearch]);

  if (!orgReady) {
    return (
      <DashboardListView title="Job orders" description="Loading…">
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

  return (
    <DashboardListView
      title="Job orders"
      description="Maintenance and contractor work linked to buildings and units."
      actions={
        <Link
          href="/dashboard/job-orders/create"
          className="btn-primary-sm"
          data-testid="job-orders-add"
        >
          New job order
        </Link>
      }
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className="font-medium text-[#374151]">Search</span>
            <input
              type="search"
              className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
              placeholder="Number, title…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block w-44 text-sm">
            <span className="font-medium text-[#374151]">Status</span>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any</option>
              {JOB_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {JOB_ORDER_STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading job orders…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <table className="min-w-full divide-y divide-[#E5E7EB] text-sm">
              <thead className="bg-[#F9FAFB] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Building</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-[#6B7280]"
                    >
                      No job orders match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((j) => (
                    <tr key={j.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/job-orders/${j.id}`}
                          className="font-medium text-brand-blue hover:text-brand-navy"
                        >
                          {j.job_number?.trim() || `#${j.id}`}
                        </Link>
                        <div className="mt-0.5 text-[#6B7280]">{j.title}</div>
                      </td>
                      <td className="px-4 py-3 text-[#374151]">
                        {buildingName.get(j.building) ?? `Building #${j.building}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium capitalize text-[#374151]">
                          {jobOrderStatusLabel(j.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#6B7280]">
                        {formatTs(j.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardListView>
  );
}
