"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TenantForm } from "@/components/tenants/tenant-form";
import type { TenantFormValues } from "@/components/tenants/tenant-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getTenant, updateTenant } from "@/services/tenant-service";
import type { TenantDto } from "@/types/operations";

const FORM_ID = "tenant-edit-form";

export default function TenantEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<TenantDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      setItem(await getTenant(id));
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load tenant.",
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

  async function handleSubmit(values: TenantFormValues) {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await updateTenant(id, values);
      router.push(`/dashboard/tenants/${id}`);
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
        Loading tenant…
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/tenants"
        backLabel="Back to tenants"
        title="Edit tenant"
        footer={
          <Link href="/dashboard/tenants" className="btn-secondary">
            Cancel
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError ?? "Unable to load tenant."}</p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref={`/dashboard/tenants/${id}`}
      backLabel="Back to tenant"
      title="Edit tenant"
      description={`${item.name}`}
      footer={
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/tenants/${id}`} className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      }
    >
      <TenantForm
        formId={FORM_ID}
        initial={item}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
