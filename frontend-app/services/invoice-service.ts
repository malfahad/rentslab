import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { InvoiceDto, IssueInvoicesResultDto } from "@/types/billing";

export type ListInvoicesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  status?: string;
  lease?: number;
  /** Filter invoices whose lease belongs to this tenant */
  lease__tenant?: number;
};

export async function listInvoices(
  options?: ListInvoicesParams,
): Promise<PaginatedResponse<InvoiceDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<InvoiceDto>>(
    `/invoices/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      status: options?.status,
      lease: options?.lease,
      lease__tenant: options?.lease__tenant,
    })}`,
  );
}

/** All invoices for a tenant (paginates until exhausted). */
export async function listAllInvoicesForTenant(
  tenantId: number,
  options?: { status?: string },
): Promise<InvoiceDto[]> {
  const acc: InvoiceDto[] = [];
  let page = 1;
  while (true) {
    const r = await listInvoices({
      page,
      pageSize: 100,
      lease__tenant: tenantId,
      status: options?.status,
      ordering: "-issue_date",
    });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getInvoice(id: number): Promise<InvoiceDto> {
  return apiRequestAuthed<InvoiceDto>(`/invoices/${id}/`);
}

/** All invoices for a lease (paginates until exhausted). */
export async function listAllInvoicesForLease(
  leaseId: number,
  options?: { status?: string },
): Promise<InvoiceDto[]> {
  const acc: InvoiceDto[] = [];
  let page = 1;
  while (true) {
    const r = await listInvoices({
      page,
      pageSize: 100,
      lease: leaseId,
      status: options?.status,
      ordering: "-issue_date",
    });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export type IssueInvoicesBody = {
  as_of?: string;
  dry_run?: boolean;
};

export async function issueInvoices(
  body?: IssueInvoicesBody,
): Promise<IssueInvoicesResultDto> {
  return apiRequestAuthed<IssueInvoicesResultDto>("/invoices/issue/", {
    method: "POST",
    body: body ?? {},
  });
}
