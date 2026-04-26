"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ReportResultPayload } from "@/components/reports/report-result-payload";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { setStoredOrgId } from "@/lib/auth-storage";
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

function fileSafe(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function toCsvValue(value: unknown): string {
  const str =
    value == null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return `"${str.replace(/"/g, '""')}"`;
}

type TabularSection = { title: string; rows: Array<Record<string, unknown>> };

function collectTabularSections(
  input: unknown,
  path = "",
  summary: Array<[string, unknown]> = [],
  tables: TabularSection[] = [],
): { summary: Array<[string, unknown]>; tables: TabularSection[] } {
  if (input == null || typeof input !== "object") {
    summary.push([path || "value", input]);
    return { summary, tables };
  }

  if (Array.isArray(input)) {
    if (
      input.length > 0 &&
      input.every((row) => row != null && typeof row === "object" && !Array.isArray(row))
    ) {
      tables.push({ title: path || "rows", rows: input as Array<Record<string, unknown>> });
    } else {
      summary.push([path || "value", JSON.stringify(input)]);
    }
    return { summary, tables };
  }

  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = path ? `${path}.${k}` : k;
    collectTabularSections(v, key, summary, tables);
  }
  return { summary, tables };
}

function tableColumns(rows: Array<Record<string, unknown>>): string[] {
  return Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row ?? {})) set.add(key);
      return set;
    }, new Set<string>()),
  );
}

function reportToCsv(data: unknown): string {
  const { summary, tables } = collectTabularSections(data);
  const lines: string[] = [];

  lines.push(toCsvValue("Report Summary"));
  lines.push(`${toCsvValue("field")},${toCsvValue("value")}`);
  for (const [k, v] of summary) {
    lines.push(`${toCsvValue(k)},${toCsvValue(v)}`);
  }

  for (const table of tables) {
    lines.push("");
    lines.push(toCsvValue(`Table: ${table.title}`));
    const cols = tableColumns(table.rows);
    lines.push(cols.map((c) => toCsvValue(c)).join(","));
    for (const row of table.rows) {
      lines.push(cols.map((c) => toCsvValue(row?.[c])).join(","));
    }
  }

  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportToExcelHtml(data: unknown, title: string): string {
  const { summary, tables } = collectTabularSections(data);

  const summaryRows = summary
    .map(
      ([k, v]) =>
        `<tr><td>${escapeHtml(String(k))}</td><td>${escapeHtml(
          v == null ? "" : typeof v === "string" ? v : JSON.stringify(v),
        )}</td></tr>`,
    )
    .join("");

  const tableBlocks = tables
    .map((table) => {
      const cols = tableColumns(table.rows);
      const head = cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
      const body = table.rows
        .map((row) => {
          const tds = cols
            .map((c) =>
              `<td>${escapeHtml(
                row?.[c] == null
                  ? ""
                  : typeof row[c] === "string"
                    ? String(row[c])
                    : JSON.stringify(row[c]),
              )}</td>`,
            )
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<h3>${escapeHtml(table.title)}</h3><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:Arial,sans-serif;font-size:12px}table{border-collapse:collapse;margin:8px 0 18px;width:100%}th,td{border:1px solid #ccc;padding:6px;text-align:left}h2,h3{margin:12px 0 6px}</style></head><body><h2>${escapeHtml(
    title,
  )}</h2><h3>Summary</h3><table><thead><tr><th>field</th><th>value</th></tr></thead><tbody>${summaryRows}</tbody></table>${tableBlocks}</body></html>`;
}

function reportToText(data: unknown): string {
  const { summary, tables } = collectTabularSections(data);
  const lines: string[] = ["Report Summary"];
  for (const [k, v] of summary) {
    lines.push(`- ${k}: ${v == null ? "" : typeof v === "string" ? v : JSON.stringify(v)}`);
  }
  for (const table of tables) {
    lines.push("");
    lines.push(`Table: ${table.title}`);
    const cols = tableColumns(table.rows);
    lines.push(cols.join(" | "));
    for (const row of table.rows) {
      lines.push(
        cols
          .map((c) =>
            row?.[c] == null
              ? ""
              : typeof row[c] === "string"
                ? String(row[c])
                : JSON.stringify(row[c]),
          )
          .join(" | "),
      );
    }
  }
  return lines.join("\n");
}

function reportToDotMatrixText(data: unknown): string {
  const { summary, tables } = collectTabularSections(data);
  const lines: string[] = [];
  lines.push("REPORT SUMMARY");
  lines.push("=".repeat(88));
  for (const [k, v] of summary) {
    const value = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
    lines.push(`${k.padEnd(36, ".")} ${value}`);
  }
  for (const table of tables) {
    lines.push("");
    lines.push(`TABLE: ${table.title.toUpperCase()}`);
    lines.push("-".repeat(88));
    const cols = tableColumns(table.rows);
    lines.push(cols.join(" | "));
    lines.push("-".repeat(88));
    for (const row of table.rows) {
      lines.push(
        cols
          .map((c) =>
            row?.[c] == null
              ? ""
              : typeof row[c] === "string"
                ? String(row[c])
                : JSON.stringify(row[c]),
          )
          .join(" | "),
      );
    }
  }
  return lines.join("\n");
}

function buildDotMatrixHtml(
  reportTitle: string,
  rangeLabel: string,
  monoText: string,
): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(reportTitle)} - Dot Matrix PDF</title>
    <style>
      @page { size: A4 portrait; margin: 14mm; }
      body {
        margin: 0;
        color: #111;
        font: 12px/1.35 "Courier New", Courier, monospace;
        background:
          radial-gradient(circle, rgba(0,0,0,0.08) 0.7px, transparent 0.8px) 0 0/10px 10px,
          #fff;
      }
      .sheet { white-space: pre-wrap; word-break: break-word; }
      .meta { margin-bottom: 12px; font-weight: bold; }
      .rule { border-top: 1px dashed #888; margin: 8px 0 12px; }
    </style>
  </head>
  <body>
    <div class="meta">REPORT: ${escapeHtml(reportTitle)}\nPERIOD: ${escapeHtml(rangeLabel)}\nGENERATED: ${escapeHtml(new Date().toISOString())}</div>
    <div class="rule"></div>
    <div class="sheet">${escapeHtml(monoText)}</div>
  </body>
</html>`;
}

/**
 * Parse report payload into a monospaced, dot-matrix style HTML render
 * and open browser Print dialog via hidden iframe (no popup window).
 */
function downloadDotMatrixPdf(reportTitle: string, periodLabel: string, data: unknown): void {
  const monoText = reportToDotMatrixText(data);
  const html = buildDotMatrixHtml(reportTitle, periodLabel, monoText);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 500);
  };

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    cleanup();
    throw new Error("Could not initialize print frame.");
  }

  doc.open();
  doc.write(html);
  doc.close();

  const invokePrint = () => {
    win.focus();
    win.print();
    cleanup();
  };

  if (doc.readyState === "complete") {
    invokePrint();
  } else {
    iframe.onload = invokePrint;
  }
}

