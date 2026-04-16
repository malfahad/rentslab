"use client";

import { Suspense } from "react";
import { PaymentCreateForm } from "@/components/payments/payment-create-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";

export default function PaymentCreatePage() {
  const { orgReady, orgId } = useOrg();

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
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <PaymentCreateForm />
    </Suspense>
  );
}
