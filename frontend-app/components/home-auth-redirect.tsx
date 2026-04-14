"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RedirectFlowIllustration } from "@/components/illustrations/redirect-flow";
import { COPY } from "@/lib/copy/auth";
import { isAuthenticated } from "@/lib/auth-storage";

type Target = "/dashboard" | "/login";

function resolveTarget(): Target {
  return isAuthenticated() ? "/dashboard" : "/login";
}

export function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(resolveTarget());
  }, [router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface-main px-6"
      data-testid="home-auth-loading"
    >
      <div className="w-full max-w-[240px]">
        <RedirectFlowIllustration className="w-full" />
      </div>
      <div className="max-w-sm text-center">
        <p className="font-serif text-xl font-medium text-brand-navy">
          {COPY.homeRedirect}
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          One moment while we open the right screen for you.
        </p>
      </div>
    </div>
  );
}
