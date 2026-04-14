"use client";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthLoginHero } from "@/components/illustrations/auth-login-hero";
import { LoginForm } from "@/components/login-form";
import { useLogin } from "@/hooks/use-login";
import { COPY } from "@/lib/copy/auth";

export default function LoginPage() {
  const { submit, error, pending } = useLogin();
  return (
    <AuthPageLayout
      title={COPY.loginTitle}
      subtitle={COPY.loginSubtitle}
      illustration={<AuthLoginHero className="w-full" />}
    >
      <LoginForm onSubmit={submit} error={error} pending={pending} />
    </AuthPageLayout>
  );
}
