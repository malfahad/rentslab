export type PaymentCodeUnitDto = {
  id: number;
  unit_number: string;
  building_name: string;
  status: string;
  payment_code: string;
  payment_code_status: "active" | "inactive" | "suspended";
  active_tenant_name: string;
  outstanding_balance: string;
};

export type PaymentCodeUnitDetailDto = {
  unit: PaymentCodeUnitDto;
  payment_link: {
    id: number;
    slug: string;
    is_active: boolean;
    expires_at: string | null;
    public_url: string;
  };
  active_lease: {
    id: number;
    tenant_name: string;
    start_date: string;
    end_date: string | null;
    status: string;
  } | null;
  invoices: Array<{
    id: number;
    invoice_number: string;
    due_date: string;
    total_amount: string;
    outstanding_amount: string;
    status: string;
  }>;
  payments: Array<{
    id: number;
    invoice: number;
    invoice_number: string;
    amount: string;
    status: string;
    payer_name: string;
    payer_email: string;
    payer_phone: string;
    payment_method: string;
    provider_ref: string;
    created_at: string;
    updated_at: string;
  }>;
};

export type PublicPaymentLinkDto = {
  payment_code: string;
  property_name: string;
  unit_number: string;
  tenant_name: string;
  lease_id: number | null;
  invoices: Array<{
    id: number;
    invoice_number: string;
    due_date: string;
    total_amount: string;
    outstanding_amount: string;
    status: string;
  }>;
};
