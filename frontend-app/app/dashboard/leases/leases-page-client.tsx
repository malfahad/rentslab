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
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { EmptyBuildingsSvg } from "@/components/portfolio/empty-illustrations";
import { PortfolioInfiniteSentinel } from "@/components/portfolio/portfolio-infinite-sentinel";
import { PortfolioColumnPicker } from "@/components/portfolio/portfolio-column-picker";
import { PortfolioDataTable } from "@/components/portfolio/portfolio-data-table";
import {
  IconClearFilters,
  IconFilter,
  IconSearch,
  PortfolioToolbarIconButton,
} from "@/components/portfolio/portfolio-table-toolbar-icons";
import { cycleOrdering } from "@/components/portfolio/portfolio-table-sort";
import {
  PortfolioViewToggle,
  usePortfolioViewMode,
} from "@/components/portfolio/portfolio-view-toggle";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioEmptyState } from "@/components/portfolio/portfolio-empty-state";
import {
  LEASE_COLUMN_STORAGE_KEY,
  defaultLeaseVisibleColumns,
  leaseTableColumns,
} from "@/components/leases/lease-table-config";
import { DashboardListView } from "@/components/dashboard/main-view";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedColumnVisibility } from "@/hooks/use-persisted-column-visibility";
import { useResetPageOnFilters } from "@/hooks/use-reset-page-on-filters";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { urlSearchParamsEqual } from "@/lib/url-search-params";
import { deleteLease, listLeases } from "@/services/lease-service";
import type { PaginatedResponse } from "@/types/api";
import type { LeaseDto } from "@/types/operations";

const TABLE_PAGE_SIZE = 50;
const GRID_PAGE_SIZE = 24;
const VIEW_KEY = "portfolio-view-leases";
const DEBOUNCE_MS = 350;

const LEASE_STATUSES = [
  { value: "", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "terminated", label: "Terminated" },
  { value: "expired", label: "Expired" },
];

const searchInputClass =
  "h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

const filterInputClass =
  "mt-1 h-9 w-full min-w-[100px] rounded-lg border border-[#D1D5DB] px-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

function formatRent(row: LeaseDto): string {
  const amt = row.rent_amount;
  const c = row.rent_currency?.trim();
  return c ? `${amt} ${c}` : amt;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  const cls =
    s === "active"
      ? "text-[#2E7D32]"
      : s === "terminated"
        ? "text-red-700"
        : "text-[#6B7280]";
  return <span className={`text-sm font-medium ${cls}`}>{status}</span>;
}

function LeasesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQueryKey = searchParams.toString();
  const { orgReady, orgId } = useOrg();
  const [viewMode, setViewMode] = usePortfolioViewMode(VIEW_KEY);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [unitFilter, setUnitFilter] = useState(
    () => searchParams.get("unit") ?? "",
  );
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS, urlQueryKey);

  const [ordering, setOrdering] = useState(
    () => searchParams.get("ordering") ?? "",
  );
  const [searchOpen, setSearchOpen] = useState(
    () => !!(searchParams.get("search") ?? "").trim(),
  );
  const [filtersOpen, setFiltersOpen] = useState(() => {
    return !!(
      (searchParams.get("status") ?? "").trim() ||
      (searchParams.get("unit") ?? "").trim()
    );
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setUnitFilter(searchParams.get("unit") ?? "");
    setOrdering(searchParams.get("ordering") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams();
    const s = debouncedSearch.trim();
    if (s) next.set("search", s);
    if (status) next.set("status", status);
    const u = unitFilter.trim();
    if (u !== "" && Number.isFinite(Number(u))) next.set("unit", u);
    if (ordering) next.set("ordering", ordering);
    if (urlSearchParamsEqual(next, searchParams)) return;
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    debouncedSearch,
    status,
    unitFilter,
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
    const u = unitFilter.trim();
    return {
      search: debouncedSearch.trim() || undefined,
      ordering: ordering || undefined,
      status: status || undefined,
      unit:
        u !== "" && Number.isFinite(Number(u)) ? Number(u) : undefined,
    };
  }, [debouncedSearch, ordering, status, unitFilter]);

  const hasActiveFilters = useMemo(
    () =>
      search.trim().length > 0 ||
      status !== "" ||
      unitFilter.trim().length > 0 ||
      ordering !== "",
    [search, status, unitFilter, ordering],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    setUnitFilter("");
    setOrdering("");
    setSearchOpen(false);
    setFiltersOpen(false);
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const filterSignature = useMemo(
    () => JSON.stringify(listParams),
    [listParams],
  );

  const listParamsRef = useRef(listParams);
  listParamsRef.current = listParams;

  const [tablePage, setTablePage] = useState(1);
  useResetPageOnFilters(tablePage, setTablePage, filterSignature);

  const [tableData, setTableData] =
    useState<PaginatedResponse<LeaseDto> | null>(null);
  const [tableLoading, setTableLoading] = useState(true);

  const [visibleCols, setVisibleCols] = usePersistedColumnVisibility(
    LEASE_COLUMN_STORAGE_KEY,
    defaultLeaseVisibleColumns(),
  );

  const columns = useMemo(() => leaseTableColumns(), []);

  const [gridItems, setGridItems] = useState<LeaseDto[]>([]);
  const [gridInitialLoading, setGridInitialLoading] = useState(true);
  const [gridLoadingMore, setGridLoadingMore] = useState(false);
  const [gridHasMore, setGridHasMore] = useState(true);
  const gridNextPageRef = useRef(2);
  const gridLoadingLockRef = useRef(false);

  const [deleteTarget, setDeleteTarget] = useState<LeaseDto | null>(null);
  const [pending, setPending] = useState(false);

  const bumpList = useCallback(() => {
    setListVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!orgReady) return;
    if (orgId == null) {
      setTableLoading(false);
      return;
    }
    if (viewMode !== "table") return;
    let cancelled = false;
    setTableLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const r = await listLeases({
          page: tablePage,
          pageSize: TABLE_PAGE_SIZE,
          ...listParams,
        });
        if (!cancelled) setTableData(r);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof ApiError
              ? e.messageForUser
              : "Could not load lease arrangements.",
          );
          setTableData(null);
        }
      } finally {
        if (!cancelled) setTableLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgReady, orgId, viewMode, tablePage, listVersion, listParams]);

  useEffect(() => {
    if (!orgReady) return;
    if (orgId == null) {
      setGridInitialLoading(false);
      return;
    }
    if (viewMode !== "grid") return;
    let cancelled = false;
    gridNextPageRef.current = 2;
    setGridInitialLoading(true);
    setGridItems([]);
    setGridHasMore(true);
    setLoadError(null);
    (async () => {
      try {
        const r = await listLeases({
          page: 1,
          pageSize: GRID_PAGE_SIZE,
          ...listParamsRef.current,
        });
        if (cancelled) return;
        setGridItems(r.results);
        setGridHasMore(r.next != null);
        gridNextPageRef.current = 2;
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof ApiError
              ? e.messageForUser
              : "Could not load lease arrangements.",
          );
        }
      } finally {
        if (!cancelled) setGridInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgReady, orgId, viewMode, listVersion, filterSignature]);

  const loadMoreGrid = useCallback(async () => {
    if (!gridHasMore || gridLoadingLockRef.current || orgId == null) return;
    gridLoadingLockRef.current = true;
    setGridLoadingMore(true);
    try {
      const r = await listLeases({
        page: gridNextPageRef.current,
        pageSize: GRID_PAGE_SIZE,
        ...listParamsRef.current,
      });
      setGridItems((prev) => [...prev, ...r.results]);
      setGridHasMore(r.next != null);
      gridNextPageRef.current += 1;
    } catch {
      /* ignore */
    } finally {
      gridLoadingLockRef.current = false;
      setGridLoadingMore(false);
    }
  }, [gridHasMore, orgId]);

  const loadMoreRef = useRef(loadMoreGrid);
  loadMoreRef.current = loadMoreGrid;
  const stableLoadMore = useCallback(() => {
    void loadMoreRef.current();
  }, []);

  const onSort = useCallback((field: string) => {
    setOrdering((prev) => cycleOrdering(field, prev));
  }, []);

  function onColumnVisibilityChange(next: Set<string>) {
    if (next.size === 0) return;
    setVisibleCols(next);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await deleteLease(deleteTarget.id);
      setDeleteTarget(null);
      bumpList();
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  const tableRows = tableData?.results ?? [];
  const tableTotalPages = tableData
    ? Math.max(1, Math.ceil(tableData.count / TABLE_PAGE_SIZE))
    : 1;

  const columnPickerLabels = columns.map((c) => ({
    id: c.id,
    label: c.label,
  }));

  if (!orgReady) {
    return (
      <DashboardListView
        title="Lease arrangements"
        description="Loading…"
      >
        <div className="text-sm text-[#6B7280]">Preparing workspace…</div>
      </DashboardListView>
    );
  }

  return (
    <>
      <DashboardListView
        title="Lease arrangements"
        description="Tenancy for each unit — rent terms, status, and billing scope."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PortfolioViewToggle
              mode={viewMode}
              onChange={setViewMode}
              testId="leases-view-toggle"
            />
            <Link
              href="/dashboard/tenants/onboarding"
              className="btn-primary-sm"
              data-testid="leases-add"
            >
              Add lease
            </Link>
          </div>
        }
      >
        {orgId == null ? <OrgMissingBanner /> : null}
        {loadError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {loadError}
          </div>
        ) : null}

        {orgId != null ? (
          <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-end gap-0.5">
              <PortfolioToolbarIconButton
                label={searchOpen ? "Hide search" : "Search"}
                active={
                  searchOpen || debouncedSearch.trim().length > 0
                }
                onClick={() => setSearchOpen((o) => !o)}
                testId="leases-search-toggle"
              >
                <IconSearch />
              </PortfolioToolbarIconButton>
              <PortfolioToolbarIconButton
                label={filtersOpen ? "Hide filters" : "Filters"}
                active={
                  filtersOpen ||
                  status !== "" ||
                  unitFilter.trim().length > 0
                }
                onClick={() => setFiltersOpen((o) => !o)}
                testId="leases-filters-toggle"
              >
                <IconFilter />
              </PortfolioToolbarIconButton>
              {hasActiveFilters ? (
                <PortfolioToolbarIconButton
                  label="Clear filters"
                  onClick={clearFilters}
                  testId="leases-clear-filters"
                >
                  <IconClearFilters />
                </PortfolioToolbarIconButton>
              ) : null}
              {viewMode === "table" ? (
                <PortfolioColumnPicker
                  labels={columnPickerLabels}
                  visibleIds={visibleCols}
                  onChange={onColumnVisibilityChange}
                  testId="leases-column-picker"
                />
              ) : null}
            </div>
            {searchOpen ? (
              <div className="mt-3">
                <input
                  ref={searchInputRef}
                  type="search"
                  className={searchInputClass}
                  placeholder="Search status, building, unit number, reference…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="leases-search"
                />
              </div>
            ) : null}
            {filtersOpen ? (
              <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-[#E5E7EB] pt-3">
                <label className="min-w-[160px]">
                  <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Status
                  </span>
                  <select
                    className={`${filterInputClass} bg-white`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {LEASE_STATUSES.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-28">
                  <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Unit ID
                  </span>
                  <input
                    className={filterInputClass}
                    inputMode="numeric"
                    placeholder="Filter"
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        {orgId != null &&
        !tableLoading &&
        viewMode === "table" &&
        tableData &&
        tableData.count === 0 &&
        !loadError ? (
          <PortfolioEmptyState
            illustration={<EmptyBuildingsSvg className="w-full" />}
            title="No lease arrangements yet"
            description="Create a tenant and lease in the guided flow, or add one when you register a new tenancy."
            primaryAction={
              <Link
                href="/dashboard/tenants/onboarding"
                className="btn-primary"
              >
                Start onboarding
              </Link>
            }
            secondaryAction={
              <Link href="/dashboard/units" className="btn-secondary">
                View units
              </Link>
            }
          />
        ) : null}
        {orgId != null &&
        !gridInitialLoading &&
        viewMode === "grid" &&
        gridItems.length === 0 &&
        !loadError ? (
          <PortfolioEmptyState
            illustration={<EmptyBuildingsSvg className="w-full" />}
            title="No lease arrangements yet"
            description="Create a tenant and lease in the guided flow, or add one when you register a new tenancy."
            primaryAction={
              <Link
                href="/dashboard/tenants/onboarding"
                className="btn-primary"
              >
                Start onboarding
              </Link>
            }
            secondaryAction={
              <Link href="/dashboard/units" className="btn-secondary">
                View units
              </Link>
            }
          />
        ) : null}

        {orgId != null &&
        viewMode === "table" &&
        (tableLoading || tableRows.length > 0) ? (
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <PortfolioDataTable<LeaseDto>
                columns={columns}
                visibleColumnIds={visibleCols}
                rows={tableRows}
                loading={tableLoading}
                ordering={ordering}
                onSort={onSort}
                onRowClick={(row) =>
                  router.push(`/dashboard/leases/${row.id}`)
                }
                renderActions={(row) => (
                  <>
                    <Link
                      href={`/dashboard/leases/${row.id}`}
                      className="text-sm font-medium text-brand-blue hover:text-brand-navy"
                    >
                      View
                    </Link>
                    <span className="text-[#D1D5DB]"> · </span>
                    <Link
                      href={`/dashboard/leases/${row.id}/edit`}
                      className="text-sm font-medium text-brand-blue hover:text-brand-navy"
                    >
                      Edit
                    </Link>
                    <span className="text-[#D1D5DB]"> · </span>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-700 hover:underline"
                      onClick={() => setDeleteTarget(row)}
                    >
                      Delete
                    </button>
                  </>
                )}
              />
            </div>
            {tableData && tableData.count > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#6B7280]">
                <span>
                  Page {tablePage} of {tableTotalPages} ({tableData.count}{" "}
                  total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    disabled={tablePage <= 1 || tableLoading}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    disabled={tablePage >= tableTotalPages || tableLoading}
                    onClick={() =>
                      setTablePage((p) =>
                        Math.min(tableTotalPages, p + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {orgId != null &&
        viewMode === "grid" &&
        (gridInitialLoading || gridItems.length > 0) ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridInitialLoading ? (
                <div className="col-span-full py-12 text-center text-[#6B7280]">
                  Loading…
                </div>
              ) : (
                gridItems.map((row) => (
                  <div
                    key={row.id}
                    className="relative cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-brand-navy/20 hover:shadow-md"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      router.push(`/dashboard/leases/${row.id}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/dashboard/leases/${row.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1A1A]">
                          {row.tenant_name?.trim() || `Tenant #${row.tenant}`}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {row.unit_label?.trim() || `Unit #${row.unit}`}
                        </p>
                        {row.building_name ? (
                          <p className="mt-1 text-xs text-[#6B7280]">
                            {row.building_name}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-[#1A1A1A]">
                          {formatRent(row)}{" "}
                          <span className="text-[#6B7280]">
                            · {row.billing_cycle}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {row.start_date}
                          {row.end_date ? ` → ${row.end_date}` : " · Open-ended"}
                        </p>
                        <div className="mt-2">{statusBadge(row.status)}</div>
                      </div>
                      <div
                        className="flex shrink-0 flex-col items-end gap-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/dashboard/leases/${row.id}/edit`}
                          className="font-medium text-brand-blue hover:text-brand-navy"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="font-medium text-red-700 hover:underline"
                          onClick={() => setDeleteTarget(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!gridInitialLoading && gridItems.length > 0 ? (
                <PortfolioInfiniteSentinel
                  onLoadMore={stableLoadMore}
                  disabled={!gridHasMore || gridLoadingMore}
                />
              ) : null}
            </div>
            {gridLoadingMore ? (
              <p className="mt-2 text-center text-sm text-[#6B7280]">
                Loading more…
              </p>
            ) : null}
          </div>
        ) : null}
      </DashboardListView>

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        title="Delete lease arrangement?"
        message={`Remove the lease for “${deleteTarget?.tenant_name?.trim() || `tenant #${deleteTarget?.tenant}`}”? Invoices and payments linked to this lease may block deletion.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}

export default function LeasesPageClient() {
  return (
    <Suspense
      fallback={
        <DashboardListView
          title="Lease arrangements"
          description="Loading…"
        >
          <div className="text-sm text-[#6B7280]">Loading…</div>
        </DashboardListView>
      }
    >
      <LeasesPageContent />
    </Suspense>
  );
}
