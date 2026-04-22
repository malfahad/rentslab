/** API payloads from ``GET /api/v1/reports/<slug>/`` */

export type ReportLineKindRow = {
  line_kind: string;
  amount: string;
};

export type ReportCategoryRow = {
  category: string;
  amount: string;
};

export type ReportMethodRow = {
  method: string;
  amount: string;
};

export type IncomeStatementReport = {
  slug: string;
  org_id: number;
  status: "ok" | "stub" | string;
  report_currency?: string;
  basis?: string;
  period?: { start: string; end: string };
  revenue?: {
    invoices_total: string;
    invoice_count: number;
    by_line_kind: ReportLineKindRow[];
    credit_notes_total: string;
    net_revenue: string;
  };
  expenses?: {
    total: string;
    by_category: ReportCategoryRow[];
  };
  net_income?: string;
};

export type CashFlowReport = {
  slug: string;
  org_id: number;
  status: "ok" | "stub" | string;
  report_currency?: string;
  basis?: string;
  period?: { start: string; end: string };
  cash_in?: {
    total: string;
    payment_count: number;
    by_method: ReportMethodRow[];
  };
  cash_out?: {
    total: string;
    expense_count: number;
    by_category: ReportCategoryRow[];
  };
  net_cash_flow?: string;
};

export type RentRollRow = {
  building_id: number;
  building_name: string;
  unit_id: number;
  unit_number: string;
  tenant_id: number;
  tenant_name: string;
  lease_id: number;
  rent_amount: string;
  rent_currency: string;
  billing_cycle: string;
  lease_start: string;
  lease_end: string | null;
};

export type RentRollReport = {
  slug: string;
  org_id: number;
  status: "ok" | "stub" | string;
  report_currency?: string;
  as_of?: string;
  lease_count?: number;
  total_scheduled_rent?: string;
  rows: RentRollRow[];
};

export type ReportStubPayload = {
  slug: string;
  org_id: number;
  status: "stub";
  rows: unknown[];
  [key: string]: unknown;
};
