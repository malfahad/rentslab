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

export type OrgUpdatePayload = Partial<
  Pick<
    OrgDto,
    | "name"
    | "legal_name"
    | "business_registration_number"
    | "tax_id"
    | "email"
    | "phone"
    | "website"
    | "logo_url"
    | "tagline"
    | "timezone"
    | "language"
    | "locale"
    | "default_currency"
    | "address_line1"
    | "address_line2"
    | "city"
    | "region"
    | "postal_code"
    | "country_code"
    | "sms_notifications_enabled"
  >
>;

export async function updateOrg(id: number, payload: OrgUpdatePayload): Promise<OrgDto> {
  return apiRequestBearer<OrgDto>(`/orgs/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}
