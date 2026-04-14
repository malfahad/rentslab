import { apiRequestBearer } from "@/lib/api/bearer-client";
import type { OrgDto } from "@/types/org";

/** All orgs (open API). Prefer {@link listMyOrgs} for org selection after login. */
export async function listOrgs(): Promise<OrgDto[]> {
  return apiRequestBearer<OrgDto[]>("/orgs/");
}

/** Organizations the current user belongs to. Does not require `X-Org-ID`. */
export async function listMyOrgs(): Promise<OrgDto[]> {
  return apiRequestBearer<OrgDto[]>("/auth/me/orgs/");
}

export async function getOrg(id: number): Promise<OrgDto> {
  return apiRequestBearer<OrgDto>(`/orgs/${id}/`);
}
