import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { LandlordCreate, LandlordDto, LandlordUpdate } from "@/types/portfolio";

export type ListLandlordsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  city?: string;
  region?: string;
  country_code?: string;
};

export async function listLandlords(
  options?: ListLandlordsParams,
): Promise<PaginatedResponse<LandlordDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<LandlordDto>>(
    `/landlords/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      city: options?.city,
      region: options?.region,
      country_code: options?.country_code,
    })}`,
  );
}

/** All pages — for dropdowns and filters (bounded by API max page size per request). */
export async function listAllLandlords(): Promise<LandlordDto[]> {
  const acc: LandlordDto[] = [];
  let page = 1;
  while (true) {
    const r = await listLandlords({ page, pageSize: 100 });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getLandlord(id: number): Promise<LandlordDto> {
  return apiRequestAuthed<LandlordDto>(`/landlords/${id}/`);
}

export async function createLandlord(body: LandlordCreate): Promise<LandlordDto> {
  return apiRequestAuthed<LandlordDto>("/landlords/", {
    method: "POST",
    body,
  });
}

export async function updateLandlord(
  id: number,
  body: LandlordUpdate,
): Promise<LandlordDto> {
  return apiRequestAuthed<LandlordDto>(`/landlords/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteLandlord(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/landlords/${id}/`, { method: "DELETE" });
}
