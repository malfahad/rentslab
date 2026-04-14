"use client";

import { DashboardListView } from "@/components/dashboard/main-view";

export default function DashboardHomePage() {
  return (
    <DashboardListView
      title="Dashboard"
      description="Overview of occupancy, rent roll, and what needs attention."
      actions={
        <>
          <button type="button" className="btn-secondary-sm">
            Export
          </button>
          <button type="button" className="btn-primary-sm">
            Add record
          </button>
        </>
      }
    >
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6B7280]">
          KPI cards and charts will appear here. See{" "}
          <code className="text-[#1A1A1A]">plan.md</code> for module scope.
        </p>
      </div>
    </DashboardListView>
  );
}
