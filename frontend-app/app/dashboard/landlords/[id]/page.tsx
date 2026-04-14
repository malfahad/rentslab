"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listAllBuildings } from "@/services/building-service";
import { deleteLandlord, getLandlord } from "@/services/landlord-service";
import type { LandlordDto } from "@/types/portfolio";

function formatJson(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "—";
  }
}

export default function LandlordDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<LandlordDto | null>(null);
  const [buildingCount, setBuildingCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid landlord.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [landlord, buildings] = await Promise.all([
        getLandlord(id),
        listAllBuildings(),
      ]);
      setItem(landlord);
      setBuildingCount(buildings.filter((b) => b.landlord === id).length);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load landlord.",
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
      await deleteLandlord(id);
      setDeleteOpen(false);
      router.push("/dashboard/landlords");
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/landlords"
        backLabel="Back to landlords"
        title="Landlord"
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
        backHref="/dashboard/landlords"
        backLabel="Back to landlords"
        title={item?.name ?? "Landlord"}
        subtitle={
          loading
            ? "Loading…"
            : item
              ? `${buildingCount} building${buildingCount === 1 ? "" : "s"} in portfolio`
              : undefined
        }
        suggestedActions={
          item ? (
            <>
              <Link
                href={`/dashboard/landlords/${id}/edit`}
                className="btn-primary w-full"
              >
                Edit landlord
              </Link>
              <Link
                href={`/dashboard/buildings/create?landlord=${item.id}`}
                className="btn-secondary w-full"
              >
                Add building
              </Link>
              <Link
                href={`/dashboard/buildings?landlord=${item.id}`}
                className="btn-secondary w-full"
              >
                View buildings
              </Link>
              <Link href="/dashboard/units" className="btn-secondary w-full">
                View units
              </Link>
              <button
                type="button"
                className="btn-secondary w-full text-red-800 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Delete landlord
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
                Identity
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
                  <dt className="text-[#6B7280]">Legal name</dt>
                  <dd className="text-[#1A1A1A]">{item.legal_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Email</dt>
                  <dd className="text-[#1A1A1A]">{item.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Phone</dt>
                  <dd className="text-[#1A1A1A]">{item.phone || "—"}</dd>
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
                JSON fields
              </h2>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#F9FAFB] p-3 text-xs text-[#374151]">
                {formatJson(item.contact_info)}
              </pre>
              <p className="mt-2 text-xs text-[#6B7280]">Contact info</p>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#F9FAFB] p-3 text-xs text-[#374151]">
                {formatJson(item.bank_details)}
              </pre>
              <p className="mt-2 text-xs text-[#6B7280]">Bank details</p>
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
        title="Delete landlord?"
        message={`Remove “${item?.name}” from this organization? Buildings must be reassigned or removed first if the API requires it.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}
