"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  INVOICE_COLUMN_STORAGE_KEY,
  INVOICE_TABLE_COLUMNS,
  defaultInvoiceVisibleColumns,
} from "@/components/billing/invoice-table-config";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioColumnPicker } from "@/components/portfolio/portfolio-column-picker";
import { PortfolioDataTable } from "@/components/portfolio/portfolio-data-table";
import {
  IconClearFilters,
  IconFilter,
  IconSearch,
  PortfolioToolbarIconButton,
} from "@/components/portfolio/portfolio-table-toolbar-icons";
import { cycleOrdering } from "@/components/portfolio/portfolio-table-sort";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedColumnVisibility } from "@/hooks/use-persisted-column-visibility";
import { useResetPageOnFilters } from "@/hooks/use-reset-page-on-filters";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { urlSearchParamsEqual } from "@/lib/url-search-params";
import { issueInvoices, listInvoices } from "@/services/invoice-service";
import type { PaginatedResponse } from "@/types/api";
import type { InvoiceDto, IssueInvoicesResultDto } from "@/types/billing";

const TABLE_PAGE_SIZE = 24;
const DEBOUNCE_MS = 350;

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "void", label: "Void" },
];

const filterInputClass =
  "mt-1 h-9 w-full min-w-[100px] rounded-lg border border-[#D1D5DB] px-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

const searchInputClass =
  "h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

function parsePositiveInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function InvoicesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQueryKey = searchParams.toString();
  const { orgReady, orgId } = useOrg();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [leaseInput, setLeaseInput] = useState(
    () => searchParams.get("lease") ?? "",
  );
  const [tenantInput, setTenantInput] = useState(
    () => searchParams.get("tenant") ?? "",
  );
  const [unitInput, setUnitInput] = useState(
    () => searchParams.get("unit") ?? "",
  );
  const [buildingInput, setBuildingInput] = useState(
    () => searchParams.get("building") ?? "",
  );
  const [ordering, setOrdering] = useState(
    () => searchParams.get("ordering") ?? "",
  );

  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS, urlQueryKey);
  const debouncedLease = useDebouncedValue(leaseInput, DEBOUNCE_MS, urlQueryKey);
  const debouncedTenant = useDebouncedValue(
    tenantInput,
    DEBOUNCE_MS,
    urlQueryKey,
  );
  const debouncedUnit = useDebouncedValue(unitInput, DEBOUNCE_MS, urlQueryKey);
  const debouncedBuilding = useDebouncedValue(
    buildingInput,
    DEBOUNCE_MS,
    urlQueryKey,
  );

  const [searchOpen, setSearchOpen] = useState(
    () => !!(searchParams.get("search") ?? "").trim(),
  );
  const [filtersOpen, setFiltersOpen] = useState(() => {
    return !!(
      (searchParams.get("status") ?? "").trim() ||
      (searchParams.get("lease") ?? "").trim() ||
      (searchParams.get("tenant") ?? "").trim() ||
      (searchParams.get("unit") ?? "").trim() ||
      (searchParams.get("building") ?? "").trim()
    );
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setLeaseInput(searchParams.get("lease") ?? "");
    setTenantInput(searchParams.get("tenant") ?? "");
    setUnitInput(searchParams.get("unit") ?? "");
    setBuildingInput(searchParams.get("building") ?? "");
    setOrdering(searchParams.get("ordering") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    const s = debouncedSearch.trim();
    if (s) next.set("search", s);
    if (debouncedLease.trim()) next.set("lease", debouncedLease.trim());
    if (debouncedTenant.trim()) next.set("tenant", debouncedTenant.trim());
    if (debouncedUnit.trim()) next.set("unit", debouncedUnit.trim());
    if (debouncedBuilding.trim()) next.set("building", debouncedBuilding.trim());
    if (status) next.set("status", status);
    if (ordering) next.set("ordering", ordering);
    if (urlSearchParamsEqual(next, searchParams)) return;
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    debouncedSearch,
    debouncedLease,
    debouncedTenant,
    debouncedUnit,
    debouncedBuilding,
    status,
    ordering,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  const listParams = useMemo(() => {
    const leaseId = parsePositiveInt(debouncedLease);
    const tenantId = parsePositiveInt(debouncedTenant);
    const unitId = parsePositiveInt(debouncedUnit);
    const buildingId = parsePositiveInt(debouncedBuilding);
    return {
      search: debouncedSearch.trim() || undefined,
      status: status || undefined,
      ordering: ordering || undefined,
      lease: leaseId,
      lease__tenant: tenantId,
      lease__unit: unitId,
      lease__unit__building: buildingId,
    };
  }, [
    debouncedSearch,
    debouncedLease,
    debouncedTenant,
    debouncedUnit,
    debouncedBuilding,
    status,
    ordering,
  ]);

  const filterSignature = useMemo(
    () => JSON.stringify(listParams),
    [listParams],
  );

  useResetPageOnFilters(page, setPage, filterSignature);

  const listParamsRef = useRef(listParams);
  listParamsRef.current = listParams;

  const [data, setData] = useState<PaginatedResponse<InvoiceDto> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [visibleCols, setVisibleCols] = usePersistedColumnVisibility(
    INVOICE_COLUMN_STORAGE_KEY,
    defaultInvoiceVisibleColumns(),
  );

  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState<IssueInvoicesResultDto | null>(
    null,
  );
  const [issueError, setIssueError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const r = await listInvoices({
        page,
        pageSize: TABLE_PAGE_SIZE,
        ...listParamsRef.current,
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
  }, [orgId, page, filterSignature]);

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

  const hasActiveFilters = useMemo(
    () =>
      search.trim().length > 0 ||
      status !== "" ||
      leaseInput.trim().length > 0 ||
      tenantInput.trim().length > 0 ||
      unitInput.trim().length > 0 ||
      buildingInput.trim().length > 0 ||
      ordering !== "",
    [
      search,
      status,
      leaseInput,
      tenantInput,
      unitInput,
      buildingInput,
      ordering,
    ],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    setLeaseInput("");
    setTenantInput("");
    setUnitInput("");
    setBuildingInput("");
    setOrdering("");
    setSearchOpen(false);
    setFiltersOpen(false);
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const onSort = useCallback((field: string) => {
    setOrdering((prev) => cycleOrdering(field, prev));
  }, []);

  function onColumnVisibilityChange(next: Set<string>) {
    if (next.size === 0) return;
    setVisibleCols(next);
  }

  const rows = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));

  const columnPickerLabels = INVOICE_TABLE_COLUMNS.map((c) => ({
    id: c.id,
    label: c.label,
  }));

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

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
          <div className="flex items-center justify-end gap-0.5">
            <PortfolioToolbarIconButton
              label={searchOpen ? "Hide search" : "Search"}
              active={
                searchOpen || debouncedSearch.trim().length > 0
              }
              onClick={() => setSearchOpen((o) => !o)}
              testId="invoices-search-toggle"
            >
              <IconSearch />
            </PortfolioToolbarIconButton>
            <PortfolioToolbarIconButton
              label={filtersOpen ? "Hide filters" : "Filters"}
              active={
                filtersOpen ||
                status !== "" ||
                leaseInput.trim().length > 0 ||
                tenantInput.trim().length > 0 ||
                unitInput.trim().length > 0 ||
                buildingInput.trim().length > 0
              }
              onClick={() => setFiltersOpen((o) => !o)}
              testId="invoices-filters-toggle"
            >
              <IconFilter />
            </PortfolioToolbarIconButton>
            {hasActiveFilters ? (
              <PortfolioToolbarIconButton
                label="Clear filters"
                onClick={clearFilters}
                testId="invoices-clear-filters"
              >
                <IconClearFilters />
              </PortfolioToolbarIconButton>
            ) : null}
            <PortfolioColumnPicker
              labels={columnPickerLabels}
              visibleIds={visibleCols}
              onChange={onColumnVisibilityChange}
              testId="invoices-column-picker"
            />
          </div>
          {searchOpen ? (
            <div className="mt-3">
              <input
                ref={searchInputRef}
                type="search"
                className={searchInputClass}
                placeholder="Search number, tenant, unit, building…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="invoices-search"
              />
            </div>
          ) : null}
          {filtersOpen ? (
            <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-[#E5E7EB] pt-3">
              <label className="min-w-[140px] flex-1">
                <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Status
                </span>
                <select
                  className={filterInputClass}
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
              <label className="min-w-[100px] max-w-[160px]">
                <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Lease ID
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={filterInputClass}
                  placeholder="e.g. 42"
                  value={leaseInput}
                  onChange={(e) => setLeaseInput(e.target.value)}
                  data-testid="invoices-filter-lease"
                />
              </label>
              <label className="min-w-[100px] max-w-[160px]">
                <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Tenant ID
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={filterInputClass}
                  placeholder="e.g. 7"
                  value={tenantInput}
                  onChange={(e) => setTenantInput(e.target.value)}
                  data-testid="invoices-filter-tenant"
                />
              </label>
              <label className="min-w-[100px] max-w-[160px]">
                <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Unit ID
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={filterInputClass}
                  placeholder="e.g. 12"
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  data-testid="invoices-filter-unit"
                />
              </label>
              <label className="min-w-[100px] max-w-[160px]">
                <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                  Building ID
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={filterInputClass}
                  placeholder="e.g. 3"
                  value={buildingInput}
                  onChange={(e) => setBuildingInput(e.target.value)}
                  data-testid="invoices-filter-building"
                />
              </label>
            </div>
          ) : null}
        </div>

        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}

        {!loadError && !loading && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center text-sm text-[#6B7280]">
            No invoices match your filters.
          </div>
        ) : null}

        {!loadError && (loading || rows.length > 0) ? (
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <PortfolioDataTable<InvoiceDto>
                columns={INVOICE_TABLE_COLUMNS}
                visibleColumnIds={visibleCols}
                rows={rows}
                loading={loading}
                ordering={ordering}
                onSort={onSort}
                onRowClick={(row) =>
                  router.push(`/dashboard/invoices/${row.id}`)
                }
                renderActions={(row) => (
                  <Link
                    href={`/dashboard/invoices/${row.id}`}
                    className="font-medium text-brand-blue hover:text-brand-navy"
                  >
                    View
                  </Link>
                )}
              />
            </div>
            {total > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
                <span>
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    disabled={page >= totalPages || loading}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardListView>
  );
}

export function InvoicesPageClient() {
  return (
    <Suspense
      fallback={
        <DashboardListView title="Invoices" description="Loading…">
          <div className="text-sm text-[#6B7280]">Loading…</div>
        </DashboardListView>
      }
    >
      <InvoicesPageContent />
    </Suspense>
  );
}
