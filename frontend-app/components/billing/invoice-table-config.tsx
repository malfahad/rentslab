import type { PortfolioDataColumn } from "@/components/portfolio/portfolio-data-table";
import type { InvoiceDto } from "@/types/billing";

export const INVOICE_COLUMN_STORAGE_KEY = "billing-table-cols-invoices";

export function defaultInvoiceVisibleColumns(): Set<string> {
  return new Set([
    "invoice_number",
    "tenant_name",
    "lease_label",
    "issue_date",
    "due_date",
    "total_amount",
    "outstanding_amount",
    "status",
  ]);
}

function formatDate(iso: string): string {
  if (!iso?.trim()) return "—";
  try {
    return new Date(iso + (iso.includes("T") ? "" : "T12:00:00")).toLocaleDateString();
  } catch {
    return iso;
  }
}

export const INVOICE_TABLE_COLUMNS: PortfolioDataColumn<InvoiceDto>[] = [
  {
    id: "id",
    label: "ID",
    sortField: "id",
    cell: (r) => r.id,
  },
  {
    id: "invoice_number",
    label: "Number",
    sortField: "invoice_number",
    cell: (r) => (
      <span className="font-medium text-[#1A1A1A]">
        {r.invoice_number?.trim() || `Invoice #${r.id}`}
      </span>
    ),
  },
  {
    id: "tenant_name",
    label: "Tenant",
    cell: (r) => r.tenant_name?.trim() || "—",
  },
  {
    id: "lease_label",
    label: "Unit / lease",
    cell: (r) => r.lease_label?.trim() || "—",
  },
  {
    id: "lease",
    label: "Lease ID",
    cell: (r) => r.lease,
  },
  {
    id: "issue_date",
    label: "Issue",
    sortField: "issue_date",
    cell: (r) => formatDate(r.issue_date),
  },
  {
    id: "due_date",
    label: "Due",
    sortField: "due_date",
    cell: (r) => formatDate(r.due_date),
  },
  {
    id: "total_amount",
    label: "Total",
    sortField: "total_amount",
    cell: (r) => r.total_amount,
  },
  {
    id: "outstanding_amount",
    label: "Outstanding",
    sortField: "outstanding_amount",
    cell: (r) => (
      <span className="font-medium text-[#1A1A1A]">{r.outstanding_amount}</span>
    ),
  },
  {
    id: "status",
    label: "Status",
    sortField: "status",
    cell: (r) => <span className="capitalize">{r.status}</span>,
  },
  {
    id: "issue_kind",
    label: "Kind",
    cell: (r) => r.issue_kind?.trim() || "—",
  },
  {
    id: "bill_to_name",
    label: "Bill to",
    cell: (r) => r.bill_to_name?.trim() || "—",
  },
  {
    id: "bill_to_city",
    label: "Bill-to city",
    cell: (r) => r.bill_to_city?.trim() || "—",
  },
  {
    id: "bill_to_region",
    label: "Bill-to region",
    cell: (r) => r.bill_to_region?.trim() || "—",
  },
  {
    id: "bill_to_country_code",
    label: "Bill-to country",
    cell: (r) => r.bill_to_country_code?.trim() || "—",
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
