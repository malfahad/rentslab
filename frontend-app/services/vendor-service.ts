import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type {
  VendorCreate,
  VendorDto,
  VendorUpdate,
} from "@/types/operations";

export type ListVendorsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  city?: string;
  region?: string;
  country_code?: string;
  is_active?: boolean;
};

export async function listVendors(
  options?: ListVendorsParams,
): Promise<PaginatedResponse<VendorDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<VendorDto>>(
    `/vendors/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      city: options?.city,
      region: options?.region,
      country_code: options?.country_code,
      is_active: options?.is_active,
    })}`,
  );
}

/** All pages — for dropdowns and filters (bounded by API max page size per request). */
export async function listAllVendors(): Promise<VendorDto[]> {
  const acc: VendorDto[] = [];
  let page = 1;
  while (true) {
    const r = await listVendors({ page, pageSize: 100 });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getVendor(id: number): Promise<VendorDto> {
  return apiRequestAuthed<VendorDto>(`/vendors/${id}/`);
}

export async function createVendor(body: VendorCreate): Promise<VendorDto> {
  return apiRequestAuthed<VendorDto>("/vendors/", {
    method: "POST",
    body,
  });
}

export async function updateVendor(
  id: number,
  body: VendorUpdate,
): Promise<VendorDto> {
  return apiRequestAuthed<VendorDto>(`/vendors/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteVendor(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/vendors/${id}/`, { method: "DELETE" });
}
