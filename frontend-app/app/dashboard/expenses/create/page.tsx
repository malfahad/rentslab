"use client";

import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";

export default function ExpenseCreatePage() {
  const router = useRouter();
  const { orgReady, orgId } = useOrg();

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

  return (
    <ExpenseForm
      variant="create"
      initialExpense={null}
      formId="expense-create-form"
      cancelHref="/dashboard/expenses"
      title="Record expense"
      shellDescription="Log operational spend and optional links to portfolio, vendors, or work orders."
      onSuccess={(e) => router.push(`/dashboard/expenses/${e.id}`)}
    />
  );
}
