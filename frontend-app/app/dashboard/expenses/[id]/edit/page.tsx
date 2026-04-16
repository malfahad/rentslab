"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getExpense } from "@/services/expense-service";
import type { ExpenseDto } from "@/types/expense";

export default function ExpenseEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [ex, setEx] = useState<ExpenseDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (!orgReady) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
        Preparing workspace…
      </div>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <p className="text-sm text-red-800">{loadError}</p>
      </div>
    );
  }

  if (loading || !ex) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
        Loading expense…
      </div>
    );
  }

  return (
    <ExpenseForm
      variant="edit"
      expenseId={id}
      initialExpense={ex}
      formId="expense-edit-form"
      cancelHref={`/dashboard/expenses/${id}`}
      title="Edit expense"
      shellDescription="Update expense details, links, and status."
      onSuccess={(e) => router.push(`/dashboard/expenses/${e.id}`)}
    />
  );
}
