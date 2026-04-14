"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/portfolio/confirm-delete-dialog";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getBuilding } from "@/services/building-service";
import { deleteUnit, getUnit } from "@/services/unit-service";
import type { UnitDto } from "@/types/portfolio";

export default function UnitDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<UnitDto | null>(null);
  const [buildingName, setBuildingName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid unit.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const u = await getUnit(id);
      setItem(u);
      const b = await getBuilding(u.building);
      setBuildingName(b.name);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load unit.",
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
      await deleteUnit(id);
      setDeleteOpen(false);
      router.push("/dashboard/units");
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/units"
        backLabel="Back to units"
        title="Unit"
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
        backHref="/dashboard/units"
        backLabel="Back to units"
        title={item ? `Unit ${item.unit_number}` : "Unit"}
        subtitle={
          loading
            ? "Loading…"
            : buildingName
              ? `Building: ${buildingName}`
              : undefined
        }
        suggestedActions={
          item ? (
            <>
              <Link
                href={`/dashboard/units/${id}/edit`}
                className="btn-primary w-full"
              >
                Edit unit
              </Link>
              <Link
                href={`/dashboard/buildings/${item.building}`}
                className="btn-secondary w-full"
              >
                View building
              </Link>
              <Link
                href={`/dashboard/units?building=${item.building}`}
                className="btn-secondary w-full"
              >
                View units in building
              </Link>
              <Link
                href="/dashboard/leases"
                className="btn-secondary w-full"
              >
                View leases
              </Link>
              <button
                type="button"
                className="btn-secondary w-full text-red-800 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Delete unit
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
                Unit
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[#6B7280]">ID</dt>
                  <dd className="font-medium text-[#1A1A1A]">{item.id}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Building ID</dt>
                  <dd className="font-medium text-[#1A1A1A]">{item.building}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Number</dt>
                  <dd className="text-[#1A1A1A]">{item.unit_number}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Type</dt>
                  <dd className="text-[#1A1A1A]">{item.unit_type}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Status</dt>
                  <dd className="text-[#1A1A1A]">{item.status}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Size</dt>
                  <dd className="text-[#1A1A1A]">{item.size ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Floor</dt>
                  <dd className="text-[#1A1A1A]">{item.floor || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Entrance</dt>
                  <dd className="text-[#1A1A1A]">{item.entrance || "—"}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Address override
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Line 1</dt>
                  <dd className="text-[#1A1A1A]">
                    {item.address_override_line1 || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">City</dt>
                  <dd className="text-[#1A1A1A]">
                    {item.address_override_city || "—"}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Internal notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#1A1A1A]">
                {item.internal_notes || "—"}
              </p>
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
        title="Delete unit?"
        message={`Remove unit “${item?.unit_number}”? Active leases may prevent deletion.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        pending={pending}
      />
    </>
  );
}
