"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listLeasesForTenant } from "@/services/lease-service";
import { deleteTenant, getTenant } from "@/services/tenant-service";
import type { LeaseDto, TenantDto } from "@/types/operations";

function formatRent(amount: string, currency: string | undefined): string {
  const c = (currency ?? "").trim();
  const num = Number(amount);
  if (!Number.isFinite(num)) return amount;
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return c ? `${formatted} ${c}` : formatted;
}

export default function TenantDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid tenant.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [t, ls] = await Promise.all([getTenant(id), listLeasesForTenant(id)]);
      setTenant(t);
      setLeases(ls);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load tenant.",
      );
      setTenant(null);
      setLeases([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  async function handleDelete() {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await deleteTenant(id);
      setDeleteOpen(false);
      router.push("/dashboard/tenants");
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/tenants"
        backLabel="Back to tenants"
        title="Tenant"
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

  const item = tenant;

  return (
    <>
      <DashboardDetailView
        backHref="/dashboard/tenants"
        backLabel="Back to tenants"
        title={item?.name ?? "Tenant"}
        subtitle={
          loading
            ? "Loading…"
            : item
              ? `${leases.length} lease${leases.length === 1 ? "" : "s"}`
              : undefined
        }
        suggestedActions={
          item ? (
            <>
              <Link
                href={`/dashboard/tenants/${id}/edit`}
                className="btn-primary w-full"
              >
                Edit tenant
              </Link>
              <Link
                href="/dashboard/tenants/onboarding"
                className="btn-secondary w-full"
              >
                New tenant onboarding
              </Link>
              <Link
                href={`/dashboard/units`}
                className="btn-secondary w-full"
              >
                Browse units
              </Link>
              <Link
                href={`/dashboard/invoices?tenant=${id}`}
                className="btn-secondary w-full"
              >
                Invoices
              </Link>
              <Link
                href={`/dashboard/payments?tenant=${id}`}
                className="btn-secondary w-full"
              >
                Payments
              </Link>
              <Link
                href={`/dashboard/credit-notes?tenant=${id}`}
                className="btn-secondary w-full"
              >
                Credit notes
              </Link>
              <button
                type="button"
                className="btn-secondary w-full text-red-800 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Delete tenant
              </button>
            </>
          ) : null
        }
      >
        {loadError ? (
          <p className="text-sm text-red-800">{loadError}</p>
        ) : null}
        {item && !loadError ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Contact
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">Type</dt>
                  <dd className="font-medium capitalize text-[#1A1A1A]">
                    {item.tenant_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Email</dt>
                  <dd className="text-[#1A1A1A]">{item.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Phone</dt>
                  <dd className="text-[#1A1A1A]">{item.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">City</dt>
                  <dd className="text-[#1A1A1A]">{item.city || "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Address
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Lines</dt>
                  <dd className="text-[#1A1A1A]">
                    {[item.address_line1, item.address_line2].filter(Boolean).join(", ") ||
                      "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Region</dt>
                  <dd className="text-[#1A1A1A]">{item.region || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Postal code</dt>
                  <dd className="text-[#1A1A1A]">{item.postal_code || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Country</dt>
                  <dd className="text-[#1A1A1A]">{item.country_code || "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Leases
                </h2>
                <Link
                  href="/dashboard/tenants/onboarding"
                  className="text-sm font-medium text-brand-blue hover:text-brand-navy hover:underline"
                >
                  Add via onboarding
                </Link>
              </div>
              {leases.length === 0 ? (
                <p className="mt-3 text-sm text-[#6B7280]">No leases yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-lg border border-[#F3F4F6]">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-[#374151]">Unit</th>
                        <th className="px-3 py-2 font-semibold text-[#374151]">Rent</th>
                        <th className="px-3 py-2 font-semibold text-[#374151]">Cycle</th>
                        <th className="px-3 py-2 font-semibold text-[#374151]">Status</th>
                        <th className="px-3 py-2 font-semibold text-[#374151]"> </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {leases.map((l) => (
                        <tr key={l.id}>
                          <td className="px-3 py-2 text-[#1A1A1A]">
                            {l.unit_label ||
                              (l.building_name
                                ? `${l.building_name} (unit #${l.unit})`
                                : `Unit #${l.unit}`)}
                          </td>
                          <td className="px-3 py-2 text-[#6B7280]">
                            {formatRent(l.rent_amount, l.rent_currency)}
                          </td>
                          <td className="px-3 py-2 capitalize text-[#6B7280]">
                            {l.billing_cycle}
                          </td>
                          <td className="px-3 py-2 text-[#6B7280]">{l.status}</td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              href={`/dashboard/units/${l.unit}`}
                              className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                            >
                              Open unit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Company
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">Registration</dt>
                  <dd className="text-[#1A1A1A]">
                    {item.company_registration_number || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Tax ID</dt>
                  <dd className="text-[#1A1A1A]">{item.tax_id || "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Record
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">Created</dt>
                  <dd className="text-[#1A1A1A]">
                    {new Date(item.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Updated</dt>
                  <dd className="text-[#1A1A1A]">
                    {new Date(item.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </DashboardDetailView>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete tenant?"
        message={`Remove “${item?.name}” from this organization? Related leases and subscriptions are removed with the tenant.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}
