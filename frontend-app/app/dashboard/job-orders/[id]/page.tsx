"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchCombobox } from "@/components/portfolio/search-combobox";
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import {
  allowedNextJobOrderStatuses,
  jobOrderStatusLabel,
} from "@/lib/constants/job-order-status";
import { ApiError } from "@/lib/api/errors";
import { listBuildings, listAllBuildings } from "@/services/building-service";
import { listAllInvoicesForLease } from "@/services/invoice-service";
import { listLandlords } from "@/services/landlord-service";
import {
  deleteJobOrder,
  getJobOrder,
  rechargeJobOrder,
  updateJobOrder,
} from "@/services/job-order-service";
import { listAllLeases } from "@/services/lease-service";
import { listUnits, listAllUnits } from "@/services/unit-service";
import { listAllVendors } from "@/services/vendor-service";
import type { InvoiceDto } from "@/types/billing";
import type { BuildingDto, UnitDto } from "@/types/portfolio";
import type { JobOrderDto, LeaseDto, VendorDto } from "@/types/operations";

type IdLabel = { id: string; label: string };

function leaseLabel(l: LeaseDto): string {
  const u = l.unit_label?.trim() || `Unit lease #${l.id}`;
  const t = l.tenant_name?.trim();
  return t ? `${u} · ${t}` : u;
}

function leasesMatchingJob(
  job: JobOrderDto,
  units: UnitDto[],
  leases: LeaseDto[],
): LeaseDto[] {
  return leases.filter((l) => {
    const u = units.find((x) => x.id === l.unit);
    if (!u) return false;
    if (job.unit != null) return l.unit === job.unit;
    return u.building === job.building;
  });
}

