"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { UnitForm } from "@/components/portfolio/unit-form";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { listAllBuildings } from "@/services/building-service";
import { createUnit } from "@/services/unit-service";
import type { BuildingDto } from "@/types/portfolio";
import type { UnitFormValues } from "@/components/portfolio/unit-form";

const FORM_ID = "unit-create-form";

function UnitCreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultBuildingId = useMemo(() => {
    const raw = searchParams.get("building");
    if (raw == null || raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);

  const { orgReady, orgId } = useOrg();
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const refreshBuildings = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      setBuildings(await listAllBuildings());
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load buildings.",
      );
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgReady) return;
    if (orgId == null) {
      setLoading(false);
      return;
    }
    void refreshBuildings();
  }, [orgReady, orgId, refreshBuildings]);

  async function handleSubmit(values: UnitFormValues) {
    setPending(true);
    try {
      await createUnit(values);
      router.push(
        defaultBuildingId != null
          ? `/dashboard/units?building=${defaultBuildingId}`
          : "/dashboard/units",
      );
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
        Loading…
      </div>
    );
  }

  if (loadError) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/units"
        backLabel="Back to units"
        title="Add unit"
        footer={
          <Link href="/dashboard/units" className="btn-secondary">
            Cancel
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError}</p>
      </PortfolioFormShell>
    );
  }

  if (buildings.length === 0) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/units"
        backLabel="Back to units"
        title="Add unit"
        description="Attach a unit to a building."
        footer={
          <Link href="/dashboard/buildings/create" className="btn-primary">
            Add a building first
          </Link>
        }
      >
        <p className="text-sm text-[#6B7280]">
          Create a building before adding units.
        </p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref="/dashboard/units"
      backLabel="Back to units"
      title="Add unit"
      description="Suite, floor, and optional address overrides."
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
            data-testid="unit-create-submit"
          >
            {pending ? "Saving…" : "Save unit"}
          </button>
        </>
      }
    >
      <UnitForm
        formId={FORM_ID}
        buildings={buildings}
        defaultBuildingId={defaultBuildingId}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}

export default function UnitCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <UnitCreatePageInner />
    </Suspense>
  );
}
