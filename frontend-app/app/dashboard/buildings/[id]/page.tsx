"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { deleteBuilding, getBuilding } from "@/services/building-service";
import { getLandlord } from "@/services/landlord-service";
import { listAllUnits } from "@/services/unit-service";
import type { BuildingDto } from "@/types/portfolio";

export default function BuildingDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<BuildingDto | null>(null);
  const [landlordName, setLandlordName] = useState<string | null>(null);
  const [unitCount, setUnitCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid building.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const b = await getBuilding(id);
      setItem(b);
      const [ll, units] = await Promise.all([
        getLandlord(b.landlord),
        listAllUnits(),
      ]);
      setLandlordName(ll.name);
      setUnitCount(units.filter((u) => u.building === id).length);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load building.",
      );
      setItem(null);
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
      await deleteBuilding(id);
      setDeleteOpen(false);
      router.push("/dashboard/buildings");
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/buildings"
        backLabel="Back to buildings"
        title="Building"
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

  return (
    <>
      <DashboardDetailView
        backHref="/dashboard/buildings"
        backLabel="Back to buildings"
        title={item?.name ?? "Building"}
        subtitle={
          loading
            ? "Loading…"
            : landlordName
              ? `Landlord: ${landlordName} · ${unitCount} unit${unitCount === 1 ? "" : "s"}`
              : undefined
        }
        suggestedActions={
          item ? (
            <>
              <Link
                href={`/dashboard/buildings/${id}/edit`}
                className="btn-primary w-full"
              >
                Edit building
              </Link>
              <Link
                href={`/dashboard/landlords/${item.landlord}`}
                className="btn-secondary w-full"
              >
                View landlord
              </Link>
              <Link
                href={`/dashboard/units/create?building=${item.id}`}
                className="btn-secondary w-full"
              >
                Add unit
              </Link>
              <Link
                href={`/dashboard/units?building=${item.id}`}
                className="btn-secondary w-full"
              >
                View units
              </Link>
              <Link
                href={`/dashboard/invoices?building=${item.id}`}
                className="btn-secondary w-full"
              >
                Invoices
              </Link>
              <Link
                href={`/dashboard/payments?building=${item.id}`}
                className="btn-secondary w-full"
              >
                Payments
              </Link>
              <Link
                href={`/dashboard/credit-notes?building=${item.id}`}
                className="btn-secondary w-full"
              >
                Credit notes
              </Link>
              <button
                type="button"
                className="btn-secondary w-full text-red-800 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Delete building
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
                Summary
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">ID</dt>
                  <dd className="font-medium text-[#1A1A1A]">{item.id}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Organization</dt>
                  <dd className="font-medium text-[#1A1A1A]">{item.org}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Landlord ID</dt>
                  <dd className="font-medium text-[#1A1A1A]">{item.landlord}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Type</dt>
                  <dd className="text-[#1A1A1A]">{item.building_type}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Address
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Line 1</dt>
                  <dd className="text-[#1A1A1A]">{item.address_line1 || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Line 2</dt>
                  <dd className="text-[#1A1A1A]">{item.address_line2 || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">City</dt>
                  <dd className="text-[#1A1A1A]">{item.city || "—"}</dd>
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
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Location
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">Latitude</dt>
                  <dd className="text-[#1A1A1A]">{item.latitude ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Longitude</dt>
                  <dd className="text-[#1A1A1A]">{item.longitude ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Notes</dt>
                  <dd className="whitespace-pre-wrap text-[#1A1A1A]">
                    {item.location_notes || "—"}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Timestamps
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
        title="Delete building?"
        message={`Remove “${item?.name}”? Units under this building may block deletion.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}
