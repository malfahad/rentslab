import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { ActivateEmailPending } from "@/components/illustrations/activate-email-pending";
import { COPY } from "@/lib/copy/auth";
import { ActivateAccountClient } from "./activate-account-client";

function ActivateFallback() {
  return (
    <AuthPageLayout
      title={COPY.activateTitle}
      subtitle={COPY.activateLoadingBody}
      illustration={<ActivateEmailPending className="w-full" />}
    >
      <div
        className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#6B7280] shadow-sm"
        data-testid="activate-suspense-fallback"
      >
        Loading…
      </div>
    </AuthPageLayout>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<ActivateFallback />}>
      <ActivateAccountClient />
    </Suspense>
  );
}
