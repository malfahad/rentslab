"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppTopBar } from "@/components/dashboard/app-top-bar";
import { DashboardUIProvider } from "@/components/dashboard/dashboard-ui-context";
import { OrgProvider } from "@/contexts/org-context";
import { getAccessToken } from "@/lib/auth-storage";

function DashboardShellInner({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-surface-main">
      <AppTopBar />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          data-testid="dashboard"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-surface-main text-sm text-[#6B7280]"
        data-testid="dashboard-loading"
      >
        Loading…
      </div>
    );
  }

  return (
    <DashboardUIProvider>
      <OrgProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </OrgProvider>
    </DashboardUIProvider>
  );
}
