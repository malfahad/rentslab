"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LeaseForm } from "@/components/leases/lease-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getLease, updateLease } from "@/services/lease-service";
import type { LeaseDto, LeaseUpdate } from "@/types/operations";

const FORM_ID = "lease-edit-form";

export default function LeaseEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<LeaseDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid lease.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const l = await getLease(id);
      setItem(l);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load lease.",
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

  async function handleSubmit(body: LeaseUpdate) {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await updateLease(id, body);
      router.push(`/dashboard/leases/${id}`);
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
        Loading lease…
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/leases"
        backLabel="Back to lease arrangements"
        title="Edit lease"
        footer={
          <Link href="/dashboard/leases" className="btn-secondary">
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
      backHref={`/dashboard/leases/${id}`}
      backLabel="Back to lease"
      title="Edit lease"
      description="Update rent terms, status, and billing address for this arrangement."
      footer={
        <>
          <Link href={`/dashboard/leases/${id}`} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" form={FORM_ID} className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <LeaseForm formId={FORM_ID} initial={item} onSubmit={handleSubmit} />
    </PortfolioFormShell>
  );
}
