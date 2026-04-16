import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { PaymentCreate, PaymentDto } from "@/types/billing";

export type ListPaymentsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  tenant?: number;
  lease?: number;
  method?: string;
  lease__unit?: number;
  lease__unit__building?: number;
};

export async function listPayments(
  options?: ListPaymentsParams,
): Promise<PaginatedResponse<PaymentDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<PaymentDto>>(
    `/payments/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      tenant: options?.tenant,
      lease: options?.lease,
      method: options?.method,
      lease__unit: options?.lease__unit,
      lease__unit__building: options?.lease__unit__building,
    })}`,
  );
}

export async function getPayment(id: number): Promise<PaymentDto> {
  return apiRequestAuthed<PaymentDto>(`/payments/${id}/`);
}

export async function createPayment(body: PaymentCreate): Promise<PaymentDto> {
  return apiRequestAuthed<PaymentDto>("/payments/", {
    method: "POST",
    body,
  });
}
