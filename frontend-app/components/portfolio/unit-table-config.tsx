import type { PortfolioDataColumn } from "@/components/portfolio/portfolio-data-table";
import type { UnitDto } from "@/types/portfolio";

export const UNIT_COLUMN_STORAGE_KEY = "portfolio-table-cols-units";

export function defaultUnitVisibleColumns(): Set<string> {
  return new Set([
    "unit_number",
    "building_id",
    "unit_type",
    "status",
    "floor",
    "updated_at",
  ]);
}

export function unitTableColumns(
  buildingName: (id: number) => string,
): PortfolioDataColumn<UnitDto>[] {
  return [
    {
      id: "id",
      label: "ID",
      sortField: "id",
      cell: (r) => r.id,
    },
    {
      id: "unit_number",
      label: "Unit #",
      sortField: "unit_number",
      cell: (r) => (
        <span className="font-medium text-[#1A1A1A]">{r.unit_number}</span>
      ),
    },
    {
      id: "building_id",
      label: "Building",
      cell: (r) => buildingName(r.building),
    },
    {
      id: "floor",
      label: "Floor",
      sortField: "floor",
      cell: (r) => r.floor || "—",
    },
    {
      id: "entrance",
      label: "Entrance",
      cell: (r) => r.entrance || "—",
    },
    {
      id: "unit_type",
      label: "Type",
      sortField: "unit_type",
      cell: (r) => r.unit_type,
    },
    {
      id: "size",
      label: "Size",
      sortField: "size",
      cell: (r) => r.size ?? "—",
    },
    {
      id: "status",
      label: "Status",
      sortField: "status",
      cell: (r) => r.status,
    },
    {
      id: "address_override_line1",
      label: "Addr override 1",
      cell: (r) => r.address_override_line1 || "—",
    },
    {
      id: "address_override_city",
      label: "Addr override city",
      cell: (r) => r.address_override_city || "—",
    },
    {
      id: "internal_notes",
      label: "Notes",
      cell: (r) => (
        <span className="line-clamp-2 max-w-[200px]" title={r.internal_notes}>
          {r.internal_notes || "—"}
        </span>
      ),
    },
    {
      id: "created_at",
      label: "Created",
      sortField: "created_at",
      cell: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      id: "updated_at",
      label: "Updated",
      sortField: "updated_at",
      cell: (r) => new Date(r.updated_at).toLocaleString(),
    },
  ];
}
