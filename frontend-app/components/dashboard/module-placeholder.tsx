import { DashboardListView } from "@/components/dashboard/main-view";

export function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <DashboardListView
      title={title}
      description={
        description ??
        "This module is scaffolded. Connect the API to show tables and actions."
      }
      actions={
        <button type="button" className="btn-secondary-sm">
          New
        </button>
      }
    >
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#6B7280] shadow-sm">
        List view and row actions will render here.
      </div>
    </DashboardListView>
  );
}
