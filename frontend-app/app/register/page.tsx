"use client";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthRegisterHero } from "@/components/illustrations/auth-register-hero";
import { RegisterForm } from "@/components/register-form";
import { COPY } from "@/lib/copy/auth";
import { useRegister } from "@/hooks/use-register";

export default function RegisterPage() {
  const { submit, error, success, successMessage, pending } = useRegister();
  return (
    <AuthPageLayout
      title={COPY.registerTitle}
      subtitle={COPY.registerSubtitle}
      illustration={<AuthRegisterHero className="w-full" />}
    >
      <RegisterForm
        onSubmit={submit}
        error={error}
        success={success}
        successMessage={successMessage}
        pending={pending}
      />
    </AuthPageLayout>
  );
}
