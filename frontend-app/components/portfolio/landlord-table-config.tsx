import { jsonCellPreview } from "@/components/portfolio/portfolio-json-preview";
import type { PortfolioDataColumn } from "@/components/portfolio/portfolio-data-table";
import type { LandlordDto } from "@/types/portfolio";

export const LANDLORD_COLUMN_STORAGE_KEY = "portfolio-table-cols-landlords";

export function defaultLandlordVisibleColumns(): Set<string> {
  return new Set([
    "name",
    "legal_name",
    "email",
    "phone",
    "city",
    "region",
    "updated_at",
  ]);
}

export const LANDLORD_TABLE_COLUMNS: PortfolioDataColumn<LandlordDto>[] = [
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
    id: "legal_name",
    label: "Legal name",
    sortField: "legal_name",
    cell: (r) => r.legal_name || "—",
  },
  {
    id: "email",
    label: "Email",
    sortField: "email",
    cell: (r) => r.email || "—",
  },
  {
    id: "phone",
    label: "Phone",
    cell: (r) => r.phone || "—",
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
    id: "contact_info",
    label: "Contact (JSON)",
    cell: (r) => (
      <span
        className="max-w-[140px] truncate font-mono text-xs"
        title={jsonCellPreview(r.contact_info)}
      >
        {jsonCellPreview(r.contact_info)}
      </span>
    ),
  },
  {
    id: "bank_details",
    label: "Bank (JSON)",
    cell: (r) => (
      <span
        className="max-w-[140px] truncate font-mono text-xs"
        title={jsonCellPreview(r.bank_details)}
      >
        {jsonCellPreview(r.bank_details)}
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
