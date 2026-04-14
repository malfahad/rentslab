"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  VendorForm,
  type VendorFormValues,
} from "@/components/portfolio/vendor-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getVendor, updateVendor } from "@/services/vendor-service";
import type { VendorDto } from "@/types/operations";

const FORM_ID = "vendor-edit-form";

export default function VendorEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [item, setItem] = useState<VendorDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid vendor.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      setItem(await getVendor(id));
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load vendor.",
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

  async function handleSubmit(values: VendorFormValues) {
    if (!Number.isFinite(id)) return;
    setPending(true);
    try {
      await updateVendor(id, values);
      router.push("/dashboard/vendors");
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
        Loading vendor…
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/vendors"
        backLabel="Back to vendors"
        title="Edit vendor"
        footer={
          <Link href="/dashboard/vendors" className="btn-secondary">
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
      backHref="/dashboard/vendors"
      backLabel="Back to vendors"
      title="Edit vendor"
      description={item.name}
      footer={
        <>
          <Link href="/dashboard/vendors" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary"
            disabled={pending}
            data-testid="vendor-edit-submit"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <VendorForm
        formId={FORM_ID}
        initial={item}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
