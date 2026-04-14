import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { TenantCreate, TenantDto, TenantUpdate } from "@/types/operations";

export type ListTenantsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  tenant_type?: string;
};

export async function listTenants(
  options?: ListTenantsParams,
): Promise<PaginatedResponse<TenantDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<TenantDto>>(
    `/tenants/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      tenant_type: options?.tenant_type,
    })}`,
  );
}

export async function listAllTenants(): Promise<TenantDto[]> {
  const acc: TenantDto[] = [];
  let page = 1;
  while (true) {
    const r = await listTenants({ page, pageSize: 100 });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getTenant(id: number): Promise<TenantDto> {
  return apiRequestAuthed<TenantDto>(`/tenants/${id}/`);
}

export async function createTenant(body: TenantCreate): Promise<TenantDto> {
  return apiRequestAuthed<TenantDto>("/tenants/", { method: "POST", body });
}

export async function updateTenant(
  id: number,
  body: TenantUpdate,
): Promise<TenantDto> {
  return apiRequestAuthed<TenantDto>(`/tenants/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteTenant(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/tenants/${id}/`, { method: "DELETE" });
}
