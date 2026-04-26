"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { getReportBySlug } from "@/lib/reports/catalog";
import { fetchReport } from "@/services/report-service";

export default function ReportDocumentPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const searchParams = useSearchParams();
  const exportMode = useMemo(() => searchParams.get("export"), [searchParams]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const report = getReportBySlug(reportId);
  const periodStart = searchParams.get("periodStart") || "";
  const periodEnd = searchParams.get("periodEnd") || "";
  const scope = searchParams.get("scope") || "";
  const format = searchParams.get("format") || "";

  useEffect(() => {
    if (!report) {
      setError("Unknown report.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Missing periodStart or periodEnd query params.");
      return;
    }
    setError(null);
    const query: Record<string, string> = { periodStart, periodEnd };
    if (scope) query.scope = scope;
    if (format) query.format = format;
    if (periodEnd) query.asOf = periodEnd;
    void fetchReport(report.slug, query)
      .then((res) => setPayload(res))
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.messageForUser : "Could not load report document.");
      });
  }, [report, periodStart, periodEnd, scope, format]);

  useEffect(() => {
    if (!payload || !exportMode || exported) return;
    if (exportMode === "print") {
      setExported(true);
      window.print();
      return;
    }
    if (exportMode === "pdf" && rootRef.current) {
      setExported(true);
      const run = async () => {
        const html2pdf = (await import("html2pdf.js")).default;
        const target = rootRef.current;
        await html2pdf()
          .from(target)
          .set({
            margin: [10, 10, 10, 10],
            filename: `report-${reportId}.pdf`,
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
            html2canvas: { scale: 3, backgroundColor: "#ffffff", useCORS: true, windowWidth: target.scrollWidth },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .save();
      };
      void run();
    }
  }, [exportMode, exported, payload, reportId]);

  if (error) {
    return <main style={{ padding: "16px", fontFamily: "Courier New, monospace" }}>{error}</main>;
  }

  if (!report || !payload) {
    return <main style={{ padding: "16px", fontFamily: "Courier New, monospace" }}>Loading report...</main>;
  }

  const printable = JSON.stringify(payload, null, 2);

  return (
    <main style={{ padding: "16px", background: "#ffffff", color: "#000000", fontFamily: "Courier New, monospace" }}>
      <div ref={rootRef} style={{ maxWidth: "980px", margin: "0 auto", lineHeight: 1.4 }}>
        <header style={{ textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>{report.title}</div>
          <div style={{ fontSize: "11px" }}>Report document</div>
        </header>
        <section style={{ marginTop: "12px", fontSize: "11px" }}>
          <div>Report ID: {reportId}</div>
          <div>Period: {periodStart} - {periodEnd}</div>
          <div>Scope: {scope || "all"}</div>
        </section>
        <pre style={{ marginTop: "10px", borderTop: "1px solid #000", paddingTop: "8px", fontSize: "10px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {printable}
        </pre>
      </div>
    </main>
  );
}
