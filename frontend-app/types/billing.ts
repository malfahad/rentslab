/** Invoices, credit notes, payments, and invoice line items (API-aligned). */

export type InvoiceDto = {
  id: number;
  public_doc_id?: string;
  lease: number;
  org: number | null;
  tenant_name?: string;
  lease_label?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: string;
  outstanding_amount: string;
  status: string;
  bill_to_name: string;
  bill_to_address_line1: string;
  bill_to_address_line2: string;
  bill_to_city: string;
  bill_to_region: string;
  bill_to_postal_code: string;
  bill_to_country_code: string;
  bill_to_tax_id: string;
  issue_kind?: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceLineItemDto = {
  id: number;
  invoice: number;
  line_number: number;
  description: string;
  amount: string;
  service: number | null;
  service_name?: string | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  line_kind?: string;
  job_order?: number | null;
  created_at: string;
};

export type IssueInvoicesResultDto = {
  created_invoices: number[];
  created_count: number;
  skipped_leases: number[];
  truncated_lease_ids: number[];
  errors: string[];
  dry_run: boolean;
  would_create_count: number;
};

export type CreditNoteDto = {
  id: number;
  invoice: number;
  invoice_number?: string;
  invoice_lease?: number;
  amount: string;
  reason: string;
  credit_date: string;
  created_at: string;
  created_by: number | null;
};

/** POST /credit-notes/ (create). */
export type CreditNoteCreate = {
  invoice: number;
  amount: string;
  reason?: string;
  credit_date: string;
};

/** POST /payments/ (create) — org is set by the server from workspace context. */
export type PaymentCreate = {
  tenant: number;
  lease?: number | null;
  amount: string;
  method: string;
  reference?: string;
  payment_date: string;
  allocations?: { invoice: number; amount_applied: string }[];
  payer_name?: string;
  payer_type?: string;
  payer_email?: string;
  payer_phone?: string;
  payer_address_line1?: string;
  payer_address_line2?: string;
  payer_city?: string;
  payer_region?: string;
  payer_postal_code?: string;
  payer_country_code?: string;
};

export type PaymentDto = {
  id: number;
  public_receipt_id?: string;
  org: number;
  tenant: number;
  tenant_name?: string;
  lease: number | null;
  amount: string;
  method: string;
  reference: string;
  payment_date: string;
  payer_name: string;
  payer_type: string;
  payer_email: string;
  payer_phone: string;
  payer_address_line1: string;
  payer_address_line2: string;
  payer_city: string;
  payer_region: string;
  payer_postal_code: string;
  payer_country_code: string;
  created_at: string;
  updated_at: string;
};

export type PaymentAllocationDto = {
  id: number;
  payment: number;
  invoice: number;
  amount_applied: string;
  invoice_number?: string;
  invoice_total_amount?: string;
  invoice_status?: string;
  created_at: string;
};

export type PublicReceiptRowDto = {
  item: string;
  timestamp: string;
  quantity: string;
  sales_ugx: string;
};

export type PublicReceiptInvoiceLineBreakdownDto = {
  line_item_id: number | null;
  line_number: number;
  description: string;
  line_kind: "rent" | "subscription";
  billing_period_start: string | null;
  billing_period_end: string | null;
  base_amount_ugx: string;
  allocated_amount_ugx: string;
};

export type PublicReceiptInvoiceBreakdownDto = {
  invoice_id: number;
  invoice_number: string;
  invoice_total_ugx: string;
  allocated_amount_ugx: string;
  allocated_rent_ugx: string;
  allocated_subscription_ugx: string;
  line_items: PublicReceiptInvoiceLineBreakdownDto[];
};

export type PublicReceiptDto = {
  receipt_id: string;
  payment_id: number;
  date_time: string;
  issued_date_time: string;
  org: {
    location: string;
    name: string;
    address: string;
    telephone: string;
  };
  landlord: {
    name: string;
    contact: string;
  };
  building: {
    name: string;
    address: string;
  };
  title: string;
  subtitle: string;
  page: {
    current: number;
    total: number;
  };
  operator_name: string;
  rows: PublicReceiptRowDto[];
  subtotal_ugx: string;
  grand_total_ugx: string;
  footer_reference: string;
  tenant_name: string;
  tenant_contact: string;
  unit_number: string;
  period_start: string | null;
  period_end: string | null;
  rent_amount_ugx: string;
  subscription_charge_ugx: string;
  status: "paid_in_full" | "partial";
  balance_due_ugx: string;
  notes: string;
  issued_by: string;
  invoice_breakdown: PublicReceiptInvoiceBreakdownDto[];
  reference: string;
  method: string;
};
