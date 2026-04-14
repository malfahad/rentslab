import type { PortfolioDataColumn } from "@/components/portfolio/portfolio-data-table";
import type { BuildingDto } from "@/types/portfolio";

export const BUILDING_COLUMN_STORAGE_KEY = "portfolio-table-cols-buildings";

export function defaultBuildingVisibleColumns(): Set<string> {
  return new Set([
    "name",
    "landlord_id",
    "city",
    "building_type",
    "updated_at",
  ]);
}

export function buildingTableColumns(
  landlordName: (id: number) => string,
): PortfolioDataColumn<BuildingDto>[] {
  return [
    {
      id: "id",
      label: "ID",
      sortField: "id",
      cell: (r) => r.id,
    },
    {
      id: "org",
      label: "Org",
      cell: (r) => r.org,
    },
    {
      id: "name",
      label: "Name",
      sortField: "name",
      cell: (r) => (
        <span className="font-medium text-[#1A1A1A]">{r.name}</span>
      ),
    },
    {
      id: "landlord_id",
      label: "Landlord",
      cell: (r) => landlordName(r.landlord),
    },
    {
      id: "building_type",
      label: "Type",
      sortField: "building_type",
      cell: (r) => r.building_type,
    },
    {
      id: "address_line1",
      label: "Address 1",
      cell: (r) => r.address_line1 || "—",
    },
    {
      id: "address_line2",
      label: "Address 2",
      cell: (r) => r.address_line2 || "—",
    },
    {
      id: "city",
      label: "City",
      sortField: "city",
      cell: (r) => r.city || "—",
    },
    {
      id: "region",
      label: "Region",
      sortField: "region",
      cell: (r) => r.region || "—",
    },
    {
      id: "postal_code",
      label: "Postal",
      cell: (r) => r.postal_code || "—",
    },
    {
      id: "country_code",
      label: "Country",
      cell: (r) => r.country_code || "—",
    },
    {
      id: "latitude",
      label: "Lat",
      cell: (r) => r.latitude ?? "—",
    },
    {
      id: "longitude",
      label: "Lng",
      cell: (r) => r.longitude ?? "—",
    },
    {
      id: "location_notes",
      label: "Location notes",
      cell: (r) => (
        <span className="line-clamp-2 max-w-[200px]" title={r.location_notes}>
          {r.location_notes || "—"}
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
