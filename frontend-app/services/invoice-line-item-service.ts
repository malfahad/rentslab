import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { InvoiceLineItemDto } from "@/types/billing";

export type ListInvoiceLineItemsParams = {
  page?: number;
  pageSize?: number;
  invoice?: number;
  ordering?: string;
};

export async function listInvoiceLineItems(
  options?: ListInvoiceLineItemsParams,
): Promise<PaginatedResponse<InvoiceLineItemDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 100;
  return apiRequestAuthed<PaginatedResponse<InvoiceLineItemDto>>(
    `/invoice-line-items/${buildQuery({
      page,
      page_size: pageSize,
      invoice: options?.invoice,
      ordering: options?.ordering ?? "line_number",
    })}`,
  );
}

export async function listAllLineItemsForInvoice(
  invoiceId: number,
): Promise<InvoiceLineItemDto[]> {
  const acc: InvoiceLineItemDto[] = [];
  let page = 1;
  while (true) {
    const r = await listInvoiceLineItems({
      page,
      pageSize: 100,
      invoice: invoiceId,
    });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}
