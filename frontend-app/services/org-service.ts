import { apiRequestBearer } from "@/lib/api/bearer-client";
import type { OrgDto } from "@/types/org";

export async function listOrgs(): Promise<OrgDto[]> {
  return apiRequestBearer<OrgDto[]>("/orgs/");
}

export async function getOrg(id: number): Promise<OrgDto> {
  return apiRequestBearer<OrgDto>(`/orgs/${id}/`);
}
