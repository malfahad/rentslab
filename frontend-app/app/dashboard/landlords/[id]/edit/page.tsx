"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LandlordForm,
  type LandlordFormValues,
} from "@/components/portfolio/landlord-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getLandlord, updateLandlord } from "@/services/landlord-service";
import type { LandlordDto } from "@/types/portfolio";

const FORM_ID = "landlord-edit-form";

export default function LandlordEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<LandlordDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      setItem(await getLandlord(id));
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

  async function handleSubmit(values: LandlordFormValues) {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await updateLandlord(id, values);
      router.push("/dashboard/landlords");
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
        Loading landlord…
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/landlords"
        backLabel="Back to landlords"
        title="Edit landlord"
        footer={
          <Link href="/dashboard/landlords" className="btn-secondary">
            Cancel
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError ?? "Not found."}</p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref="/dashboard/landlords"
      backLabel="Back to landlords"
      title="Edit landlord"
      description={item.name}
      footer={
        <>
          <Link href="/dashboard/landlords" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary"
            disabled={pending}
            data-testid="landlord-edit-submit"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <LandlordForm
        formId={FORM_ID}
        initial={item}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
