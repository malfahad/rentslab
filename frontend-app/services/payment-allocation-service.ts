import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { PaymentAllocationDto } from "@/types/billing";

/** All allocations for a payment (paginates until exhausted). */
export async function listAllPaymentAllocationsForPayment(
  paymentId: number,
): Promise<PaymentAllocationDto[]> {
  const acc: PaymentAllocationDto[] = [];
  let page = 1;
  while (true) {
    const r = await apiRequestAuthed<
      PaginatedResponse<PaymentAllocationDto> | PaymentAllocationDto[]
    >(
      `/payment-allocations/${buildQuery({
        page,
        page_size: 100,
        payment: paymentId,
      })}`,
    );
    // Older API responses may be a bare array when pagination is off.
    if (Array.isArray(r)) {
      return r;
    }
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

/** All allocations to an invoice (paginates until exhausted). */
export async function listAllPaymentAllocationsForInvoice(
  invoiceId: number,
): Promise<PaymentAllocationDto[]> {
  const acc: PaymentAllocationDto[] = [];
  let page = 1;
  while (true) {
    const r = await apiRequestAuthed<
      PaginatedResponse<PaymentAllocationDto> | PaymentAllocationDto[]
    >(
      `/payment-allocations/${buildQuery({
        page,
        page_size: 100,
        invoice: invoiceId,
      })}`,
    );
    if (Array.isArray(r)) {
      return r;
    }
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}
