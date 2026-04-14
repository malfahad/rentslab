"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BuildingForm } from "@/components/portfolio/building-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getBuilding, updateBuilding } from "@/services/building-service";
import { listAllLandlords } from "@/services/landlord-service";
import type { BuildingDto, LandlordDto } from "@/types/portfolio";
import type { BuildingFormValues } from "@/components/portfolio/building-form";

const FORM_ID = "building-edit-form";

export default function BuildingEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<BuildingDto | null>(null);
  const [landlords, setLandlords] = useState<LandlordDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      const [b, land] = await Promise.all([
        getBuilding(id),
        listAllLandlords(),
      ]);
      setItem(b);
      setLandlords(land);
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

  async function handleSubmit(values: BuildingFormValues) {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await updateBuilding(id, values);
      router.push("/dashboard/buildings");
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
        Loading building…
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/buildings"
        backLabel="Back to buildings"
        title="Edit building"
        footer={
          <Link href="/dashboard/buildings" className="btn-secondary">
            Cancel
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError ?? "Not found."}</p>
      </PortfolioFormShell>
    );
  }

  if (landlords.length === 0) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/buildings"
        backLabel="Back to buildings"
        title="Edit building"
        footer={
          <Link href="/dashboard/landlords/create" className="btn-primary">
            Add a landlord
          </Link>
        }
      >
        <p className="text-sm text-[#6B7280]">
          No landlords found. Create a landlord to assign this building.
        </p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref="/dashboard/buildings"
      backLabel="Back to buildings"
      title="Edit building"
      description={item.name}
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
            data-testid="building-edit-submit"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <BuildingForm
        formId={FORM_ID}
        landlords={landlords}
        initial={item}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
