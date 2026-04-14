import { apiRequestAuthed } from "@/lib/api/authed-client";
import { buildQuery } from "@/lib/api/query";
import type { PaginatedResponse } from "@/types/api";
import type { ServiceSubscriptionCreate, ServiceSubscriptionDto } from "@/types/operations";

export type ListServiceSubscriptionsParams = {
  page?: number;
  pageSize?: number;
  lease?: number;
};

export async function listServiceSubscriptions(
  options?: ListServiceSubscriptionsParams,
): Promise<PaginatedResponse<ServiceSubscriptionDto>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  return apiRequestAuthed<PaginatedResponse<ServiceSubscriptionDto>>(
    `/service-subscriptions/${buildQuery({
      page,
      page_size: pageSize,
      lease: options?.lease,
    })}`,
  );
}

export async function createServiceSubscription(
  body: ServiceSubscriptionCreate,
): Promise<ServiceSubscriptionDto> {
  return apiRequestAuthed<ServiceSubscriptionDto>("/service-subscriptions/", {
    method: "POST",
    body,
  });
}

export async function deleteServiceSubscription(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/service-subscriptions/${id}/`, {
    method: "DELETE",
  });
}

/** All subscriptions for a lease (paginates until exhausted). */
export async function listAllSubscriptionsForLease(
  leaseId: number,
): Promise<ServiceSubscriptionDto[]> {
  const acc: ServiceSubscriptionDto[] = [];
  let page = 1;
  while (true) {
    const r = await listServiceSubscriptions({
      page,
      pageSize: 100,
      lease: leaseId,
    });
    acc.push(...r.results);
    if (!r.next) break;
    page += 1;
  }
  return acc;
}
