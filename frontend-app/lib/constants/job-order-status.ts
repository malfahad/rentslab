/** Aligns with backend `job_order.constants.JobOrderStatus`. */

export const JOB_ORDER_STATUSES = [
  "draft",
  "open",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type JobOrderStatusId = (typeof JOB_ORDER_STATUSES)[number];

export const JOB_ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function jobOrderStatusLabel(status: string): string {
  return JOB_ORDER_STATUS_LABELS[status] ?? status;
}

/** Valid one-step transitions from the current status. */
export function allowedNextJobOrderStatuses(
  current: string,
): JobOrderStatusId[] {
  const map: Record<string, JobOrderStatusId[]> = {
    draft: ["open", "cancelled"],
    open: ["in_progress", "completed", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return map[current] ?? [];
}
