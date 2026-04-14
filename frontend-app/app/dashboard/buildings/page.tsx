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
import { BUILDING_TYPES } from "@/components/portfolio/building-form";
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
import {
  BUILDING_COLUMN_STORAGE_KEY,
  buildingTableColumns,
  defaultBuildingVisibleColumns,
} from "@/components/portfolio/building-table-config";
import { cycleOrdering } from "@/components/portfolio/portfolio-table-sort";
import {
  PortfolioViewToggle,
  usePortfolioViewMode,
} from "@/components/portfolio/portfolio-view-toggle";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioEmptyState } from "@/components/portfolio/portfolio-empty-state";
import { DashboardListView } from "@/components/dashboard/main-view";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedColumnVisibility } from "@/hooks/use-persisted-column-visibility";
import { useResetPageOnFilters } from "@/hooks/use-reset-page-on-filters";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { urlSearchParamsEqual } from "@/lib/url-search-params";
import { deleteBuilding, listBuildings } from "@/services/building-service";
import { listAllLandlords } from "@/services/landlord-service";
import type { PaginatedResponse } from "@/types/api";
import type { BuildingDto } from "@/types/portfolio";

const TABLE_PAGE_SIZE = 50;
const GRID_PAGE_SIZE = 24;
const VIEW_KEY = "portfolio-view-buildings";
const DEBOUNCE_MS = 350;

const filterInputClass =
  "mt-1 h-9 w-full min-w-[100px] rounded-lg border border-[#D1D5DB] px-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

const searchInputClass =
  "h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

function BuildingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQueryKey = searchParams.toString();
  const { orgReady, orgId } = useOrg();
  const [viewMode, setViewMode] = usePortfolioViewMode(VIEW_KEY);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [landlordMap, setLandlordMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [landlordCount, setLandlordCount] = useState(0);
  const [landlordMetaLoading, setLandlordMetaLoading] = useState(true);

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [buildingType, setBuildingType] = useState(
    () => searchParams.get("building_type") ?? "",
  );
  const [landlordId, setLandlordId] = useState(
    () => searchParams.get("landlord") ?? "",
  );
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS, urlQueryKey);
  const debouncedCity = useDebouncedValue(city, DEBOUNCE_MS, urlQueryKey);

  const [ordering, setOrdering] = useState(
    () => searchParams.get("ordering") ?? "",
  );
  const [searchOpen, setSearchOpen] = useState(
    () => !!(searchParams.get("search") ?? "").trim(),
  );
  const [filtersOpen, setFiltersOpen] = useState(() => {
    return !!(
      (searchParams.get("city") ?? "").trim() ||
      (searchParams.get("building_type") ?? "").trim() ||
      (searchParams.get("landlord") ?? "").trim()
    );
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setCity(searchParams.get("city") ?? "");
    setBuildingType(searchParams.get("building_type") ?? "");
    setLandlordId(searchParams.get("landlord") ?? "");
    setOrdering(searchParams.get("ordering") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const lid = landlordId.trim();
    const next = new URLSearchParams();
    const s = debouncedSearch.trim();
    if (s) next.set("search", s);
    if (debouncedCity.trim()) next.set("city", debouncedCity.trim());
    if (buildingType) next.set("building_type", buildingType);
    if (lid !== "" && Number.isFinite(Number(lid))) next.set("landlord", lid);
    if (ordering) next.set("ordering", ordering);
    if (urlSearchParamsEqual(next, searchParams)) return;
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    debouncedSearch,
    debouncedCity,
    buildingType,
    landlordId,
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
    const lid = landlordId.trim();
    return {
      search: debouncedSearch.trim() || undefined,
      city: debouncedCity.trim() || undefined,
      building_type: buildingType || undefined,
      landlord:
        lid !== "" && Number.isFinite(Number(lid)) ? Number(lid) : undefined,
      ordering: ordering || undefined,
    };
  }, [
    debouncedSearch,
    debouncedCity,
    buildingType,
    landlordId,
    ordering,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      search.trim().length > 0 ||
      city.trim().length > 0 ||
      buildingType !== "" ||
      landlordId.trim().length > 0 ||
      ordering !== "",
    [search, city, buildingType, landlordId, ordering],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setCity("");
    setBuildingType("");
    setLandlordId("");
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
    useState<PaginatedResponse<BuildingDto> | null>(null);
  const [tableLoading, setTableLoading] = useState(true);

  const [visibleCols, setVisibleCols] = usePersistedColumnVisibility(
    BUILDING_COLUMN_STORAGE_KEY,
    defaultBuildingVisibleColumns(),
  );

  const columns = useMemo(
    () =>
      buildingTableColumns((id) => landlordMap.get(id) ?? `Landlord #${id}`),
    [landlordMap],
  );

  const [gridItems, setGridItems] = useState<BuildingDto[]>([]);
  const [gridInitialLoading, setGridInitialLoading] = useState(true);
  const [gridLoadingMore, setGridLoadingMore] = useState(false);
  const [gridHasMore, setGridHasMore] = useState(true);
  const gridNextPageRef = useRef(2);
  const gridLoadingLockRef = useRef(false);

  const [deleteTarget, setDeleteTarget] = useState<BuildingDto | null>(null);
  const [pending, setPending] = useState(false);

  const bumpList = useCallback(() => {
    setListVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    let cancelled = false;
    setLandlordMetaLoading(true);
    (async () => {
      try {
        const all = await listAllLandlords();
        if (cancelled) return;
        const m = new Map<number, string>();
        for (const l of all) m.set(l.id, l.name);
        setLandlordMap(m);
        setLandlordCount(all.length);
      } catch {
        if (!cancelled) {
          setLandlordMap(new Map());
          setLandlordCount(0);
        }
      } finally {
        if (!cancelled) setLandlordMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgReady, orgId, listVersion]);

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
        const r = await listBuildings({
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
              : "Could not load buildings.",
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
        const r = await listBuildings({
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
              : "Could not load buildings.",
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
      const r = await listBuildings({
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
      await deleteBuilding(deleteTarget.id);
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
      <DashboardListView title="Buildings" description="Loading…">
        <div className="text-sm text-[#6B7280]">Preparing workspace…</div>
      </DashboardListView>
    );
  }

  const canAddBuilding = orgId != null && landlordCount > 0;

  return (
    <>
      <DashboardListView
        title="Buildings"
        description="Structures under each landlord. Units belong to buildings."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PortfolioViewToggle
              mode={viewMode}
              onChange={setViewMode}
              testId="buildings-view-toggle"
            />
            {canAddBuilding ? (
              <Link
                href="/dashboard/buildings/create"
                className="btn-primary-sm"
                data-testid="buildings-add"
              >
                Add building
              </Link>
            ) : (
              <span
                className="btn-primary-sm pointer-events-none cursor-not-allowed opacity-50"
                aria-disabled
                data-testid="buildings-add"
              >
                Add building
              </span>
            )}
          </div>
        }
      >
        {orgId == null ? <OrgMissingBanner /> : null}
        {loadError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {loadError}
          </div>
        ) : null}

        {orgId != null && !landlordMetaLoading ? (
          <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-end gap-0.5">
              <PortfolioToolbarIconButton
                label={searchOpen ? "Hide search" : "Search"}
                active={
                  searchOpen || debouncedSearch.trim().length > 0
                }
                onClick={() => setSearchOpen((o) => !o)}
                testId="buildings-search-toggle"
              >
                <IconSearch />
              </PortfolioToolbarIconButton>
              <PortfolioToolbarIconButton
                label={filtersOpen ? "Hide filters" : "Filters"}
                active={
                  filtersOpen ||
                  city.trim().length > 0 ||
                  buildingType !== "" ||
                  landlordId.trim().length > 0
                }
                onClick={() => setFiltersOpen((o) => !o)}
                testId="buildings-filters-toggle"
              >
                <IconFilter />
              </PortfolioToolbarIconButton>
              {hasActiveFilters ? (
                <PortfolioToolbarIconButton
                  label="Clear filters"
                  onClick={clearFilters}
                  testId="buildings-clear-filters"
                >
                  <IconClearFilters />
                </PortfolioToolbarIconButton>
              ) : null}
              {viewMode === "table" ? (
                <PortfolioColumnPicker
                  labels={columnPickerLabels}
                  visibleIds={visibleCols}
                  onChange={onColumnVisibilityChange}
                  testId="buildings-column-picker"
                />
              ) : null}
            </div>
            {searchOpen ? (
              <div className="mt-3">
                <input
                  ref={searchInputRef}
                  type="search"
                  className={searchInputClass}
                  placeholder="Search name, address, city…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="buildings-search"
                />
              </div>
            ) : null}
            {filtersOpen ? (
              <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-[#E5E7EB] pt-3">
                <label className="min-w-[120px] flex-1">
                  <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                    City
                  </span>
                  <input
                    className={filterInputClass}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </label>
                <label className="min-w-[140px]">
                  <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Type
                  </span>
                  <select
                    className={`${filterInputClass} bg-white`}
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                  >
                    <option value="">Any</option>
                    {BUILDING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-28">
                  <span className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Landlord ID
                  </span>
                  <input
                    className={filterInputClass}
                    inputMode="numeric"
                    placeholder="ID"
                    value={landlordId}
                    onChange={(e) => setLandlordId(e.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        {orgId != null && landlordMetaLoading ? (
          <div className="text-sm text-[#6B7280]">Loading…</div>
        ) : null}
        {orgId != null &&
        !landlordMetaLoading &&
        landlordCount === 0 &&
        !loadError ? (
          <PortfolioEmptyState
            illustration={<EmptyBuildingsSvg className="w-full" />}
            title="Add a landlord first"
            description="Buildings are linked to a landlord. Create a landlord, then you can add buildings and units."
            primaryAction={
              <Link href="/dashboard/landlords" className="btn-primary">
                Go to landlords
              </Link>
            }
          />
        ) : null}
        {orgId != null &&
        !landlordMetaLoading &&
        landlordCount > 0 &&
        !tableLoading &&
        viewMode === "table" &&
        tableData &&
        tableData.count === 0 &&
        !loadError ? (
          <PortfolioEmptyState
            illustration={<EmptyBuildingsSvg className="w-full" />}
            title="No buildings yet"
            description="Register each address or tower so you can attach units, leases, and maintenance."
            primaryAction={
              <Link href="/dashboard/buildings/create" className="btn-primary">
                Add your first building
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
        !landlordMetaLoading &&
        landlordCount > 0 &&
        !gridInitialLoading &&
        viewMode === "grid" &&
        gridItems.length === 0 &&
        !loadError ? (
          <PortfolioEmptyState
            illustration={<EmptyBuildingsSvg className="w-full" />}
            title="No buildings yet"
            description="Register each address or tower so you can attach units, leases, and maintenance."
            primaryAction={
              <Link href="/dashboard/buildings/create" className="btn-primary">
                Add your first building
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
        !landlordMetaLoading &&
        landlordCount > 0 &&
        viewMode === "table" &&
        (tableLoading || tableRows.length > 0) ? (
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <PortfolioDataTable<BuildingDto>
                columns={columns}
                visibleColumnIds={visibleCols}
                rows={tableRows}
                loading={tableLoading}
                ordering={ordering}
                onSort={onSort}
                onRowClick={(row) =>
                  router.push(`/dashboard/buildings/${row.id}`)
                }
                renderActions={(row) => (
                  <>
                    <Link
                      href={`/dashboard/buildings/${row.id}/edit`}
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
                    disabled={
                      tablePage >= tableTotalPages || tableLoading
                    }
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
        !landlordMetaLoading &&
        landlordCount > 0 &&
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
                      router.push(`/dashboard/buildings/${row.id}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/dashboard/buildings/${row.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1A1A]">{row.name}</p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {landlordMap.get(row.landlord) ??
                            `Landlord #${row.landlord}`}
                        </p>
                        {row.address_line1 ? (
                          <p className="mt-2 line-clamp-2 text-xs text-[#6B7280]">
                            {row.address_line1}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {row.city || "—"} · {row.building_type}
                        </p>
                      </div>
                      <div
                        className="flex shrink-0 flex-col items-end gap-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/dashboard/buildings/${row.id}/edit`}
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
        title="Delete building?"
        message={`Remove “${deleteTarget?.name}”? Units under this building may block deletion.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}

export default function BuildingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardListView title="Buildings" description="Loading…">
          <div className="text-sm text-[#6B7280]">Loading…</div>
        </DashboardListView>
      }
    >
      <BuildingsPageContent />
    </Suspense>
  );
}
