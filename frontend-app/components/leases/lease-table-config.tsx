import type { PortfolioDataColumn } from "@/components/portfolio/portfolio-data-table";
import type { LeaseDto } from "@/types/operations";

export const LEASE_COLUMN_STORAGE_KEY = "portfolio-table-cols-leases";

function formatRent(row: LeaseDto): string {
  const amt = row.rent_amount;
  const c = row.rent_currency?.trim();
  return c ? `${amt} ${c}` : amt;
}

function statusCell(status: string) {
  const s = status.toLowerCase();
  const cls =
    s === "active"
      ? "text-[#2E7D32]"
      : s === "closed" || s === "terminated"
        ? "text-red-700"
        : "text-[#6B7280]";
  return <span className={cls}>{status}</span>;
}

export function defaultLeaseVisibleColumns(): Set<string> {
  return new Set([
    "tenant_name",
    "unit_label",
    "building_name",
    "rent",
    "status",
    "start_date",
    "end_date",
  ]);
}

export function leaseTableColumns(): PortfolioDataColumn<LeaseDto>[] {
  return [
    {
      id: "id",
      label: "ID",
      sortField: "id",
      cell: (r) => r.id,
    },
    {
      id: "tenant_name",
      label: "Tenant",
      cell: (r) => (
        <span className="font-medium text-[#1A1A1A]">
          {r.tenant_name?.trim() || `Tenant #${r.tenant}`}
        </span>
      ),
    },
    {
      id: "unit_label",
      label: "Unit",
      cell: (r) => r.unit_label?.trim() || `Unit #${r.unit}`,
    },
    {
      id: "building_name",
      label: "Building",
      cell: (r) => r.building_name?.trim() || "—",
    },
    {
      id: "rent",
      label: "Rent",
      sortField: "rent_amount",
      cell: (r) => formatRent(r),
    },
    {
      id: "status",
      label: "Status",
      sortField: "status",
      cell: (r) => statusCell(r.status),
    },
    {
      id: "start_date",
      label: "Start",
      sortField: "start_date",
      cell: (r) => r.start_date,
    },
    {
      id: "end_date",
      label: "End",
      sortField: "end_date",
      cell: (r) => r.end_date || "—",
    },
    {
      id: "billing_cycle",
      label: "Billing",
      cell: (r) => r.billing_cycle,
    },
    {
      id: "managed_by_name",
      label: "Managed by",
      cell: (r) => r.managed_by_name?.trim() || "—",
    },
    {
      id: "created_at",
      label: "Created",
      sortField: "created_at",
      cell: (r) =>
        r.created_at ? new Date(r.created_at).toLocaleDateString() : "—",
    },
    {
      id: "updated_at",
      label: "Updated",
      sortField: "updated_at",
      cell: (r) =>
        r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—",
    },
  ];
}
