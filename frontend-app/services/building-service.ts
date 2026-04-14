import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type {
  BuildingCreate,
  BuildingDto,
  BuildingUpdate,
} from "@/types/portfolio";

export type ListBuildingsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  city?: string;
  building_type?: string;
  landlord?: number;
};

export async function listBuildings(
  options?: ListBuildingsParams,
): Promise<PaginatedResponse<BuildingDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 24;
  return apiRequestAuthed<PaginatedResponse<BuildingDto>>(
    `/buildings/${buildQuery({
      page,
      page_size: pageSize,
      search: options?.search,
      ordering: options?.ordering,
      city: options?.city,
      building_type: options?.building_type,
      landlord: options?.landlord,
    })}`,
  );
}

export async function listAllBuildings(): Promise<BuildingDto[]> {
  const acc: BuildingDto[] = [];
  let page = 1;
  while (true) {
    const r = await listBuildings({ page, pageSize: 100 });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}

export async function getBuilding(id: number): Promise<BuildingDto> {
  return apiRequestAuthed<BuildingDto>(`/buildings/${id}/`);
}

export async function createBuilding(body: BuildingCreate): Promise<BuildingDto> {
  return apiRequestAuthed<BuildingDto>("/buildings/", {
    method: "POST",
    body,
  });
}

export async function updateBuilding(
  id: number,
  body: BuildingUpdate,
): Promise<BuildingDto> {
  return apiRequestAuthed<BuildingDto>(`/buildings/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteBuilding(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/buildings/${id}/`, { method: "DELETE" });
}
