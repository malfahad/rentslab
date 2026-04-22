import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getReportBySlug } from "@/lib/reports/catalog";
import { ReportResultClient } from "./report-result-client";

type ReportResultPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportResultPage({ params }: ReportResultPageProps) {
  const { reportId } = await params;
  const report = getReportBySlug(reportId);
  if (!report) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
          Loading result…
        </div>
      }
    >
      <ReportResultClient report={report} />
    </Suspense>
  );
}
