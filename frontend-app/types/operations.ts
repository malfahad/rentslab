import type { JsonObject } from "@/types/portfolio";

export type TenantType = "individual" | "company";

export type TenantDto = {
  id: number;
  org: number;
  name: string;
  tenant_type: TenantType;
  /** Present on list/detail from API (lease count). */
  leases_count?: number;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  company_registration_number: string;
  tax_id: string;
  contact_info: JsonObject | null;
  kyc_info: JsonObject | null;
  created_at: string;
  updated_at: string;
};

export type TenantCreate = {
  org: number;
  name: string;
  tenant_type?: TenantType;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code?: string;
  company_registration_number?: string;
  tax_id?: string;
};

export type TenantUpdate = Partial<{
  name: string;
  tenant_type: TenantType;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  company_registration_number: string;
  tax_id: string;
}>;

export type LeaseDto = {
  id: number;
  public_doc_id?: string;
  unit: number;
  tenant: number;
  /** Read-only labels from API when present. */
  unit_label?: string;
  building_name?: string;
  landlord_name?: string;
  landlord_phone?: string;
  landlord_email?: string;
  landlord_address?: string;
  tenant_name?: string;
  managed_by_name?: string | null;
  managed_by: number | null;
  start_date: string;
  end_date: string | null;
  rent_amount: string;
  rent_currency: string;
  deposit_amount: string | null;
  deposit_currency: string;
  billing_cycle: string;
  status: string;
  billing_same_as_tenant_address: boolean;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_region: string;
  billing_postal_code: string;
  billing_country_code: string;
  external_reference: string;
  created_at: string;
  updated_at: string;
};

export type LeaseUpdate = Partial<{
  unit: number;
  tenant: number;
  managed_by: number | null;
  start_date: string;
  end_date: string | null;
  rent_amount: string;
  rent_currency: string;
  deposit_amount: string | null;
  deposit_currency: string;
  billing_cycle: string;
  status: string;
  billing_same_as_tenant_address: boolean;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_region: string;
  billing_postal_code: string;
  billing_country_code: string;
  external_reference: string;
}>;

export type LeaseCreate = {
  unit: number;
  tenant: number;
  managed_by?: number | null;
  start_date: string;
  end_date?: string | null;
  rent_amount: string;
  rent_currency?: string;
  deposit_amount?: string | null;
  deposit_currency?: string;
  billing_cycle?: string;
  status?: string;
  billing_same_as_tenant_address?: boolean;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_region?: string;
  billing_postal_code?: string;
  billing_country_code?: string;
};

export type ServiceDto = {
  id: number;
  org: number;
  name: string;
  billing_type: string;
  /** ISO 4217; default billing currency for subscriptions. */
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceCreate = {
  org: number;
  name: string;
  billing_type?: string;
  currency?: string;
  is_active?: boolean;
};

export type ServiceSubscriptionDto = {
  id: number;
  lease: number;
  service: number;
  service_name?: string;
  rate: string;
  /** ISO 4217 for the rate amount. */
  currency: string;
  billing_cycle: string;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceSubscriptionCreate = {
  lease: number;
  service: number;
  rate: string;
  currency?: string;
  billing_cycle?: string;
};

export type UserRoleDto = {
  id: number;
  user: number;
  user_label: string;
  org: number;
  role_definition: number;
  role: number | null;
  role_key: string;
  created_at: string;
  updated_at: string;
};

/** Vendor row (API serializer). */
export type VendorDto = {
  id: number;
  org: number;
  name: string;
  vendor_type: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  tax_id: string;
  payment_terms: string;
  bank_details: JsonObject | null;
  contact_info: JsonObject | null;
  is_active: boolean;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

export type VendorCreate = {
  org: number;
  name: string;
  vendor_type?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code?: string;
  tax_id?: string;
  payment_terms?: string;
  bank_details?: JsonObject | null;
  contact_info?: JsonObject | null;
  is_active?: boolean;
  internal_notes?: string;
};

export type VendorUpdate = Partial<
  Omit<VendorDto, "id" | "org" | "created_at" | "updated_at">
>;

/** Work order / maintenance job (API-aligned). */
export type JobOrderDto = {
  id: number;
  org: number;
  job_number: string;
  building: number;
  unit: number | null;
  vendor: number | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  reported_at: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  completed_at: string | null;
  estimated_cost: string | null;
  actual_cost: string | null;
  reported_by: number | null;
  external_reference: string;
  created_at: string;
  updated_at: string;
};

export type JobOrderCreate = {
  org: number;
  building: number;
  unit?: number | null;
  vendor?: number | null;
  title: string;
  description?: string;
  /** Omit to auto-generate (e.g. JO-{org}-00001). */
  job_number?: string;
  status?: string;
  priority?: string;
  reported_at?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  estimated_cost?: string | null;
  external_reference?: string;
};

export type JobOrderUpdate = Partial<
  Omit<
    JobOrderDto,
    "id" | "org" | "created_at" | "updated_at" | "actual_cost" | "completed_at"
  >
>;
