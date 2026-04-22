"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import {
  defaultSettingsTabId,
  isSettingsTabId,
  SETTINGS_TABS,
  type SettingsTabId,
} from "@/lib/settings/settings-tabs-config";
import { OrganizationSettingsPanel } from "./organization-settings-panel";
import { OutlineTree } from "./outline-tree";

const TAB_PARAM = "tab";

export function SettingsTabbedView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: SettingsTabId = useMemo(() => {
    const raw = searchParams.get(TAB_PARAM);
    return isSettingsTabId(raw) ? raw : defaultSettingsTabId();
  }, [searchParams]);

  const setTab = useCallback(
    (id: SettingsTabId) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(TAB_PARAM, id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const tabDef = SETTINGS_TABS.find((t) => t.id === activeTab) ?? SETTINGS_TABS[0];

  return (
    <DashboardListView
      title="Settings"
      description="Configure your organization, access, portfolio defaults, billing, and integrations. Detailed controls will appear here as each area is released."
    >
      <div className="mx-auto max-w-content">
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="border-b border-[#E5E7EB] px-4 py-3 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Settings
            </p>
            <div
              className="mt-3 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Settings sections"
            >
              {SETTINGS_TABS.map((t) => {
                const selected = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`settings-tab-${t.id}`}
                    aria-selected={selected}
                    aria-controls={`settings-panel-${t.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      selected
                        ? "bg-brand-navy text-white"
                        : "text-[#374151] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    {t.tabLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            role="tabpanel"
            id={`settings-panel-${tabDef.id}`}
            aria-labelledby={`settings-tab-${tabDef.id}`}
            className="p-4 md:p-6"
          >
            {tabDef.id === "organization" ? (
              <div>
                <div className="border-b border-dashed border-[#E5E7EB] pb-4">
                  <h2 className="font-serif text-lg font-medium text-brand-navy">
                    {tabDef.title}
                  </h2>
                  <p className="mt-3 text-sm text-[#6B7280]">
                    Configure organization identity, regional defaults, currency,
                    and registration profile. These settings are reused across
                    dashboard and reporting.
                  </p>
                </div>
                <div className="mt-6">
                  <OrganizationSettingsPanel />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-[#E5E7EB] pb-4">
                  <h2 className="font-serif text-lg font-medium text-brand-navy">
                    {tabDef.title}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
                    Coming soon
                  </span>
                </div>
                <p className="mt-4 text-sm text-[#6B7280]">
                  The following areas are planned for this section. Editing will be
                  enabled in a future release.
                </p>
                <div className="mt-6 rounded-lg border border-dashed border-[#D1D5DB] bg-[#FAFAFA] p-4 md:p-5">
                  <OutlineTree nodes={tabDef.outline} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardListView>
  );
}
