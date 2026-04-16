"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getExpense, updateExpense } from "@/services/expense-service";
import type { ExpenseDto } from "@/types/expense";

function formatDate(iso: string): string {
  try {
    return new Date(iso + (iso.includes("T") ? "" : "T12:00:00")).toLocaleDateString(
      undefined,
      { dateStyle: "long" },
    );
  } catch {
    return iso;
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadgeClass(s: string): string {
  const t = s.trim().toLowerCase();
  if (t === "paid") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
  }
  if (t === "approved") {
    return "bg-blue-50 text-blue-900 ring-1 ring-blue-200";
  }
  if (t === "draft") {
    return "bg-slate-50 text-slate-800 ring-1 ring-slate-200";
  }
  if (t === "void") {
    return "bg-red-50 text-red-900 ring-1 ring-red-200";
  }
  return "bg-[#F3F4F6] text-[#374151] ring-1 ring-[#E5E7EB]";
}

type StatusKey = "draft" | "approved" | "paid" | "void" | string;

function normalizeStatus(s: string): StatusKey {
  return s.trim().toLowerCase();
}

function sectionTitle(text: string) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
      {text}
    </h2>
  );
}

function dlRow(label: string, value: ReactNode) {
  return (
    <div>
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 font-medium text-[#1A1A1A]">{value}</dd>
    </div>
  );
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [ex, setEx] = useState<ExpenseDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid expense.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      setEx(await getExpense(id));
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load expense.",
      );
      setEx(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  const applyStatus = useCallback(
    async (next: "approved" | "paid" | "void" | "draft") => {
      if (!ex) return;
      if (next === "void") {
        const ok = window.confirm(
          "Void this expense? You can restore it to draft afterward if needed.",
        );
        if (!ok) return;
      }
      if (next === "draft") {
        const ok = window.confirm(
          "Restore this expense to draft? Status will be set to draft; review paid date if applicable.",
        );
        if (!ok) return;
      }
      setStatusPending(true);
      setStatusError(null);
      try {
        const body: {
          status: string;
          paid_at?: string | null;
        } = { status: next };
        if (next === "paid") {
          body.paid_at = new Date().toISOString();
        }
        if (next === "draft") {
          body.paid_at = null;
        }
        const updated = await updateExpense(ex.id, body);
        setEx(updated);
      } catch (e) {
        setStatusError(
          e instanceof ApiError ? e.messageForUser : "Could not update status.",
        );
      } finally {
        setStatusPending(false);
      }
    },
    [ex],
  );

  if (!orgReady) {
    return (
      <DashboardDetailView
        backHref="/dashboard/expenses"
        backLabel="Back to expenses"
        title="Expense"
        suggestedActions={null}
      >
        <p className="text-sm text-[#6B7280]">Preparing workspace…</p>
      </DashboardDetailView>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  const title =
    loading || !ex
      ? "Expense"
      : ex.expense_number?.trim() || `Expense #${ex.id}`;

  const st = ex ? normalizeStatus(ex.status) : "";

  const suggestedActions =
    ex && !loading ? (
      <>
        <Link
          href={`/dashboard/expenses/${ex.id}/edit`}
          className="btn-primary w-full"
        >
          Edit expense
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Status
          </p>
          {statusError ? (
            <p className="mt-2 text-sm text-red-800">{statusError}</p>
          ) : null}
          <div className="mt-2 space-y-2">
            {st === "draft" ? (
              <>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={statusPending}
                  onClick={() => void applyStatus("approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={statusPending}
                  onClick={() => void applyStatus("paid")}
                >
                  Mark as paid
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full text-[#B91C1C] hover:bg-red-50"
                  disabled={statusPending}
                  onClick={() => void applyStatus("void")}
                >
                  Void
                </button>
              </>
            ) : null}
            {st === "approved" ? (
              <>
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={statusPending}
                  onClick={() => void applyStatus("paid")}
                >
                  Mark as paid
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full text-[#B91C1C] hover:bg-red-50"
                  disabled={statusPending}
                  onClick={() => void applyStatus("void")}
                >
                  Void
                </button>
              </>
            ) : null}
            {st === "paid" ? (
              <button
                type="button"
                className="btn-secondary w-full text-[#B91C1C] hover:bg-red-50"
                disabled={statusPending}
                onClick={() => void applyStatus("void")}
              >
                Void
              </button>
            ) : null}
            {st === "void" ? (
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={statusPending}
                onClick={() => void applyStatus("draft")}
              >
                Restore to draft
              </button>
            ) : null}
            {st !== "draft" &&
            st !== "approved" &&
            st !== "paid" &&
            st !== "void" ? (
              <p className="text-sm text-[#6B7280]">
                Status is &quot;{ex.status}&quot;. Use the API for custom
                transitions.
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Quick links
          </p>
          <div className="mt-2 space-y-2">
            <Link
              href="/dashboard/expenses/create"
              className="btn-secondary block w-full text-center"
            >
              Record another expense
            </Link>
            {ex.lease != null ? (
              <Link
                href={`/dashboard/leases/${ex.lease}`}
                className="btn-primary block w-full text-center"
              >
                View lease
              </Link>
            ) : null}
            {ex.building != null ? (
              <Link
                href={`/dashboard/buildings/${ex.building}`}
                className="btn-secondary block w-full text-center"
              >
                View building
              </Link>
            ) : null}
            {ex.unit != null ? (
              <Link
                href={`/dashboard/units/${ex.unit}`}
                className="btn-secondary block w-full text-center"
              >
                View unit
              </Link>
            ) : null}
            {ex.vendor != null ? (
              <Link
                href={`/dashboard/vendors/${ex.vendor}`}
                className="btn-secondary block w-full text-center"
              >
                View vendor
              </Link>
            ) : null}
            {ex.job_order != null ? (
              <Link
                href={`/dashboard/job-orders/${ex.job_order}`}
                className="btn-secondary block w-full text-center"
              >
                View job order
              </Link>
            ) : null}
          </div>
        </div>
      </>
    ) : null;

  const amountDisplay =
    ex != null
      ? `${ex.amount}${ex.currency_code?.trim() ? ` ${ex.currency_code.trim()}` : ""}`
      : "";

  return (
    <DashboardDetailView
      backHref="/dashboard/expenses"
      backLabel="Back to expenses"
      title={title}
      subtitle={
        loading
          ? "Loading…"
          : ex
            ? `${formatDate(ex.expense_date)} · ${amountDisplay}`
            : undefined
      }
      suggestedActions={suggestedActions}
    >
      {loadError ? (
        <p className="text-sm text-red-800">{loadError}</p>
      ) : null}
      {!loadError && ex ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            {sectionTitle("Summary")}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-semibold tabular-nums text-brand-navy">
                  {amountDisplay || ex.amount}
                </p>
                {ex.expense_number?.trim() ? (
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {ex.expense_number.trim()}
                  </p>
                ) : null}
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(ex.status)}`}
              >
                {ex.status}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {dlRow("Expense date", formatDate(ex.expense_date))}
              {dlRow(
                "Organization",
                <span className="font-mono text-[#374151]">#{ex.org}</span>,
              )}
            </dl>
            <div className="mt-4 border-t border-[#F3F4F6] pt-4">
              <p className="text-xs font-medium uppercase text-[#6B7280]">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1A1A1A]">
                {ex.description?.trim() || "—"}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            {sectionTitle("Classification")}
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {dlRow(
                "Category",
                <span>
                  {ex.expense_category_name?.trim() ||
                    `Category #${ex.expense_category}`}
                  {ex.expense_category_code?.trim() ? (
                    <span className="ml-2 font-mono text-[#6B7280]">
                      ({ex.expense_category_code.trim()})
                    </span>
                  ) : null}
                </span>,
              )}
              {dlRow(
                "Category ID",
                <span className="font-mono text-[#374151]">
                  #{ex.expense_category}
                </span>,
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            {sectionTitle("Location & relationships")}
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {dlRow(
                "Building",
                ex.building != null ? (
                  <Link
                    href={`/dashboard/buildings/${ex.building}`}
                    className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                  >
                    {ex.building_name?.trim() || `Building #${ex.building}`}
                  </Link>
                ) : (
                  "—"
                ),
              )}
              {ex.building != null
                ? dlRow(
                    "Building ID",
                    <span className="font-mono text-[#374151]">
                      #{ex.building}
                    </span>,
                  )
                : null}
              {ex.unit != null
                ? dlRow(
                    "Unit",
                    <span>
                      <Link
                        href={`/dashboard/units/${ex.unit}`}
                        className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                      >
                        {ex.unit_label?.trim() || `Unit #${ex.unit}`}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-[#9CA3AF]">
                        #{ex.unit}
                      </span>
                    </span>,
                  )
                : null}
              {ex.lease != null
                ? dlRow(
                    "Lease",
                    <span>
                      <Link
                        href={`/dashboard/leases/${ex.lease}`}
                        className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                      >
                        {ex.lease_label?.trim() || `Lease #${ex.lease}`}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-[#9CA3AF]">
                        #{ex.lease}
                      </span>
                    </span>,
                  )
                : null}
              {ex.vendor != null
                ? dlRow(
                    "Vendor",
                    <span>
                      <Link
                        href={`/dashboard/vendors/${ex.vendor}`}
                        className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                      >
                        {ex.vendor_name?.trim() || `Vendor #${ex.vendor}`}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-[#9CA3AF]">
                        #{ex.vendor}
                      </span>
                    </span>,
                  )
                : null}
              {ex.job_order != null
                ? dlRow(
                    "Job order",
                    <span>
                      <Link
                        href={`/dashboard/job-orders/${ex.job_order}`}
                        className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                      >
                        {ex.job_order_label?.trim() ||
                          `Job order #${ex.job_order}`}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-[#9CA3AF]">
                        #{ex.job_order}
                      </span>
                    </span>,
                  )
                : null}
            </dl>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            {sectionTitle("Payment & documentation")}
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {ex.payment_method?.trim()
                ? dlRow(
                    "Payment method",
                    <span className="capitalize">{ex.payment_method}</span>,
                  )
                : dlRow("Payment method", "—")}
              {ex.reference?.trim()
                ? dlRow("Reference", ex.reference.trim())
                : dlRow("Reference", "—")}
              {ex.receipt_url?.trim() ? (
                <div className="sm:col-span-2">
                  <dt className="text-[#6B7280]">Receipt</dt>
                  <dd className="mt-0.5">
                    <a
                      href={ex.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-medium text-brand-blue hover:text-brand-navy hover:underline"
                    >
                      Open receipt link
                    </a>
                    <p className="mt-1 break-all font-mono text-xs text-[#6B7280]">
                      {ex.receipt_url}
                    </p>
                  </dd>
                </div>
              ) : (
                dlRow("Receipt", "—")
              )}
              {dlRow("Paid at", formatWhen(ex.paid_at))}
            </dl>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            {sectionTitle("Record")}
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {dlRow(
                "Approved by",
                ex.approved_by != null ? (
                  <span className="font-mono text-[#374151]">
                    User #{ex.approved_by}
                  </span>
                ) : (
                  "—"
                ),
              )}
              {dlRow("Created", formatWhen(ex.created_at))}
              {dlRow("Updated", formatWhen(ex.updated_at))}
            </dl>
          </section>
        </div>
      ) : null}
    </DashboardDetailView>
  );
}
