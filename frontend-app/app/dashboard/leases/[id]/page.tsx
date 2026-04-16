"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { BILLING_CYCLES, DEFAULT_BILLING_CYCLE } from "@/lib/constants/billing-cycles";
import { RENT_CURRENCIES } from "@/lib/constants/currencies";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getBuilding } from "@/services/building-service";
import { closeLease, getLease } from "@/services/lease-service";
import { listOrgServices } from "@/services/catalog-service";
import {
  createServiceSubscription,
  deleteServiceSubscription,
  listAllSubscriptionsForLease,
} from "@/services/service-subscription-service";
import { getUnit } from "@/services/unit-service";
import type { LeaseDto, ServiceDto, ServiceSubscriptionDto } from "@/types/operations";

function formatMoney(amount: string, currency: string): string {
  const c = currency?.trim();
  return c ? `${amount} ${c}` : amount;
}

export default function LeaseDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildingName, setBuildingName] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<ServiceSubscriptionDto[]>(
    [],
  );
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [subDeletePending, setSubDeletePending] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subServiceId, setSubServiceId] = useState("");
  const [subRate, setSubRate] = useState("");
  const [subCurrency, setSubCurrency] = useState("USD");
  const [subCycle, setSubCycle] = useState<string>(DEFAULT_BILLING_CYCLE);
  const [subPending, setSubPending] = useState(false);
  const [subDelete, setSubDelete] = useState<ServiceSubscriptionDto | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid lease.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [l, subs, svcList] = await Promise.all([
        getLease(id),
        listAllSubscriptionsForLease(id),
        listOrgServices(),
      ]);
      setLease(l);
      setSubscriptions(subs);
      setServices(svcList);
      const u = await getUnit(l.unit);
      setBuildingId(u.building);
      const b = await getBuilding(u.building);
      setBuildingName(b.name);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load lease.",
      );
      setLease(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  useEffect(() => {
    if (subServiceId === "") {
      setSubCurrency("USD");
      return;
    }
    const svc = services.find((x) => x.id === Number(subServiceId));
    const c = svc?.currency?.trim();
    if (c) setSubCurrency(c);
  }, [subServiceId, services]);

  async function handleCloseLease() {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      const updated = await closeLease(id);
      setLease(updated);
      setDeleteOpen(false);
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Could not close lease");
    } finally {
      setPending(false);
    }
  }

  async function handleAddSubscription() {
    if (!Number.isFinite(id) || lease == null) return;
    const sid = Number(subServiceId);
    if (!Number.isFinite(sid) || subRate.trim() === "") return;
    setSubPending(true);
    try {
      const created = await createServiceSubscription({
        lease: lease.id,
        service: sid,
        rate: subRate.trim(),
        currency: subCurrency.trim(),
        billing_cycle: subCycle,
      });
      setSubscriptions((prev) => [...prev, created]);
      setSubModalOpen(false);
      setSubServiceId("");
      setSubRate("");
      setSubCurrency("USD");
      setSubCycle(DEFAULT_BILLING_CYCLE);
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Could not add subscription");
    } finally {
      setSubPending(false);
    }
  }

  async function handleDeleteSubscription() {
    if (!subDelete) return;
    setSubDeletePending(true);
    try {
      await deleteServiceSubscription(subDelete.id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== subDelete.id));
      setSubDelete(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Remove failed");
    } finally {
      setSubDeletePending(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/leases"
        backLabel="Back to lease arrangements"
        title="Lease"
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
    lease != null
      ? `${lease.tenant_name?.trim() || `Tenant #${lease.tenant}`} · ${lease.unit_label?.trim() || `Unit #${lease.unit}`}`
      : "Lease arrangement";

  return (
    <>
      <DashboardDetailView
        backHref="/dashboard/leases"
        backLabel="Back to lease arrangements"
        title={loading ? "Lease arrangement" : title}
        subtitle={
          loading
            ? "Loading…"
            : lease && buildingName
              ? buildingName
              : undefined
        }
        suggestedActions={
          lease ? (
            <>
              <Link
                href={`/dashboard/leases/${id}/edit`}
                className="btn-primary w-full"
              >
                Edit lease
              </Link>
              <Link
                href="/dashboard/tenants"
                className="btn-secondary w-full"
              >
                Tenant directory
              </Link>
              <Link
                href={`/dashboard/units/${lease.unit}`}
                className="btn-secondary w-full"
              >
                View unit
              </Link>
              {buildingId != null ? (
                <Link
                  href={`/dashboard/buildings/${buildingId}`}
                  className="btn-secondary w-full"
                >
                  View building
                </Link>
              ) : null}
              <Link
                href={`/dashboard/leases?unit=${lease.unit}`}
                className="btn-secondary w-full"
              >
                Other leases for this unit
              </Link>
              <Link
                href={`/dashboard/invoices?lease=${id}`}
                className="btn-secondary w-full"
              >
                Invoices
              </Link>
              <Link
                href={`/dashboard/payments?lease=${id}`}
                className="btn-secondary w-full"
              >
                Payments
              </Link>
              <Link
                href={`/dashboard/credit-notes?lease=${id}`}
                className="btn-secondary w-full"
              >
                Credit notes
              </Link>
              <Link href="/dashboard/services" className="btn-secondary w-full">
                Services catalog
              </Link>
              {lease.status === "active" ? (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => setSubModalOpen(true)}
                >
                  Add service subscription
                </button>
              ) : null}
              {lease.status === "active" ? (
                <button
                  type="button"
                  className="btn-secondary w-full text-red-800 hover:bg-red-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  Close lease
                </button>
              ) : null}
            </>
          ) : null
        }
      >
        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}
        {lease && !loadError ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Summary
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">Status</dt>
                  <dd className="font-medium text-[#1A1A1A]">{lease.status}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Billing cycle</dt>
                  <dd className="text-[#1A1A1A]">{lease.billing_cycle}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Rent</dt>
                  <dd className="text-[#1A1A1A]">
                    {formatMoney(lease.rent_amount, lease.rent_currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Deposit</dt>
                  <dd className="text-[#1A1A1A]">
                    {lease.deposit_amount
                      ? formatMoney(lease.deposit_amount, lease.deposit_currency)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Start</dt>
                  <dd className="text-[#1A1A1A]">{lease.start_date}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">End</dt>
                  <dd className="text-[#1A1A1A]">{lease.end_date || "Open-ended"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Managed by</dt>
                  <dd className="text-[#1A1A1A]">
                    {lease.managed_by != null
                      ? lease.managed_by_name?.trim() || "—"
                      : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">External reference</dt>
                  <dd className="text-[#1A1A1A]">
                    {lease.external_reference?.trim() || "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Billing address
              </h2>
              <p className="mt-2 text-sm text-[#1A1A1A]">
                {lease.billing_same_as_tenant_address
                  ? "Same as tenant correspondence address"
                  : [
                      lease.billing_address_line1,
                      lease.billing_address_line2,
                      lease.billing_city,
                      lease.billing_region,
                      lease.billing_postal_code,
                      lease.billing_country_code,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
              </p>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Service subscriptions
                </h2>
                {lease.status === "active" ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-blue hover:text-brand-navy"
                    onClick={() => setSubModalOpen(true)}
                  >
                    Add
                  </button>
                ) : null}
              </div>
              {subscriptions.length === 0 ? (
                <p className="mt-3 text-sm text-[#6B7280]">
                  No billable services on this lease yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[#F3F4F6]">
                  {subscriptions.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-[#1A1A1A]">
                          {s.service_name?.trim() || `Service #${s.service}`}
                        </p>
                        <p className="text-[#6B7280]">
                          {formatMoney(s.rate, s.currency)} · {s.billing_cycle}
                        </p>
                      </div>
                      {lease.status === "active" ? (
                        <button
                          type="button"
                          className="text-sm font-medium text-red-700 hover:underline"
                          onClick={() => setSubDelete(s)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </DashboardDetailView>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Close this lease?"
        message="The lease will be marked closed with an end date of today. It stays on file for invoices and payments history; automated rent issuance will stop."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleCloseLease}
        pending={pending}
        confirmActionLabel="Close lease"
        pendingActionLabel="Closing…"
      />

      <ConfirmDeleteDialog
        open={subDelete != null}
        title="Remove subscription?"
        message={`Stop billing “${subDelete?.service_name?.trim() || "service"}” on this lease?`}
        onCancel={() => setSubDelete(null)}
        onConfirm={handleDeleteSubscription}
        pending={subDeletePending}
      />

      {subModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="sub-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-lg">
            <h2
              id="sub-modal-title"
              className="font-serif text-lg font-medium text-brand-navy"
            >
              Add service subscription
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-[#6B7280]">Service</span>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm"
                  value={subServiceId}
                  onChange={(e) => setSubServiceId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {services.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-[#6B7280]">Rate</span>
                <input
                  inputMode="decimal"
                  className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm"
                  value={subRate}
                  onChange={(e) => setSubRate(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="block text-sm">
                <span className="text-[#6B7280]">Currency</span>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm"
                  value={subCurrency}
                  onChange={(e) => setSubCurrency(e.target.value)}
                >
                  {RENT_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-[#6B7280]">Billing cycle</span>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm"
                  value={subCycle}
                  onChange={(e) => setSubCycle(e.target.value)}
                >
                  {BILLING_CYCLES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSubModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={
                  subPending ||
                  subServiceId === "" ||
                  subRate.trim() === ""
                }
                onClick={() => void handleAddSubscription()}
              >
                {subPending ? "Adding…" : "Add subscription"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
