import { apiRequest } from "@/lib/api/client";
import { apiRequestAuthed } from "@/lib/api/authed-client";
import type { PaginatedResponse } from "@/types/api";
import type {
  PaymentCodeUnitDetailDto,
  PaymentCodeUnitDto,
  PublicPaymentLinkDto,
} from "@/types/payment-links";

export async function listPaymentCodeUnits(
  page = 1,
  pageSize = 50,
): Promise<PaginatedResponse<PaymentCodeUnitDto>> {
  return apiRequestAuthed<PaginatedResponse<PaymentCodeUnitDto>>(
    `/payment-links/units/?page=${page}&page_size=${pageSize}`,
  );
}

export async function getPaymentCodeUnitDetail(id: number): Promise<PaymentCodeUnitDetailDto> {
  return apiRequestAuthed<PaymentCodeUnitDetailDto>(`/payment-links/units/${id}/detail/`);
}

export async function deactivatePaymentLink(id: number): Promise<void> {
  await apiRequestAuthed(`/payment-links/units/${id}/deactivate-link/`, { method: "POST" });
}

export async function activatePaymentLink(id: number): Promise<void> {
  await apiRequestAuthed(`/payment-links/units/${id}/activate-link/`, { method: "POST" });
}

export async function getPublicPaymentLink(slug: string): Promise<PublicPaymentLinkDto> {
  return apiRequest<PublicPaymentLinkDto>(`/payment-links/public/${slug}/`, {
    cache: "no-store",
  });
}

export async function createPublicPaymentAttempt(
  slug: string,
  payload: {
    invoice_id: number;
    amount: string;
    payer_name: string;
    payer_email: string;
    payer_phone?: string;
    payment_method: string;
  },
): Promise<{ id: number; status: string; provider_ref: string; message: string }> {
  return apiRequest(`/payment-links/public/${slug}/`, { method: "POST", body: payload });
}
