"use client";

import Link from "next/link";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import {
  REPORT_GROUPS,
  isReportBackendWired,
  reportsForGroup,
} from "@/lib/reports/catalog";

export default function ReportsListPage() {
  const { orgReady, orgId } = useOrg();

  if (!orgReady) {
    return (
      <DashboardListView title="Reports" description="Loading…">
        <p className="text-sm text-[#6B7280]">Preparing workspace…</p>
      </DashboardListView>
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
    <DashboardListView
      title="Reports"
      description="Choose a report to configure parameters and generate output. Financial and operational exports will connect to your org data as the reporting API is enabled."
    >
      <div className="mx-auto max-w-content space-y-10">
        {REPORT_GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="border-b border-[#E5E7EB] pb-2 font-serif text-lg font-medium uppercase tracking-wide text-brand-navy">
              {group.label}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {reportsForGroup(group.id)
                .sort((a, b) => a.id - b.id)
                .map((r) => {
                  const backendWired = isReportBackendWired(r.slug);
                  const baseClassName =
                    "block rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition";

                  if (!backendWired) {
                    return (
                      <li key={r.slug}>
                        <div
                          className={`${baseClassName} cursor-not-allowed border-dashed opacity-80`}
                          aria-disabled="true"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              #{r.id}
                            </p>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                              Coming soon
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-[#1A1A1A]">{r.title}</p>
                          <p className="mt-2 text-sm leading-snug text-[#6B7280]">
                            {r.summary}
                          </p>
                          <p className="mt-3 text-sm font-medium text-[#9CA3AF]">
                            Backend integration pending
                          </p>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={r.slug}>
                      <Link
                        href={`/dashboard/reports/${r.slug}/run`}
                        className={`${baseClassName} hover:border-brand-navy/30 hover:shadow-md`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                          #{r.id}
                        </p>
                        <p className="mt-1 font-medium text-[#1A1A1A]">{r.title}</p>
                        <p className="mt-2 text-sm leading-snug text-[#6B7280]">
                          {r.summary}
                        </p>
                        <p className="mt-3 text-sm font-medium text-brand-blue">
                          Configure run →
                        </p>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </DashboardListView>
  );
}
