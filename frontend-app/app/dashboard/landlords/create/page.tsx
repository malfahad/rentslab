"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import {
  LandlordForm,
  type LandlordFormValues,
} from "@/components/portfolio/landlord-form";
import { createLandlord } from "@/services/landlord-service";

const FORM_ID = "landlord-create-form";

export default function LandlordCreatePage() {
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [pending, setPending] = useState(false);

  async function handleSubmit(values: LandlordFormValues) {
    if (orgId == null) return;
    setPending(true);
    try {
      await createLandlord({ org: orgId, ...values });
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

  return (
    <PortfolioFormShell
      backHref="/dashboard/landlords"
      backLabel="Back to landlords"
      title="Add landlord"
      description="Property owner details for your portfolio."
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
            data-testid="landlord-create-submit"
          >
            {pending ? "Saving…" : "Save landlord"}
          </button>
        </>
      }
    >
      <LandlordForm
        formId={FORM_ID}
        onSubmit={handleSubmit}
        pending={pending}
      />
    </PortfolioFormShell>
  );
}
