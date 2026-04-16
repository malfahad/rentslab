/** Expenses and categories (API-aligned). */

export type ExpenseCategoryDto = {
  id: number;
  org: number;
  name: string;
  code: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** POST /expense-categories/ */
export type ExpenseCategoryCreate = {
  org: number;
  name: string;
  code?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};

export type ExpenseDto = {
  id: number;
  org: number;
  expense_category: number;
  /** Read-only from API when present. */
  expense_category_name?: string;
  /** Read-only from API when present. */
  expense_category_code?: string;
  expense_number: string;
  expense_date: string;
  amount: string;
  currency_code: string;
  description: string;
  status: string;
  building: number | null;
  /** Read-only from API when present. */
  building_name?: string;
  unit: number | null;
  /** Read-only from API when present. */
  unit_label?: string;
  lease: number | null;
  /** Read-only from API when present. */
  lease_label?: string;
  vendor: number | null;
  /** Read-only from API when present. */
  vendor_name?: string;
  job_order: number | null;
  /** Read-only from API when present. */
  job_order_label?: string;
  payment_method: string;
  reference: string;
  receipt_url: string;
  approved_by: number | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

/** PATCH /expenses/:id/ — partial update. */
export type ExpenseUpdate = Partial<{
  expense_category: number;
  expense_date: string;
  amount: string;
  description: string;
  status: string;
  paid_at: string | null;
  expense_number: string;
  currency_code: string;
  payment_method: string;
  reference: string;
  receipt_url: string;
  building: number | null;
  unit: number | null;
  lease: number | null;
  vendor: number | null;
  job_order: number | null;
}>;

/** POST /expenses/ — `org` must match the current workspace. */
export type ExpenseCreate = {
  org: number;
  expense_category: number;
  expense_date: string;
  amount: string;
  description: string;
  status?: string;
  expense_number?: string;
  currency_code?: string;
  building?: number | null;
  unit?: number | null;
  lease?: number | null;
  vendor?: number | null;
  job_order?: number | null;
  payment_method?: string;
  reference?: string;
  receipt_url?: string;
  paid_at?: string | null;
};
