"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listBuildings } from "@/services/building-service";
import { listExpenses } from "@/services/expense-service";
import { listInvoices } from "@/services/invoice-service";
import { listAllJobOrders } from "@/services/job-order-service";
import { listLandlords } from "@/services/landlord-service";
import { listAllLeases } from "@/services/lease-service";
import { getOrg } from "@/services/org-service";
import { fetchReport } from "@/services/report-service";
import { listUnits } from "@/services/unit-service";
import type { InvoiceDto } from "@/types/billing";
import type { ExpenseDto } from "@/types/expense";
import type { JobOrderDto, LeaseDto } from "@/types/operations";

type KpiCard = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

type CollectionBar = {
  label: string;
  collected: number;
  outstanding: number;
};
type CollectionRange = "week" | "month" | "quarter" | "year";

type BuildingOccupancyRow = {
  building: string;
  occupiedPct: number;
};

type AttentionRow = {
  title: string;
  detail: string;
  level: "urgent" | "warning" | "healthy";
  href: string;
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
  href: string;
};

type RentRollReportDto = {
  total_scheduled_rent?: string;
};

type TooltipState = {
  x: number;
  y: number;
  title: string;
  collected: number;
  outstanding: number;
};

function kpiTrendColor(trend: KpiCard["trend"]): string {
  if (trend === "up") return "text-emerald-700";
  if (trend === "down") return "text-sky-700";
  return "text-amber-700";
}

function levelStyles(level: AttentionRow["level"]): string {
  if (level === "urgent") return "border-red-200 bg-red-50 text-red-800";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function toAmount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

function relativeTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

async function listAllInvoices(): Promise<InvoiceDto[]> {
  const acc: InvoiceDto[] = [];
  let page = 1;
  while (true) {
    const r = await listInvoices({ page, pageSize: 100, ordering: "-issue_date" });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

async function listAllExpenses(): Promise<ExpenseDto[]> {
  const acc: ExpenseDto[] = [];
  let page = 1;
  while (true) {
    const r = await listExpenses({ page, pageSize: 100, ordering: "-expense_date" });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

function makeCollectionSeries(
  invoices: InvoiceDto[],
  range: CollectionRange,
): CollectionBar[] {
  const now = new Date();
  const seed: CollectionBar[] = [];
  const keys: string[] = [];
  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  if (range === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      keys.push(dayKey(d));
      seed.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        collected: 0,
        outstanding: 0,
      });
    }
  } else if (range === "month") {
    for (let i = 3; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i * 7 + 6,
      );
      keys.push(`${dayKey(start)}::${dayKey(end)}`);
      seed.push({
        label: `W${4 - i}`,
        collected: 0,
        outstanding: 0,
      });
    }
  } else if (range === "quarter") {
    for (let i = 2; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
      seed.push({
        label: d.toLocaleDateString(undefined, { month: "short" }),
        collected: 0,
        outstanding: 0,
      });
    }
  } else {
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
      seed.push({
        label: d.toLocaleDateString(undefined, { month: "short" }),
        collected: 0,
        outstanding: 0,
      });
    }
  }

  for (const inv of invoices) {
    const d = new Date(inv.issue_date);
    if (Number.isNaN(d.getTime())) continue;
    const amt = toAmount(inv.total_amount);
    let idx = -1;

    if (range === "week") {
      idx = keys.indexOf(dayKey(d));
    } else if (range === "month") {
      idx = keys.findIndex((k) => {
        const [s, e] = k.split("::");
        return dayKey(d) >= s && dayKey(d) <= e;
      });
    } else {
      idx = keys.indexOf(monthKey(d));
    }
    if (idx < 0) continue;
    if (inv.status === "paid") seed[idx].collected += amt;
    else if (inv.status === "unpaid" || inv.status === "partial") {
      seed[idx].outstanding += amt;
    }
  }

  return seed;
}

