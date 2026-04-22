import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthLoginHero } from "@/components/illustrations/auth-login-hero";
import { COPY } from "@/lib/copy/auth";
import { ResetPasswordClient } from "./reset-password-client";

function ResetFallback() {
  return (
    <AuthPageLayout
      title={COPY.resetTitle}
      subtitle={COPY.resetLoadingBody}
      illustration={<AuthLoginHero className="w-full" />}
    >
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#6B7280] shadow-sm">
        Loading...
      </div>
    </AuthPageLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
