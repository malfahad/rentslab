"use client";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { AuthLoginHero } from "@/components/illustrations/auth-login-hero";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { COPY } from "@/lib/copy/auth";

export default function ForgotPasswordPage() {
  const { submit, error, success, successMessage, pending } = useForgotPassword();

  return (
    <AuthPageLayout
      title={COPY.forgotTitle}
      subtitle={COPY.forgotSubtitle}
      illustration={<AuthLoginHero className="w-full" />}
    >
      <ForgotPasswordForm
        onSubmit={submit}
        error={error}
        success={success}
        successMessage={successMessage}
        pending={pending}
      />
    </AuthPageLayout>
  );
}
