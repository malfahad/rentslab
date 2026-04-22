/** Catalog of available reports (UI). Backend generation is not wired yet. */

export type ReportGroupId =
  | "financial"
  | "operational"
  | "tenant_lease"
  | "property_unit"
  | "compliance";

export type ReportDefinition = {
  id: number;
  slug: string;
  title: string;
  groupId: ReportGroupId;
  /** Short line for list cards */
  summary: string;
};

export const REPORT_GROUPS: { id: ReportGroupId; label: string }[] = [
  { id: "financial", label: "Financial reports" },
  { id: "operational", label: "Operational reports" },
  { id: "tenant_lease", label: "Tenant & lease reports" },
  { id: "property_unit", label: "Property & unit reports" },
  { id: "compliance", label: "Compliance & audit reports" },
];

export const REPORTS: ReportDefinition[] = [
  {
    id: 1,
    slug: "income-statement",
    title: "Income Statement (Profit & Loss)",
    groupId: "financial",
    summary: "Revenue, expenses, and net income for a period.",
  },
  {
    id: 2,
    slug: "cash-flow",
    title: "Cash Flow Report",
    groupId: "financial",
    summary: "Cash in and out by category over time.",
  },
  {
    id: 3,
    slug: "rent-roll",
    title: "Rent Roll Report",
    groupId: "financial",
    summary: "Scheduled rent by unit, lease, and tenant.",
  },
  {
    id: 4,
    slug: "ar-aging",
    title: "Accounts Receivable Aging",
    groupId: "financial",
    summary: "Outstanding balances by age bucket.",
  },
  {
    id: 5,
    slug: "ap-aging",
    title: "Accounts Payable Aging",
    groupId: "financial",
    summary: "Vendor payables by age bucket.",
  },
  {
    id: 6,
    slug: "payment-collection-summary",
    title: "Payment Collection Summary",
    groupId: "financial",
    summary: "Collections vs. billed amounts by period.",
  },
  {
    id: 7,
    slug: "occupancy-vacancy",
    title: "Occupancy / Vacancy Report",
    groupId: "operational",
    summary: "Occupied vs. vacant units and rates.",
  },
  {
    id: 8,
    slug: "lease-expiry",
    title: "Lease Expiry Report",
    groupId: "operational",
    summary: "Leases ending within a selected window.",
  },
  {
    id: 9,
    slug: "tenant-turnover",
    title: "Tenant Turnover Report",
    groupId: "operational",
    summary: "Move-outs and new leases over time.",
  },
  {
    id: 10,
    slug: "maintenance-requests-status",
    title: "Maintenance Requests Status Report",
    groupId: "operational",
    summary: "Open vs. closed maintenance activity.",
  },
  {
    id: 11,
    slug: "work-order-completion",
    title: "Work Order Completion Report",
    groupId: "operational",
    summary: "Job orders completed and cycle times.",
  },
  {
    id: 12,
    slug: "tenant-ledger",
    title: "Tenant Ledger Report",
    groupId: "tenant_lease",
    summary: "Charges, credits, and balance by tenant.",
  },
  {
    id: 13,
    slug: "active-leases",
    title: "Active Leases Report",
    groupId: "tenant_lease",
    summary: "All active leases with key dates and rent.",
  },
  {
    id: 14,
    slug: "lease-renewal",
    title: "Lease Renewal Report",
    groupId: "tenant_lease",
    summary: "Renewals due and renewal outcomes.",
  },
  {
    id: 15,
    slug: "tenant-payment-history",
    title: "Tenant Payment History",
    groupId: "tenant_lease",
    summary: "Payments received by tenant and lease.",
  },
  {
    id: 16,
    slug: "unit-status",
    title: "Unit Status Report (Occupied, Vacant, Under Maintenance)",
    groupId: "property_unit",
    summary: "Occupied, vacant, and under maintenance by unit.",
  },
  {
    id: 17,
    slug: "property-performance",
    title: "Property Performance Report",
    groupId: "property_unit",
    summary: "Income and KPIs per building or property.",
  },
  {
    id: 18,
    slug: "utility-usage",
    title: "Utility Usage Report (if applicable)",
    groupId: "property_unit",
    summary: "Usage and charges where utilities are tracked.",
  },
  {
    id: 19,
    slug: "security-deposit",
    title: "Security Deposit Report",
    groupId: "compliance",
    summary: "Held, applied, and refunded deposits.",
  },
  {
    id: 20,
    slug: "audit-trail",
    title: "Audit Trail Report (user/system activity logs)",
    groupId: "compliance",
    summary: "User and system activity for compliance review.",
  },
];

const BACKEND_WIRED_REPORT_SLUGS = new Set<string>([
  "income-statement",
  "cash-flow",
  "rent-roll",
]);

export function getReportBySlug(slug: string): ReportDefinition | undefined {
  return REPORTS.find((r) => r.slug === slug);
}

export function reportsForGroup(groupId: ReportGroupId): ReportDefinition[] {
  return REPORTS.filter((r) => r.groupId === groupId);
}

export function isReportBackendWired(slug: string): boolean {
  return BACKEND_WIRED_REPORT_SLUGS.has(slug);
}
