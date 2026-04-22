"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReportResultPayload } from "@/components/reports/report-result-payload";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import type { ReportDefinition } from "@/lib/reports/catalog";
import { fetchReport } from "@/services/report-service";

const FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF",
  csv: "CSV",
  excel: "Excel",
};

function formatLabel(raw: string | null): string {
  if (raw == null || raw === "") return "—";
  return FORMAT_LABELS[raw] ?? raw.toUpperCase();
}

export function ReportResultClient({ report }: { report: ReportDefinition }) {
  const { orgReady, orgId } = useOrg();
  const searchParams = useSearchParams();

  const periodStart = searchParams.get("periodStart");
  const periodEnd = searchParams.get("periodEnd");
  const format = searchParams.get("format");
  const scope = searchParams.get("scope");

  const listHref = "/dashboard/reports";
  const runHref = `/dashboard/reports/${report.slug}/run`;
  const runHrefWithParams = (() => {
    const qs = new URLSearchParams();
    if (periodStart) qs.set("periodStart", periodStart);
    if (periodEnd) qs.set("periodEnd", periodEnd);
    if (format) qs.set("format", format);
    if (scope) qs.set("scope", scope);
    const s = qs.toString();
    return s ? `${runHref}?${s}` : runHref;
  })();

  const hasParams =
    periodStart != null &&
    periodStart !== "" &&
    periodEnd != null &&
    periodEnd !== "";

  const [loadState, setLoadState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [payload, setPayload] = useState<unknown>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orgReady || orgId == null || !hasParams) {
      setLoadState("idle");
      setPayload(null);
      setErrorMessage(null);
      return;
    }

    const query: Record<string, string> = {
      periodStart: periodStart!,
      periodEnd: periodEnd!,
    };
    if (format) query.format = format;
    if (scope) query.scope = scope;
    // Rent roll uses `as_of` / `periodEnd` on the backend; pass explicit asOf for clarity
    if (periodEnd) query.asOf = periodEnd;

    let cancelled = false;
    setLoadState("loading");
    setErrorMessage(null);

    void fetchReport(report.slug, query)
      .then((data) => {
        if (!cancelled) {
          setPayload(data);
          setLoadState("done");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPayload(null);
          setLoadState("error");
          setErrorMessage(
            e instanceof ApiError ? e.messageForUser : "Could not load report.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    orgReady,
    orgId,
    hasParams,
    report.slug,
    periodStart,
    periodEnd,
    format,
    scope,
  ]);

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
    <PortfolioFormShell
      backHref={listHref}
      backLabel="All reports"
      title={`${report.title}`}
      description="Figures below are loaded from your organization for the selected period. Export to PDF or CSV will be added when the reporting pipeline supports file downloads."
      footer={
        <>
          <Link
            href={runHrefWithParams}
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Adjust parameters
          </Link>
          <Link
            href={listHref}
            className="btn-primary-sm inline-flex h-10 items-center px-5"
          >
            Done
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {!hasParams ? (
          <p className="text-sm text-amber-800" role="status">
            No run parameters were provided. Use{" "}
            <Link href={runHref} className="font-medium text-brand-blue underline">
              configure run
            </Link>{" "}
            to choose dates and format, then generate again.
          </p>
        ) : null}

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Report
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">
              #{report.id} · {report.title}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Output format
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">
              {formatLabel(format)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Period
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">
              {periodStart && periodEnd
                ? `${periodStart} → ${periodEnd}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Scope
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">
              {scope === "all" || scope == null || scope === ""
                ? "All buildings"
                : scope}
            </dd>
          </div>
        </dl>

        {hasParams && loadState === "loading" ? (
          <p className="text-sm text-[#6B7280]" role="status">
            Loading report…
          </p>
        ) : null}
        {hasParams && loadState === "error" && errorMessage ? (
          <p className="text-sm text-red-800" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {hasParams && loadState === "done" && payload != null ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Results
            </p>
            <div className="mt-3">
              <ReportResultPayload report={report} data={payload} />
            </div>
          </div>
        ) : null}
      </div>
    </PortfolioFormShell>
  );
}