function triggerDownload(bytes: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
  const docsHrefWithParams = (() => {
    const qs = new URLSearchParams();
    if (periodStart) qs.set("periodStart", periodStart);
    if (periodEnd) qs.set("periodEnd", periodEnd);
    if (format) qs.set("format", format);
    if (scope) qs.set("scope", scope);
    qs.set("export", "print");
    const s = qs.toString();
    return `/docs/report/${report.slug}${s ? `?${s}` : ""}`;
  })();
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
  const [downloadPending, setDownloadPending] = useState(false);
  const reportCurrency =
    payload != null && typeof payload === "object"
      ? ((payload as Record<string, unknown>).report_currency as string | undefined)
      : undefined;

  useEffect(() => {
    if (!orgReady || orgId == null || !hasParams) {
      setLoadState("idle");
      setPayload(null);
      setErrorMessage(null);
      return;
    }
    // Ensure authed API helper sends the currently selected org in X-Org-ID.
    setStoredOrgId(orgId);

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

  const handleDownload = useCallback(() => {
    if (payload == null) return;
    const safeSlug = fileSafe(report.slug || "report");
    const start = periodStart || "start";
    const end = periodEnd || "end";
    const fileBase = `${safeSlug}_${start}_to_${end}`;
    const requested = (format || "pdf").toLowerCase();

    setDownloadPending(true);
    try {
      if (requested === "csv") {
        const csv = reportToCsv(payload);
        triggerDownload(csv, `${fileBase}.csv`, "text/csv;charset=utf-8");
      } else if (requested === "excel") {
        const html = reportToExcelHtml(payload, `${report.title} (${start} to ${end})`);
        triggerDownload(html, `${fileBase}.xls`, "application/vnd.ms-excel;charset=utf-8");
      } else {
        const periodLabel = `${start} to ${end}`;
        downloadDotMatrixPdf(report.title, periodLabel, payload);
      }
    } finally {
      setDownloadPending(false);
    }
  }, [payload, report.slug, report.title, periodStart, periodEnd, format]);

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
          <button
            type="button"
            onClick={handleDownload}
            disabled={!(hasParams && loadState === "done" && payload != null) || downloadPending}
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadPending ? "Preparing..." : `Download result (${formatLabel(format)})`}
          </button>
          <Link
            href={docsHrefWithParams}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Print report
          </Link>
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
              Report currency
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#111827]">
              {reportCurrency || "—"}
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
