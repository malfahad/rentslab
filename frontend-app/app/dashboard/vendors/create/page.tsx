"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import {
  VendorForm,
  type VendorFormValues,
} from "@/components/portfolio/vendor-form";
import { createVendor } from "@/services/vendor-service";

const FORM_ID = "vendor-create-form";

export default function VendorCreatePage() {
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [pending, setPending] = useState(false);

  async function handleSubmit(values: VendorFormValues) {
    if (orgId == null) return;
    setPending(true);
    try {
      await createVendor({ org: orgId, ...values });
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

  return (
    <PortfolioFormShell
      backHref="/dashboard/vendors"
      backLabel="Back to vendors"
      title="Add vendor"
      description="Contractors and suppliers for expenses and work orders."
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
            data-testid="vendor-create-submit"
          >
            {pending ? "Saving…" : "Save vendor"}
          </button>
        </>
      }
    >
      <VendorForm
        formId={FORM_ID}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
