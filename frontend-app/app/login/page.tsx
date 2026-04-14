"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthLoginHero } from "@/components/illustrations/auth-login-hero";
import { LoginForm } from "@/components/login-form";
import { useLogin } from "@/hooks/use-login";
import { COPY } from "@/lib/copy/auth";

function LoginPageInner() {
  const { submit, error, pending } = useLogin();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const sessionNotice =
    reason === "no_org" ||
    reason === "no_token" ||
    reason === "session_expired"
      ? "Your workspace session is missing or invalid (organization context or sign-in). Please sign in again."
      : null;

  return (
    <AuthPageLayout
      title={COPY.loginTitle}
      subtitle={COPY.loginSubtitle}
      illustration={<AuthLoginHero className="w-full" />}
    >
      {sessionNotice ? (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
          data-testid="login-session-notice"
        >
          {sessionNotice}
        </div>
      ) : null}
      <LoginForm onSubmit={submit} error={error} pending={pending} />
    </AuthPageLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
