import { apiRequestAuthed } from "@/lib/api/authed-client";
import type { PaginatedResponse } from "@/types/api";
import type { ServiceCreate, ServiceDto } from "@/types/operations";

export async function listOrgServices(): Promise<ServiceDto[]> {
  const r = await apiRequestAuthed<PaginatedResponse<ServiceDto> | ServiceDto[]>(
    "/services/",
  );
  const rows = Array.isArray(r) ? r : r.results ?? [];
  return rows.filter((s) => s.is_active);
}

/** All services for the org (including inactive), for admin lists. */
export async function listOrgServicesAll(): Promise<ServiceDto[]> {
  const r = await apiRequestAuthed<PaginatedResponse<ServiceDto> | ServiceDto[]>(
    "/services/",
  );
  return Array.isArray(r) ? r : r.results ?? [];
}

export async function createService(body: ServiceCreate): Promise<ServiceDto> {
  return apiRequestAuthed<ServiceDto>("/services/", { method: "POST", body });
}
