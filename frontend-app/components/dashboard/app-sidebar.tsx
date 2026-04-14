"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useDashboardUI } from "@/components/dashboard/dashboard-ui-context";
import { useOrg } from "@/contexts/org-context";
import { PLACEHOLDER_ORG_NAME } from "@/lib/constants/dashboard";
import { DASHBOARD_NAV_GROUPS } from "@/lib/dashboard/nav-config";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition ${open ? "rotate-0" : "-rotate-90"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useDashboardUI();
  const { orgName } = useOrg();
  const orgLabel = orgName ?? PLACEHOLDER_ORG_NAME;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of DASHBOARD_NAV_GROUPS) {
      init[g.id] = g.defaultOpen ?? true;
    }
    return init;
  });

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((o) => ({ ...o, [id]: !o[id] }));
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      data-testid="dashboard-sidebar"
      className={`flex h-full shrink-0 flex-col border-r border-white/10 bg-brand-navy transition-[width] duration-200 ${
        sidebarCollapsed ? "w-[72px]" : "w-60"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-3">
        {DASHBOARD_NAV_GROUPS.map((group) => {
          const open = openGroups[group.id] ?? true;
          return (
            <div key={group.id} className="mb-2">
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-white/50 hover:bg-white/5"
                  aria-expanded={open}
                >
                  <Chevron open={open} />
                  <span className="truncate">{group.label}</span>
                </button>
              ) : (
                <div className="my-1 h-px bg-white/10" aria-hidden />
              )}
              {open || sidebarCollapsed ? (
                <nav className="space-y-0.5" aria-label={group.label}>
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-md py-2 text-sm transition ${
                          active
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:bg-white/5 hover:text-white"
                        } ${sidebarCollapsed ? "justify-center px-0" : "px-2"}`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                            active
                              ? "border-l-2 border-brand-gold bg-white/10"
                              : "border-l-2 border-transparent"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {!sidebarCollapsed ? (
                          <span className="truncate">{item.label}</span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white/90"
          aria-pressed={sidebarCollapsed}
          data-testid="sidebar-collapse-toggle"
        >
          <svg
            className={`h-4 w-4 ${sidebarCollapsed ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!sidebarCollapsed ? <span>Collapse</span> : null}
        </button>
        {!sidebarCollapsed ? (
          <div
            className="rounded-md bg-white/5 px-2 py-2 text-xs text-white/70"
            data-testid="sidebar-org-name"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Organization
            </p>
            <p className="mt-0.5 truncate font-medium text-white/90">
              {orgLabel}
            </p>
          </div>
        ) : (
          <div
            className="flex justify-center text-[10px] font-medium uppercase text-white/40"
            title={orgLabel}
            data-testid="sidebar-org-name"
          >
            Org
          </div>
        )}
      </div>
    </aside>
  );
}
