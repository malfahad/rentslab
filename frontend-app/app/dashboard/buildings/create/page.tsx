"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BuildingForm } from "@/components/portfolio/building-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { createBuilding } from "@/services/building-service";
import { listAllLandlords } from "@/services/landlord-service";
import type { LandlordDto } from "@/types/portfolio";
import type { BuildingFormValues } from "@/components/portfolio/building-form";

const FORM_ID = "building-create-form";

function BuildingCreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultLandlordId = useMemo(() => {
    const raw = searchParams.get("landlord");
    if (raw == null || raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);

  const { orgReady, orgId } = useOrg();
  const [landlords, setLandlords] = useState<LandlordDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const refreshLandlords = useCallback(async () => {
    if (orgId == null) return;
    setLoading(true);
    setLoadError(null);
    try {
      setLandlords(await listAllLandlords());
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load landlords.",
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
    void refreshLandlords();
  }, [orgReady, orgId, refreshLandlords]);

  async function handleSubmit(values: BuildingFormValues) {
    if (orgId == null) return;
    setPending(true);
    try {
      await createBuilding({ org: orgId, ...values });
      router.push(
        defaultLandlordId != null
          ? `/dashboard/buildings?landlord=${defaultLandlordId}`
          : "/dashboard/buildings",
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
        backHref="/dashboard/buildings"
        backLabel="Back to buildings"
        title="Add building"
        footer={
          <Link href="/dashboard/buildings" className="btn-secondary">
            Cancel
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError}</p>
      </PortfolioFormShell>
    );
  }

  if (landlords.length === 0) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/buildings"
        backLabel="Back to buildings"
        title="Add building"
        description="Link a building to a landlord."
        footer={
          <Link href="/dashboard/landlords/create" className="btn-primary">
            Add a landlord first
          </Link>
        }
      >
        <p className="text-sm text-[#6B7280]">
          Create a landlord before adding a building.
        </p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref="/dashboard/buildings"
      backLabel="Back to buildings"
      title="Add building"
      description="Address and location for a structure under a landlord."
      footer={
        <>
          <Link href="/dashboard/buildings" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary"
            disabled={pending}
            data-testid="building-create-submit"
          >
            {pending ? "Saving…" : "Save building"}
          </button>
        </>
      }
    >
      <BuildingForm
        formId={FORM_ID}
        landlords={landlords}
        defaultLandlordId={defaultLandlordId}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}

export default function BuildingCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <BuildingCreatePageInner />
    </Suspense>
  );
}
