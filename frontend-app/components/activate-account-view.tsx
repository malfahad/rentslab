"use client";

import Link from "next/link";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { ActivateEmailPending } from "@/components/illustrations/activate-email-pending";
import { ActivateLinkBroken } from "@/components/illustrations/activate-link-broken";
import { ActivateSuccessBadge } from "@/components/illustrations/activate-success-badge";
import { COPY } from "@/lib/copy/auth";
import { ACTIVATION_LINK_INCOMPLETE } from "@/lib/messages/activation";
import type { ActivateAccountStatus } from "@/hooks/use-activate-account";

export type ActivateAccountViewProps = {
  status: ActivateAccountStatus;
  message: string;
};

export function ActivateAccountView({ status, message }: ActivateAccountViewProps) {
  const missingLink =
    status === "error" && message === ACTIVATION_LINK_INCOMPLETE;

  const title =
    status === "loading"
      ? COPY.activateTitle
      : status === "success"
        ? COPY.activateSuccessTitle
        : missingLink
          ? COPY.activateMissingTitle
          : COPY.activateErrorTitle;

  const subtitle =
    status === "loading"
      ? COPY.activateLoadingBody
      : status === "success"
        ? COPY.activateSuccessSubtitle
        : missingLink
          ? COPY.activateMissingSubtitle
          : "This usually means the link expired, was already used, or was copied incorrectly.";

  const illustration =
    status === "loading" ? (
      <ActivateEmailPending className="w-full" />
    ) : status === "success" ? (
      <ActivateSuccessBadge className="mx-auto w-full max-w-[200px]" />
    ) : (
      <ActivateLinkBroken className="w-full" />
    );

  return (
    <AuthPageLayout title={title} subtitle={subtitle} illustration={illustration}>
      {status === "loading" ? (
        <div
          className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8"
          data-testid="activate-loading"
        >
          <p className="text-center text-sm leading-relaxed text-[#6B7280]">
            {message}
          </p>
          <div
            className="mx-auto mt-6 flex w-12 justify-center gap-1.5"
            aria-hidden
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-navy/30" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-navy/50 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-navy/70 [animation-delay:300ms]" />
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <div
          className="flex flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8"
          data-testid="activate-success"
        >
          <p
            className="text-center text-[15px] leading-relaxed text-[#1A1A1A]"
            role="status"
          >
            {message}
          </p>
          <Link
            className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue"
            href="/login"
            data-testid="activate-go-login"
          >
            {COPY.activateSuccessPrimaryCta}
          </Link>
        </div>
      ) : null}

      {status === "error" ? (
        <div
          className="flex flex-col gap-6 rounded-xl border border-red-100 bg-red-50/50 p-6 shadow-sm md:p-8"
          data-testid="activate-error"
        >
          <p className="text-center text-[15px] leading-relaxed text-red-900" role="alert">
            {message}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="flex h-11 flex-1 items-center justify-center rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue sm:flex-none sm:min-w-[160px]"
              href="/login"
            >
              {COPY.activateErrorPrimaryCta}
            </Link>
            <Link
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white text-sm font-medium text-[#374151] shadow-sm transition hover:bg-[#F9FAFB] sm:flex-none sm:min-w-[160px]"
              href="/register"
            >
              {COPY.activateErrorSecondaryCta}
            </Link>
          </div>
        </div>
      ) : null}
    </AuthPageLayout>
  );
}
