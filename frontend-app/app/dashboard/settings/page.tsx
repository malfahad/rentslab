import { Suspense } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { SettingsTabbedView } from "@/components/settings/settings-tabbed-view";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardListView title="Settings" description="Loading…">
          <p className="text-sm text-[#6B7280]">Preparing settings…</p>
        </DashboardListView>
      }
    >
      <SettingsTabbedView />
    </Suspense>
  );
}
