"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardDetailView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getExpense, updateExpense } from "@/services/expense-service";
import type { ExpenseDto } from "@/types/expense";

function formatDate(iso: string): string {
  try {
    return new Date(iso + (iso.includes("T") ? "" : "T12:00:00")).toLocaleDateString();
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

type StatusKey = "draft" | "approved" | "paid" | "void" | string;

function normalizeStatus(s: string): StatusKey {
  return s.trim().toLowerCase();
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
          </div>
        </div>
      </>
    ) : null;

  return (
    <DashboardDetailView
      backHref="/dashboard/expenses"
      backLabel="Back to expenses"
      title={title}
      subtitle={
        loading
          ? "Loading…"
          : ex
            ? `${formatDate(ex.expense_date)} · ${ex.amount} · ${ex.status}`
            : undefined
      }
      suggestedActions={suggestedActions}
    >
      {loadError ? (
        <p className="text-sm text-red-800">{loadError}</p>
      ) : null}
      {!loadError && ex ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-[#6B7280]">
              Description
            </dt>
            <dd className="mt-0.5 text-[#1A1A1A]">{ex.description}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-[#6B7280]">
              Category
            </dt>
            <dd className="mt-0.5 text-[#1A1A1A]">#{ex.expense_category}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-[#6B7280]">
              Amount
            </dt>
            <dd className="mt-0.5 font-medium text-[#1A1A1A]">{ex.amount}</dd>
          </div>
          {ex.currency_code?.trim() ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Currency
              </dt>
              <dd className="mt-0.5 text-[#1A1A1A]">{ex.currency_code}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium uppercase text-[#6B7280]">
              Status
            </dt>
            <dd className="mt-0.5 capitalize text-[#1A1A1A]">{ex.status}</dd>
          </div>
          {ex.building != null ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Building
              </dt>
              <dd className="mt-0.5">
                <Link
                  href={`/dashboard/buildings/${ex.building}`}
                  className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                >
                  View building #{ex.building}
                </Link>
              </dd>
            </div>
          ) : null}
          {ex.unit != null ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Unit
              </dt>
              <dd className="mt-0.5">
                <Link
                  href={`/dashboard/units/${ex.unit}`}
                  className="font-medium text-brand-blue hover:text-brand-navy hover:underline"
                >
                  View unit #{ex.unit}
                </Link>
              </dd>
            </div>
          ) : null}
          {ex.vendor != null ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Vendor
              </dt>
              <dd className="mt-0.5 text-[#1A1A1A]">#{ex.vendor}</dd>
            </div>
          ) : null}
          {ex.job_order != null ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Job order
              </dt>
              <dd className="mt-0.5 text-[#1A1A1A]">#{ex.job_order}</dd>
            </div>
          ) : null}
          {ex.payment_method?.trim() ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Payment method
              </dt>
              <dd className="mt-0.5 capitalize text-[#1A1A1A]">
                {ex.payment_method}
              </dd>
            </div>
          ) : null}
          {ex.reference?.trim() ? (
            <div>
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Reference
              </dt>
              <dd className="mt-0.5 text-[#1A1A1A]">{ex.reference}</dd>
            </div>
          ) : null}
          {ex.receipt_url?.trim() ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-[#6B7280]">
                Receipt
              </dt>
              <dd className="mt-0.5">
                <a
                  href={ex.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-medium text-brand-blue hover:text-brand-navy hover:underline"
                >
                  {ex.receipt_url}
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium uppercase text-[#6B7280]">
              Paid at
            </dt>
            <dd className="mt-0.5 text-[#6B7280]">{formatWhen(ex.paid_at)}</dd>
          </div>
        </dl>
      ) : null}
    </DashboardDetailView>
  );
}
