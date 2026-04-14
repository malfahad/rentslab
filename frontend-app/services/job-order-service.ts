import { apiRequestAuthed } from "@/lib/api/authed-client";
import type { InvoiceLineItemDto } from "@/types/billing";
import type {
  JobOrderCreate,
  JobOrderDto,
  JobOrderUpdate,
} from "@/types/operations";

/** Full job order list for the current org (API returns a JSON array). */
export async function listAllJobOrders(): Promise<JobOrderDto[]> {
  return apiRequestAuthed<JobOrderDto[]>("/job-orders/");
}

export async function getJobOrder(id: number): Promise<JobOrderDto> {
  return apiRequestAuthed<JobOrderDto>(`/job-orders/${id}/`);
}

export async function createJobOrder(body: JobOrderCreate): Promise<JobOrderDto> {
  return apiRequestAuthed<JobOrderDto>("/job-orders/", {
    method: "POST",
    body,
  });
}

export async function updateJobOrder(
  id: number,
  body: JobOrderUpdate,
): Promise<JobOrderDto> {
  return apiRequestAuthed<JobOrderDto>(`/job-orders/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteJobOrder(id: number): Promise<void> {
  await apiRequestAuthed<unknown>(`/job-orders/${id}/`, { method: "DELETE" });
}

export type JobOrderRechargeBody = {
  invoice: number;
  amount: string;
  description: string;
};

/** POST /job-orders/:id/recharge/ — tenant invoice line (job_recharge). */
export async function rechargeJobOrder(
  jobOrderId: number,
  body: JobOrderRechargeBody,
): Promise<InvoiceLineItemDto> {
  return apiRequestAuthed<InvoiceLineItemDto>(
    `/job-orders/${jobOrderId}/recharge/`,
    {
      method: "POST",
      body,
    },
  );
}
