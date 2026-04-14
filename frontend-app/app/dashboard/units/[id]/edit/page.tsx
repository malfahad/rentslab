"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { UnitForm } from "@/components/portfolio/unit-form";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listAllBuildings } from "@/services/building-service";
import { getUnit, updateUnit } from "@/services/unit-service";
import type { BuildingDto, UnitDto } from "@/types/portfolio";
import type { UnitFormValues } from "@/components/portfolio/unit-form";

const FORM_ID = "unit-edit-form";

export default function UnitEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<UnitDto | null>(null);
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      const [u, b] = await Promise.all([getUnit(id), listAllBuildings()]);
      setItem(u);
      setBuildings(b);
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

  async function handleSubmit(values: UnitFormValues) {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await updateUnit(id, values);
      router.push("/dashboard/units");
    } catch (e) {
      alert(e instanceof ApiError ? e.messageForUser : "Save failed");
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
        Preparing workspace…
      </div>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
        Loading unit…
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/units"
        backLabel="Back to units"
        title="Edit unit"
        footer={
          <Link href="/dashboard/units" className="btn-secondary">
            Cancel
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError ?? "Not found."}</p>
      </PortfolioFormShell>
    );
  }

  if (buildings.length === 0) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/units"
        backLabel="Back to units"
        title="Edit unit"
        footer={
          <Link href="/dashboard/buildings/create" className="btn-primary">
            Add a building
          </Link>
        }
      >
        <p className="text-sm text-[#6B7280]">
          No buildings found. Create a building before editing this unit&apos;s
          assignment.
        </p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref="/dashboard/units"
      backLabel="Back to units"
      title="Edit unit"
      description={`${item.unit_number}`}
      footer={
        <>
          <Link href="/dashboard/units" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary"
            disabled={pending}
            data-testid="unit-edit-submit"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <UnitForm
        formId={FORM_ID}
        buildings={buildings}
        initial={item}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
