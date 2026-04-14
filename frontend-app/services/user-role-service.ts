import { apiRequestAuthed } from "@/lib/api/authed-client";
import type { PaginatedResponse } from "@/types/api";
import type { UserRoleDto } from "@/types/operations";

/** Org-scoped staff (same org as X-Org-ID). Used for lease “Managed by”. */
export async function listOrgUserRoles(): Promise<UserRoleDto[]> {
  const r = await apiRequestAuthed<PaginatedResponse<UserRoleDto> | UserRoleDto[]>(
    "/user-roles/",
  );
  return Array.isArray(r) ? r : r.results ?? [];
}