export default function DashboardHomePage() {
  const { orgReady, orgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOrderDto[]>([]);
  const [buildingCount, setBuildingCount] = useState(0);
  const [landlordCount, setLandlordCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [collectionRange, setCollectionRange] = useState<CollectionRange>("quarter");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [orgCurrency, setOrgCurrency] = useState("USD");
  const [orgLocale, setOrgLocale] = useState<string | undefined>(undefined);
  const [convertedRentRoll, setConvertedRentRoll] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [inv, ls, ex, jo] = await Promise.all([
        listAllInvoices(),
        listAllLeases(),
        listAllExpenses(),
        listAllJobOrders(),
      ]);
      const [buildingsPage, landlordsPage, unitsPage] = await Promise.all([
        listBuildings({ page: 1, pageSize: 1 }),
        listLandlords({ page: 1, pageSize: 1 }),
        listUnits({ page: 1, pageSize: 1 }),
      ]);
      const org = await getOrg(orgId);
      setInvoices(inv);
      setLeases(ls);
      setExpenses(ex);
      setJobOrders(jo);
      setBuildingCount(buildingsPage.count ?? 0);
      setLandlordCount(landlordsPage.count ?? 0);
      setUnitCount(unitsPage.count ?? 0);
      setOrgCurrency(org.default_currency || "USD");
      setOrgLocale(org.locale || undefined);
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const asOf = `${y}-${m}-${d}`;
      const rentRollPayload = await fetchReport("rent-roll", {
        asOf,
        periodEnd: asOf,
      });
      const converted = toAmount(
        (rentRollPayload as RentRollReportDto)?.total_scheduled_rent ?? 0,
      );
      setConvertedRentRoll(converted);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load dashboard data.",
      );
      setInvoices([]);
      setLeases([]);
      setExpenses([]);
      setJobOrders([]);
      setBuildingCount(0);
      setLandlordCount(0);
      setUnitCount(0);
      setOrgCurrency("USD");
      setOrgLocale(undefined);
      setConvertedRentRoll(null);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  const activeLeases = useMemo(
    () => leases.filter((x) => x.status === "active"),
    [leases],
  );

  const occupancyRate = useMemo(() => {
    if (leases.length === 0) return 0;
    return Math.round((activeLeases.length / leases.length) * 1000) / 10;
  }, [leases, activeLeases]);

  const rentRoll = useMemo(() => {
    if (convertedRentRoll != null) return convertedRentRoll;
    return activeLeases.reduce((sum, x) => sum + toAmount(x.rent_amount), 0);
  }, [convertedRentRoll, activeLeases]);

  const outstandingBalance = useMemo(
    () =>
      invoices
        .filter((x) => x.status === "unpaid" || x.status === "partial")
        .reduce((sum, x) => sum + toAmount(x.outstanding_amount), 0),
    [invoices],
  );

  const openJobOrders = useMemo(
    () => jobOrders.filter((x) => x.status !== "completed" && x.status !== "cancelled"),
    [jobOrders],
  );

  const urgentJobOrders = useMemo(
    () =>
      openJobOrders.filter((x) => {
        const p = (x.priority || "").toLowerCase();
        return p === "high" || p === "emergency" || p === "urgent";
      }),
    [openJobOrders],
  );

  const kpis: KpiCard[] = useMemo(
    () => [
      {
        label: "Occupancy rate",
        value: `${occupancyRate.toFixed(1)}%`,
        delta: `${activeLeases.length}/${leases.length || 0} active leases`,
        trend: occupancyRate >= 90 ? "up" : occupancyRate >= 80 ? "flat" : "down",
      },
      {
        label: "Monthly rent roll",
        value: money(rentRoll, orgCurrency, orgLocale),
        delta: `${activeLeases.length} active lease${activeLeases.length === 1 ? "" : "s"}`,
        trend: rentRoll > 0 ? "up" : "flat",
      },
      {
        label: "Outstanding balance",
        value: money(outstandingBalance, orgCurrency, orgLocale),
        delta: `${invoices.filter((x) => x.status !== "paid").length} unpaid/partial invoices`,
        trend: outstandingBalance > 0 ? "down" : "up",
      },
      {
        label: "Open job orders",
        value: String(openJobOrders.length),
        delta: `${urgentJobOrders.length} urgent`,
        trend: urgentJobOrders.length > 0 ? "flat" : "up",
      },
    ],
    [
      occupancyRate,
      activeLeases.length,
      leases.length,
      rentRoll,
      outstandingBalance,
      orgCurrency,
      orgLocale,
      invoices,
      openJobOrders.length,
      urgentJobOrders.length,
    ],
  );

  const collectionSeries: CollectionBar[] = useMemo(
    () => makeCollectionSeries(invoices, collectionRange),
    [invoices, collectionRange],
  );

  const occupancyByBuilding: BuildingOccupancyRow[] = useMemo(() => {
    const stats = new Map<string, { total: number; active: number }>();
    for (const lease of leases) {
      const name = lease.building_name?.trim() || "Unknown building";
      const cur = stats.get(name) ?? { total: 0, active: 0 };
      cur.total += 1;
      if (lease.status === "active") cur.active += 1;
      stats.set(name, cur);
    }
    return [...stats.entries()]
      .map(([building, s]) => ({
        building,
        occupiedPct: s.total > 0 ? Math.round((s.active / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.occupiedPct - a.occupiedPct)
      .slice(0, 8);
  }, [leases]);

  const needsAttention: AttentionRow[] = useMemo(() => {
    const rows: AttentionRow[] = [];
    const now = Date.now();

    const overdue = invoices.filter((inv) => {
      if (!(inv.status === "unpaid" || inv.status === "partial")) return false;
      const due = new Date(inv.due_date);
      if (Number.isNaN(due.getTime())) return false;
      return now - due.getTime() > 14 * 24 * 60 * 60 * 1000;
    });
    const overdueAmt = overdue.reduce((s, x) => s + toAmount(x.outstanding_amount), 0);
    rows.push({
      title: `${overdue.length} invoices overdue > 14 days`,
      detail: `Outstanding at risk: ${money(overdueAmt, orgCurrency, orgLocale)}`,
      level: overdue.length > 0 ? "urgent" : "healthy",
      href: "/dashboard/invoices?status=unpaid",
    });

    const expiring = activeLeases.filter((l) => {
      if (!l.end_date) return false;
      const end = new Date(l.end_date);
      if (Number.isNaN(end.getTime())) return false;
      const days = (end.getTime() - now) / (24 * 60 * 60 * 1000);
      return days >= 0 && days <= 45;
    });
    rows.push({
      title: `${expiring.length} active leases expiring in 45 days`,
      detail: "Review renewals and tenant outreach",
      level: expiring.length > 0 ? "warning" : "healthy",
      href: "/dashboard/leases",
    });

    rows.push({
      title: `${urgentJobOrders.length} urgent open job orders`,
      detail: `${openJobOrders.length} total open jobs in queue`,
      level: urgentJobOrders.length > 0 ? "urgent" : "healthy",
      href: "/dashboard/job-orders",
    });

    const draftExpenses = expenses.filter((x) => x.status === "draft");
    rows.push({
      title: `${draftExpenses.length} draft expenses pending approval`,
      detail: "Review and approve to keep costs current",
      level: draftExpenses.length > 0 ? "warning" : "healthy",
      href: "/dashboard/expenses?status=draft",
    });
    return rows;
  }, [
    invoices,
    activeLeases,
    urgentJobOrders.length,
    openJobOrders.length,
    expenses,
    orgCurrency,
    orgLocale,
  ]);

  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: Array<ActivityItem & { ts: string }> = [];
    for (const inv of invoices.slice(0, 30)) {
      items.push({
        title: `Invoice ${inv.invoice_number?.trim() || `#${inv.id}`}`,
        detail: `${inv.status} · ${money(toAmount(inv.total_amount), orgCurrency, orgLocale)}`,
        time: relativeTime(inv.updated_at),
        href: `/dashboard/invoices/${inv.id}`,
        ts: inv.updated_at,
      });
    }
    for (const l of leases.slice(0, 30)) {
      items.push({
        title: `Lease #${l.id} updated`,
        detail: `${l.building_name || "Building"} · ${l.status}`,
        time: relativeTime(l.updated_at),
        href: `/dashboard/leases/${l.id}`,
        ts: l.updated_at,
      });
    }
    for (const e of expenses.slice(0, 30)) {
      items.push({
        title: `Expense #${e.id} ${e.status}`,
        detail: `${money(toAmount(e.amount), orgCurrency, orgLocale)} · ${e.description || "Expense entry"}`,
        time: relativeTime(e.updated_at),
        href: `/dashboard/expenses/${e.id}`,
        ts: e.updated_at,
      });
    }
    for (const j of jobOrders.slice(0, 30)) {
      items.push({
        title: `Job ${j.job_number?.trim() || `#${j.id}`} ${j.status}`,
        detail: j.title,
        time: relativeTime(j.updated_at),
        href: `/dashboard/job-orders/${j.id}`,
        ts: j.updated_at,
      });
    }
    items.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
    return items.slice(0, 6).map(({ ts: _ts, ...rest }) => rest);
  }, [invoices, leases, expenses, jobOrders, orgCurrency, orgLocale]);

  const maxCollection = Math.max(
    1,
    ...collectionSeries.map((x) => Math.max(x.collected, x.outstanding)),
  );
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => r * maxCollection);
  const isFreshWorkspace =
    !loading &&
    !loadError &&
    buildingCount === 0 &&
    landlordCount === 0 &&
    unitCount === 0;

  if (!orgReady) {
    return (
      <DashboardListView
        title="Dashboard"
        description="Overview of occupancy, rent roll, and what needs attention."
      >
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
      title="Dashboard"
      description="Overview of occupancy, rent roll, and what needs attention."
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {loadError ? <p className="text-sm text-red-800">{loadError}</p> : null}
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading portfolio aggregates…</p>
        ) : null}
        {isFreshWorkspace ? (
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
              Welcome
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-navy">
              Start building your portfolio
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#4B5563]">
              Your workspace is brand new. Add your first landlord to unlock buildings,
              units, leases, and rent tracking.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/landlords/create"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-navy px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue"
              >
                Add landlord
              </Link>
              <span className="text-xs text-[#6B7280]">
                Next steps: add buildings, then add units.
              </span>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-navy">{kpi.value}</p>
              <p className={`mt-1 text-sm font-medium ${kpiTrendColor(kpi.trend)}`}>
                {kpi.delta}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-navy">
                Rent collection
              </h2>
              <div className="flex items-center gap-2">
                {(["week", "month", "quarter", "year"] as CollectionRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCollectionRange(r)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                      collectionRange === r
                        ? "bg-brand-navy text-white"
                        : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-2 flex items-center justify-end gap-4 text-xs text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                Collected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
                Outstanding
              </span>
            </div>
            <div ref={chartRef} className="relative">
              <div className="grid grid-cols-[52px_1fr] gap-3">
                <div className="relative h-56">
                  {yTicks
                    .slice()
                    .reverse()
                    .map((v, i) => (
                      <div
                        key={`${v}-${i}`}
                        className="absolute right-0 text-[10px] text-[#9CA3AF]"
                        style={{ top: `${i * 25}%`, transform: "translateY(-50%)" }}
                      >
                        {money(v, orgCurrency, orgLocale)}
                      </div>
                    ))}
                </div>
                <div className="relative h-56">
                  {yTicks.map((v) => {
                    const y = 100 - (v / maxCollection) * 100;
                    return (
                      <div
                        key={`line-${v}`}
                        className="absolute left-0 right-0 border-t border-dashed border-[#E5E7EB]"
                        style={{ top: `${y}%` }}
                      />
                    );
                  })}
                  <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pb-5">
                    {collectionSeries.map((point) => {
                      const collectedHeight = Math.max(
                        10,
                        Math.round((point.collected / maxCollection) * 100),
                      );
                      const outstandingHeight = Math.max(
                        8,
                        Math.round((point.outstanding / maxCollection) * 100),
                      );
                      return (
                        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center">
                          <div className="flex h-44 items-end gap-1">
                            <button
                              type="button"
                              className="w-3 rounded-sm bg-blue-600"
                              style={{ height: `${collectedHeight}%` }}
                              onMouseEnter={(e) => {
                                const box = chartRef.current?.getBoundingClientRect();
                                if (!box) return;
                                setTooltip({
                                  x: e.clientX - box.left,
                                  y: e.clientY - box.top,
                                  title: point.label,
                                  collected: point.collected,
                                  outstanding: point.outstanding,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              aria-label={`Collected ${point.label}`}
                            />
                            <button
                              type="button"
                              className="w-3 rounded-sm bg-red-400"
                              style={{ height: `${outstandingHeight}%` }}
                              onMouseEnter={(e) => {
                                const box = chartRef.current?.getBoundingClientRect();
                                if (!box) return;
                                setTooltip({
                                  x: e.clientX - box.left,
                                  y: e.clientY - box.top,
                                  title: point.label,
                                  collected: point.collected,
                                  outstanding: point.outstanding,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              aria-label={`Outstanding ${point.label}`}
                            />
                          </div>
                          <span className="mt-2 text-xs text-[#6B7280]">{point.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute bottom-5 left-0 right-0 border-t border-[#D1D5DB]" />
                </div>
              </div>
              {tooltip ? (
                <div
                  className="pointer-events-none absolute z-10 w-44 rounded-lg border border-[#E5E7EB] bg-white p-2 text-xs shadow-lg"
                  style={{
                    left: Math.min(Math.max(tooltip.x + 8, 8), 520),
                    top: Math.max(tooltip.y - 56, 8),
                  }}
                >
                  <p className="font-semibold text-[#111827]">{tooltip.title}</p>
                  <p className="mt-1 text-blue-700">
                    Collected: {money(tooltip.collected, orgCurrency, orgLocale)}
                  </p>
                  <p className="text-red-600">
                    Outstanding: {money(tooltip.outstanding, orgCurrency, orgLocale)}
                  </p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-navy">
                Occupancy by building
              </h2>
              <span className="text-xs text-[#6B7280]">Underperformance spotlight</span>
            </div>
            <div className="space-y-3">
              {occupancyByBuilding.map((b) => (
                <div key={b.building}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-[#374151]">{b.building}</span>
                    <span className="font-semibold text-[#111827]">{b.occupiedPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5E7EB]">
                    <div
                      className={`h-2 rounded-full ${
                        b.occupiedPct < 80
                          ? "bg-red-500"
                          : b.occupiedPct < 90
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${b.occupiedPct}%` }}
                    />
                  </div>
                </div>
              ))}
              {occupancyByBuilding.length === 0 ? (
                <p className="text-xs text-[#6B7280]">No lease data yet.</p>
              ) : null}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-navy">Needs attention</h2>
              <Link
                href="/dashboard/reports"
                className="text-xs font-medium text-brand-blue hover:text-brand-navy"
              >
                View all ↗
              </Link>
            </div>
            <ul className="space-y-3">
              {needsAttention.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="block rounded-lg border border-[#E5E7EB] p-3 transition hover:bg-[#F9FAFB]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#111827]">{item.title}</p>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${levelStyles(item.level)}`}
                      >
                        {item.level}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B7280]">{item.detail}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-navy">Recent activity</h2>
              <Link
                href="/dashboard/reports"
                className="text-xs font-medium text-brand-blue hover:text-brand-navy"
              >
                View all ↗
              </Link>
            </div>
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={`${item.title}-${item.time}`}>
                  <Link
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[#E5E7EB] p-3 transition hover:bg-[#F9FAFB]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#6B7280]">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[#9CA3AF]">{item.time}</span>
                  </Link>
                </li>
              ))}
              {recentActivity.length === 0 ? (
                <li className="rounded-lg border border-[#E5E7EB] p-3 text-xs text-[#6B7280]">
                  No recent activity yet.
                </li>
              ) : null}
            </ul>
          </article>
        </section>
      </div>
    </DashboardListView>
  );
}
