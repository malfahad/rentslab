export type LicenseCycleDto = {
  id: number;
  mode: "monthly" | "yearly";
  status: "upcoming" | "due" | "paid" | "void";
  cycle_year: number;
  cycle_month: number | null;
  period_start: string;
  period_end: string;
  units_count: number;
  unit_price: string;
  amount_due: string;
  credit_balance: string;
  tenant_id: number | null;
  tenant_name: string;
};

export type LicenseSummaryDto = {
  org_id: number;
  registered_on: string;
  rates: {
    monthly_per_unit: string;
    yearly_per_unit: string;
  };
  units_count: number;
  credit_balance: string;
  upcoming: LicenseCycleDto | null;
  due: LicenseCycleDto | null;
  previous_cycles: LicenseCycleDto[];
};
