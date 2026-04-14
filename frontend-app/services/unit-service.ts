import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { UnitCreate, UnitDto, UnitUpdate } from "@/types/portfolio";

export type ListUnitsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  status?: string;
  unit_type?: string;
  building?: number;
  /** Exclude units with an active lease and units in maintenance (for new leases). */
  available_for_lease?: boolean;
};

export async function listUnits(
  options?: ListUnitsParams,
): Promise<PaginatedResponse<UnitDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<UnitDto>>(
    `/units/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      status: options?.status,
      unit_type: options?.unit_type,
      building: options?.building,
      available_for_lease: options?.available_for_lease === true ? true : undefined,
    })}`,
  );
}

export async function listAllUnits(): Promise<UnitDto[]> {
  const acc: UnitDto[] = [];
  let page = 1;
  while (true) {
    const r = await listUnits({ page, pageSize: 100 });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getUnit(id: number): Promise<UnitDto> {
  return apiRequestAuthed<UnitDto>(`/units/${id}/`);
}

export async function createUnit(body: UnitCreate): Promise<UnitDto> {
  return apiRequestAuthed<UnitDto>("/units/", {
    method: "POST",
    body,
  });
}

export async function updateUnit(id: number, body: UnitUpdate): Promise<UnitDto> {
  return apiRequestAuthed<UnitDto>(`/units/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteUnit(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/units/${id}/`, { method: "DELETE" });
}