export default function JobOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();

  const [job, setJob] = useState<JobOrderDto | null>(null);
  const [buildingCount, setBuildingCount] = useState(0);
  const [landlordCount, setLandlordCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState(false);

  const [rechargeLeaseId, setRechargeLeaseId] = useState("");
  const [rechargeInvoiceId, setRechargeInvoiceId] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeDescription, setRechargeDescription] = useState("");
  const [invoicesForLease, setInvoicesForLease] = useState<InvoiceDto[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);
  const [rechargeOk, setRechargeOk] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid job order.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [buildingsPage, landlordsPage, unitsPage] = await Promise.all([
        listBuildings({ page: 1, pageSize: 1 }),
        listLandlords({ page: 1, pageSize: 1 }),
        listUnits({ page: 1, pageSize: 1 }),
      ]);
      setBuildingCount(buildingsPage.count ?? 0);
      setLandlordCount(landlordsPage.count ?? 0);
      setUnitCount(unitsPage.count ?? 0);
    } catch {
      setBuildingCount(0);
      setLandlordCount(0);
      setUnitCount(0);
    }
    try {
      const [j, b, u, v, ls] = await Promise.all([
        getJobOrder(id),
        listAllBuildings(),
        listAllUnits(),
        listAllVendors(),
        listAllLeases(),
      ]);
      setJob(j);
      setBuildings(b);
      setUnits(u);
      setVendors(v);
      setLeases(ls);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load job order.",
      );
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  const buildingName = useMemo(() => {
    if (!job) return "";
    const b = buildings.find((x) => x.id === job.building);
    return b?.name ?? `Building #${job.building}`;
  }, [job, buildings]);

  const unitLabel = useMemo(() => {
    if (!job?.unit) return "—";
    const u = units.find((x) => x.id === job.unit);
    return u
      ? `${u.unit_number}${u.building_name ? ` · ${u.building_name}` : ""}`
      : `Unit #${job.unit}`;
  }, [job, units]);

  const vendorName = useMemo(() => {
    if (!job?.vendor) return "—";
    const v = vendors.find((x) => x.id === job.vendor);
    return v?.name ?? `Vendor #${job.vendor}`;
  }, [job, vendors]);

  const applicableLeases = useMemo(() => {
    if (!job) return [];
    return leasesMatchingJob(job, units, leases).sort((a, b) =>
      leaseLabel(a).localeCompare(leaseLabel(b)),
    );
  }, [job, units, leases]);

  const leaseOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— Select lease —" },
      ...applicableLeases.map((l) => ({
        id: String(l.id),
        label: leaseLabel(l),
      })),
    ],
    [applicableLeases],
  );

  useEffect(() => {
    if (rechargeLeaseId === "") {
      setInvoicesForLease([]);
      setRechargeInvoiceId("");
      return;
    }
    const lid = Number.parseInt(rechargeLeaseId, 10);
    let cancelled = false;
    setInvoicesLoading(true);
    setRechargeInvoiceId("");
    void listAllInvoicesForLease(lid)
      .then((inv) => {
        if (!cancelled) setInvoicesForLease(inv);
      })
      .catch(() => {
        if (!cancelled) setInvoicesForLease([]);
      })
      .finally(() => {
        if (!cancelled) setInvoicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rechargeLeaseId]);

  const invoiceOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: invoicesLoading ? "Loading…" : "— Select invoice —" },
      ...invoicesForLease.map((inv) => ({
        id: String(inv.id),
        label:
          (inv.invoice_number?.trim() || `Invoice #${inv.id}`) +
          ` · ${inv.total_amount} (${inv.status})`,
      })),
    ],
    [invoicesForLease, invoicesLoading],
  );

  async function applyStatus(next: string) {
    if (!job) return;
    setStatusError(null);
    setStatusPending(true);
    try {
      const updated = await updateJobOrder(job.id, { status: next });
      setJob(updated);
    } catch (e) {
      setStatusError(
        e instanceof ApiError ? e.messageForUser : "Could not update status.",
      );
    } finally {
      setStatusPending(false);
    }
  }

  async function submitRecharge(e: React.FormEvent) {
    e.preventDefault();
    setRechargeError(null);
    setRechargeOk(null);
    if (!job) return;
    if (rechargeInvoiceId === "" || rechargeLeaseId === "") {
      setRechargeError("Select a lease and invoice.");
      return;
    }
    const amt = rechargeAmount.trim();
    if (!amt) {
      setRechargeError("Enter an amount.");
      return;
    }
    const desc = rechargeDescription.trim();
    if (!desc) {
      setRechargeError("Enter a line description.");
      return;
    }
    setRechargeSubmitting(true);
    try {
      const line = await rechargeJobOrder(job.id, {
        invoice: Number.parseInt(rechargeInvoiceId, 10),
        amount: amt,
        description: desc,
      });
      setRechargeOk(
        `Added line #${line.line_number} (${line.amount}). Invoice total was updated.`,
      );
      setRechargeAmount("");
      setRechargeDescription("");
      void load();
    } catch (err) {
      setRechargeError(
        err instanceof ApiError ? err.messageForUser : "Recharge failed.",
      );
    } finally {
      setRechargeSubmitting(false);
    }
  }

  async function onDelete() {
    if (!job) return;
    setDeleteError(null);
    setDeletePending(true);
    try {
      await deleteJobOrder(job.id);
      router.push("/dashboard/job-orders");
    } catch (e) {
      setDeleteError(
        e instanceof ApiError ? e.messageForUser : "Could not delete.",
      );
      setDeletePending(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/job-orders"
        backLabel="Back to job orders"
        title="Job order"
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

  const title =
    job != null
      ? `${job.job_number?.trim() || `#${job.id}`} · ${job.title}`
      : "Job order";

  const nextStatuses = job ? allowedNextJobOrderStatuses(job.status) : [];
  const isFreshWorkspace =
    !loading && buildingCount === 0 && landlordCount === 0 && unitCount === 0;

  return (
    <>
      <DashboardDetailView
        backHref="/dashboard/job-orders"
        backLabel="Back to job orders"
        title={loading ? "Job order" : title}
        subtitle={
          loading || !job ? undefined : jobOrderStatusLabel(job.status)
        }
        suggestedActions={
          job ? (
            <>
              <Link
                href={`/dashboard/job-orders/${job.id}/edit`}
                className="btn-secondary w-full"
              >
                Edit job order
              </Link>
              <Link
                href={`/dashboard/expenses/create?job_order=${job.id}`}
                className="btn-primary w-full"
              >
                Add expense
              </Link>
              <button
                type="button"
                className="btn-secondary w-full text-red-700 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Delete job order
              </button>
            </>
          ) : null
        }
      >
        {isFreshWorkspace ? (
          <section className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-4 shadow-sm">
            <details open>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                      Welcome
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-brand-navy">
                      Concierge onboarding flow
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-[#1D4ED8]">
                    Expand/Collapse
                  </span>
                </div>
              </summary>
              <div className="mt-3 space-y-3 text-sm text-[#1E3A8A]">
                <p>
                  Your workspace is brand new. Follow this guided setup to start
                  tracking maintenance work orders.
                </p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>
                    Add your first landlord{" "}
                    <Link href="/dashboard/landlords/create" className="underline">
                      here
                    </Link>
                    .
                  </li>
                  <li>
                    Add your first building{" "}
                    <Link href="/dashboard/buildings/create" className="underline">
                      here
                    </Link>
                    .
                  </li>
                  <li>
                    Add your first unit{" "}
                    <Link href="/dashboard/units/create" className="underline">
                      here
                    </Link>
                    .
                  </li>
                  <li>Create your first job order from the Job Orders page.</li>
                </ol>
              </div>
            </details>
          </section>
        ) : null}
        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}
        {job && !loadError ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Details
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">Building</dt>
                  <dd className="font-medium text-[#1A1A1A]">{buildingName}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Unit</dt>
                  <dd className="font-medium text-[#1A1A1A]">{unitLabel}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Vendor</dt>
                  <dd className="font-medium text-[#1A1A1A]">{vendorName}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Priority</dt>
                  <dd className="text-[#1A1A1A]">
                    {job.priority?.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Estimated cost</dt>
                  <dd className="text-[#1A1A1A]">
                    {job.estimated_cost ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Actual cost (from expenses)</dt>
                  <dd className="text-[#1A1A1A]">{job.actual_cost ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Description</dt>
                  <dd className="whitespace-pre-wrap text-[#1A1A1A]">
                    {job.description?.trim() || "—"}
                  </dd>
                </div>
                {job.external_reference?.trim() ? (
                  <div>
                    <dt className="text-[#6B7280]">External reference</dt>
                    <dd className="text-[#1A1A1A]">{job.external_reference}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Status
              </h2>
              {statusError ? (
                <p className="mt-2 text-sm text-red-800">{statusError}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {nextStatuses.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">
                    No further transitions from this status.
                  </p>
                ) : (
                  nextStatuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn-secondary-sm"
                      disabled={statusPending}
                      onClick={() => void applyStatus(s)}
                    >
                      Mark as {jobOrderStatusLabel(s)}
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Tenant recharge
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Add a line item to an invoice for a lease on this site. The
                invoice total is updated automatically.
              </p>
              {rechargeError ? (
                <p className="mt-2 text-sm text-red-800">{rechargeError}</p>
              ) : null}
              {rechargeOk ? (
                <p className="mt-2 text-sm text-green-800">{rechargeOk}</p>
              ) : null}
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => void submitRecharge(e)}
              >
                <SearchCombobox
                  label="Lease"
                  items={leaseOptions}
                  value={rechargeLeaseId}
                  onChange={setRechargeLeaseId}
                  getOptionId={(o) => o.id}
                  getOptionLabel={(o) => o.label}
                  placeholder={
                    applicableLeases.length === 0
                      ? "No leases on this site"
                      : "Search leases…"
                  }
                  disabled={applicableLeases.length === 0}
                  emptyMessage="No matching leases"
                />
                <SearchCombobox
                  label="Invoice"
                  items={invoiceOptions}
                  value={rechargeInvoiceId}
                  onChange={setRechargeInvoiceId}
                  getOptionId={(o) => o.id}
                  getOptionLabel={(o) => o.label}
                  placeholder={
                    rechargeLeaseId === ""
                      ? "Select a lease first"
                      : "Search invoices…"
                  }
                  disabled={rechargeLeaseId === "" || invoicesLoading}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-[#374151]">Amount</span>
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-[#374151]">
                      Line description
                    </span>
                    <input
                      required
                      type="text"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={rechargeDescription}
                      onChange={(e) => setRechargeDescription(e.target.value)}
                      placeholder="e.g. Tenant share of repair — WO reference"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn-primary-sm"
                  disabled={
                    rechargeSubmitting ||
                    applicableLeases.length === 0 ||
                    rechargeLeaseId === "" ||
                    rechargeInvoiceId === ""
                  }
                >
                  {rechargeSubmitting ? "Working…" : "Add to invoice"}
                </button>
              </form>
            </section>
          </div>
        ) : null}
      </DashboardDetailView>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete job order?"
        message={
          deleteError ??
          "This cannot be undone. Delete will fail if related records prevent it."
        }
        pending={deletePending}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={() => void onDelete()}
      />
    </>
  );
}
