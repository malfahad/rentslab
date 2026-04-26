import { apiRequestAuthed } from "@/lib/api/authed-client";
import { apiRequest } from "@/lib/api/client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { LeaseCreate, LeaseDto, LeaseUpdate } from "@/types/operations";

export type ListLeasesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  tenant?: number;
  unit?: number;
  status?: string;
};

export async function listLeases(
  options?: ListLeasesParams,
): Promise<PaginatedResponse<LeaseDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<LeaseDto>>(
    `/leases/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      tenant: options?.tenant,
      unit: options?.unit,
      status: options?.status,
    })}`,
  );
}

/** All leases in the org (paginates until exhausted). */
export async function listAllLeases(): Promise<LeaseDto[]> {
  const acc: LeaseDto[] = [];
  let page = 1;
  while (true) {
    const r = await listLeases({ page, pageSize: 100, ordering: "-start_date" });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

/** All leases for a tenant (paginates until exhausted). */
export async function listLeasesForTenant(tenantId: number): Promise<LeaseDto[]> {
  const acc: LeaseDto[] = [];
  let page = 1;
  while (true) {
    const r = await listLeases({ page, pageSize: 100, tenant: tenantId });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getLease(id: number): Promise<LeaseDto> {
  return apiRequestAuthed<LeaseDto>(`/leases/${id}/`);
}

export async function createLease(body: LeaseCreate): Promise<LeaseDto> {
  return apiRequestAuthed<LeaseDto>("/leases/", { method: "POST", body });
}

export async function updateLease(
  id: number,
  body: LeaseUpdate,
): Promise<LeaseDto> {
  return apiRequestAuthed<LeaseDto>(`/leases/${id}/`, {
    method: "PATCH",
    body,
  });
}

/** Soft-close: sets status to closed and end date (default: today). */
export async function closeLease(
  id: number,
  body?: { closing_date?: string },
): Promise<LeaseDto> {
  return apiRequestAuthed<LeaseDto>(`/leases/${id}/close/`, {
    method: "POST",
    body: body ?? {},
  });
}

export async function getPublicLeaseDocument(hashedDocId: string): Promise<unknown> {
  return apiRequest(`/leases/public-docs/${hashedDocId}/`, { cache: "no-store" });
}
