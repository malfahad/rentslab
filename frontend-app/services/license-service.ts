import { apiRequestAuthed } from "@/lib/api/authed-client";
import type { LicenseSummaryDto } from "@/types/license";

export async function getLicenseSummary(): Promise<LicenseSummaryDto> {
  return apiRequestAuthed<LicenseSummaryDto>("/license-payments/summary/");
}
