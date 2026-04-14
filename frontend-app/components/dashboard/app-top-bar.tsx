"use client";

import { useEffect } from "react";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { RentSlabLogo } from "@/components/dashboard/rentslab-logo";
import { UserProfileMenu } from "@/components/dashboard/user-profile-menu";
import { useDashboardUI } from "@/components/dashboard/dashboard-ui-context";

export function AppTopBar() {
  const { setGlobalSearchOpen } = useDashboardUI();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setGlobalSearchOpen]);

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-brand-navy px-3 md:px-4"
      data-testid="dashboard-top-bar"
    >
      <div className="flex min-w-0 shrink-0 items-center">
        <RentSlabLogo collapsed={false} />
      </div>
      <GlobalSearch />
      <UserProfileMenu />
    </header>
  );
}
