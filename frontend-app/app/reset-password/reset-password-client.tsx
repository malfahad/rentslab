"use client";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { AuthLoginHero } from "@/components/illustrations/auth-login-hero";
import { useResetPasswordLinkParams } from "@/hooks/use-reset-password";
import { COPY } from "@/lib/copy/auth";

export function ResetPasswordClient() {
  const { uid, token, missing } = useResetPasswordLinkParams();

  return (
    <AuthPageLayout
      title={COPY.resetTitle}
      subtitle={COPY.resetSubtitle}
      illustration={<AuthLoginHero className="w-full" />}
    >
      <ResetPasswordForm uid={uid} token={token} missing={missing} />
    </AuthPageLayout>
  );
}
