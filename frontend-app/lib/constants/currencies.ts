/** Common ISO 4217 codes for rent / billing (extend as needed). */
export const RENT_CURRENCIES = [
  { code: "USD", label: "USD — US dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British pound" },
  { code: "KES", label: "KES — Kenyan shilling" },
  { code: "NGN", label: "NGN — Nigerian naira" },
  { code: "ZAR", label: "ZAR — South African rand" },
  { code: "UGX", label: "UGX — Ugandan shilling" },
  { code: "TZS", label: "TZS — Tanzanian shilling" },
  { code: "GHS", label: "GHS — Ghanaian cedi" },
  { code: "AED", label: "AED — UAE dirham" },
] as const;
