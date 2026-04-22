"use client";

import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { getReportBySlug } from "@/lib/reports/catalog";

const FORM_ID = "report-run-form";

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
] as const;

type ReportFormat = (typeof FORMAT_OPTIONS)[number]["value"];

function localDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstOfMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  return localDateISO(d);
}

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function ReportRunForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = typeof params.reportId === "string" ? params.reportId : "";
  const report = getReportBySlug(slug);

  const { orgReady, orgId } = useOrg();

  const [periodStart, setPeriodStart] = useState(firstOfMonthISO);
  const [periodEnd, setPeriodEnd] = useState(() => localDateISO(new Date()));
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [scope, setScope] = useState<"all">("all");

  useEffect(() => {
    const ps = searchParams.get("periodStart");
    const pe = searchParams.get("periodEnd");
    const fmt = searchParams.get("format");
    const sc = searchParams.get("scope");
    if (ps && isIsoDate(ps)) setPeriodStart(ps);
    if (pe && isIsoDate(pe)) setPeriodEnd(pe);
    if (fmt === "pdf" || fmt === "csv" || fmt === "excel") setFormat(fmt);
    if (sc === "all") setScope("all");
  }, [searchParams]);

  const listHref = "/dashboard/reports";

  const validationError = useMemo(() => {
    if (!periodStart || !periodEnd) return "Choose a start and end date.";
    if (periodStart > periodEnd) {
      return "Start date must be on or before the end date.";
    }
    return null;
  }, [periodStart, periodEnd]);

  if (!report) {
    notFound();
  }

  const activeReport = report;

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validationError) return;
    const qs = new URLSearchParams();
    qs.set("periodStart", periodStart);
    qs.set("periodEnd", periodEnd);
    qs.set("format", format);
    qs.set("scope", scope);
    router.push(
      `/dashboard/reports/${activeReport.slug}/result?${qs.toString()}`,
    );
  }

  return (
    <PortfolioFormShell
      backHref={listHref}
      backLabel="All reports"
      title={activeReport.title}
      description="Set the period and output format. Summary reports load live figures from the API when you continue; PDF/CSV export will follow."
      footer={
        <>
          <Link
            href={listHref}
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary-sm h-10 px-5"
            disabled={!!validationError}
          >
            Generate report
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="space-y-5" onSubmit={handleSubmit}>
        {validationError ? (
          <p className="text-sm text-amber-800" role="status">
            {validationError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="report-period-start"
              className="text-sm font-medium text-[#374151]"
            >
              Period start
            </label>
            <input
              id="report-period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#111827] shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="report-period-end"
              className="text-sm font-medium text-[#374151]"
            >
              Period end
            </label>
            <input
              id="report-period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#111827] shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="report-format"
            className="text-sm font-medium text-[#374151]"
          >
            Format
          </label>
          <select
            id="report-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#111827] shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            {FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-[#374151]">Scope</span>
          <select
            id="report-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as "all")}
            className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#111827] shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="all">All buildings</option>
          </select>
          <p className="text-xs text-[#6B7280]">
            Per-building filters will be available when portfolio selection is
            wired for reporting.
          </p>
        </div>
      </form>
    </PortfolioFormShell>
  );
}

export default function ReportRunPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <ReportRunForm />
    </Suspense>
  );
}
