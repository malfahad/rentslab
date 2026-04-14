/** Stored on lease / service subscription `billing_cycle` (lowercase snake-style values). */
export const BILLING_CYCLES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
] as const;

export const DEFAULT_BILLING_CYCLE = "monthly" as const;
