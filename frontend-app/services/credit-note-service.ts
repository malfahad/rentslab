import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { CreditNoteCreate, CreditNoteDto } from "@/types/billing";

export type ListCreditNotesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  invoice?: number;
  invoice__lease?: number;
  invoice__lease__tenant?: number;
  invoice__lease__unit?: number;
  invoice__lease__unit__building?: number;
};

export async function listCreditNotes(
  options?: ListCreditNotesParams,
): Promise<PaginatedResponse<CreditNoteDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<CreditNoteDto>>(
    `/credit-notes/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      invoice: options?.invoice,
      invoice__lease: options?.invoice__lease,
      invoice__lease__tenant: options?.invoice__lease__tenant,
      invoice__lease__unit: options?.invoice__lease__unit,
      invoice__lease__unit__building: options?.invoice__lease__unit__building,
    })}`,
  );
}

export async function listAllCreditNotesForInvoice(
  invoiceId: number,
): Promise<CreditNoteDto[]> {
  const acc: CreditNoteDto[] = [];
  let page = 1;
  while (true) {
    const r = await listCreditNotes({
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

export async function getCreditNote(id: number): Promise<CreditNoteDto> {
  return apiRequestAuthed<CreditNoteDto>(`/credit-notes/${id}/`);
}

export async function createCreditNote(
  body: CreditNoteCreate,
): Promise<CreditNoteDto> {
  return apiRequestAuthed<CreditNoteDto>("/credit-notes/", {
    method: "POST",
    body,
  });
}
