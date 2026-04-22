"use client";

import type { ReactNode } from "react";
import type { ReportDefinition } from "@/lib/reports/catalog";
import type {
  CashFlowReport,
  IncomeStatementReport,
  RentRollReport,
  ReportStubPayload,
} from "@/types/reports";

function MoneyCell({ value }: { value: string }) {
  return <span className="font-mono tabular-nums">{value}</span>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 border-b border-[#E5E7EB] pb-2 font-serif text-base font-medium text-brand-navy first:mt-0">
      {children}
    </h3>
  );
}

function IncomeStatementDisplay({ data }: { data: IncomeStatementReport }) {
  const r = data.revenue;
  const e = data.expenses;
  return (
    <div className="space-y-1 text-sm">
      {data.period ? (
        <p className="text-[#6B7280]">
          Period: {data.period.start} → {data.period.end}
          {data.basis ? (
            <span className="ml-2 rounded bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#4B5563]">
              {data.basis}
            </span>
          ) : null}
        </p>
      ) : null}
      <SectionTitle>Revenue</SectionTitle>
      {r ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="flex justify-between gap-4 rounded-lg bg-[#F9FAFB] px-3 py-2">
            <dt className="text-[#6B7280]">Invoices (total)</dt>
            <dd>
              <MoneyCell value={r.invoices_total} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 rounded-lg bg-[#F9FAFB] px-3 py-2">
            <dt className="text-[#6B7280]">Invoice count</dt>
            <dd className="font-mono tabular-nums">{r.invoice_count}</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-lg bg-[#F9FAFB] px-3 py-2 sm:col-span-2">
            <dt className="text-[#6B7280]">Credit notes</dt>
            <dd>
              <MoneyCell value={r.credit_notes_total} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 rounded-lg bg-emerald-50 px-3 py-2 sm:col-span-2">
            <dt className="font-medium text-emerald-900">Net revenue</dt>
            <dd>
              <MoneyCell value={r.net_revenue} />
            </dd>
          </div>
        </dl>
      ) : null}
      {r && r.by_line_kind.length > 0 ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            By line kind
          </p>
          <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F9FAFB] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                <tr>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {r.by_line_kind.map((row) => (
                  <tr key={row.line_kind} className="border-t border-[#E5E7EB]">
                    <td className="px-3 py-2 text-[#374151]">{row.line_kind}</td>
                    <td className="px-3 py-2 text-right">
                      <MoneyCell value={row.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <SectionTitle>Expenses</SectionTitle>
      {e ? (
        <>
          <div className="flex justify-between gap-4 rounded-lg bg-amber-50 px-3 py-2 text-sm">
            <span className="font-medium text-amber-900">Total expenses</span>
            <MoneyCell value={e.total} />
          </div>
          {e.by_category.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F9FAFB] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {e.by_category.map((row) => (
                    <tr key={row.category} className="border-t border-[#E5E7EB]">
                      <td className="px-3 py-2 text-[#374151]">{row.category}</td>
                      <td className="px-3 py-2 text-right">
                        <MoneyCell value={row.amount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">No expenses in this period.</p>
          )}
        </>
      ) : null}

      {data.net_income != null ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-navy/20 bg-brand-navy/5 px-4 py-3">
          <span className="font-serif text-lg font-medium text-brand-navy">
            Net income
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-brand-navy">
            {data.net_income}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function CashFlowDisplay({ data }: { data: CashFlowReport }) {
  const cin = data.cash_in;
  const cout = data.cash_out;
  return (
    <div className="space-y-1 text-sm">
      {data.period ? (
        <p className="text-[#6B7280]">
          Period: {data.period.start} → {data.period.end}
          {data.basis ? (
            <span className="ml-2 rounded bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#4B5563]">
              {data.basis}
            </span>
          ) : null}
        </p>
      ) : null}

      <SectionTitle>Cash in</SectionTitle>
      {cin ? (
        <>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <span className="text-emerald-900">Total</span>
            <MoneyCell value={cin.total} />
            <span className="text-xs text-emerald-800">
              {cin.payment_count} payment(s)
            </span>
          </div>
          {cin.by_method.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F9FAFB] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cin.by_method.map((row) => (
                    <tr key={row.method} className="border-t border-[#E5E7EB]">
                      <td className="px-3 py-2 capitalize text-[#374151]">
                        {row.method}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <MoneyCell value={row.amount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}

      <SectionTitle>Cash out</SectionTitle>
      {cout ? (
        <>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2">
            <span className="text-amber-900">Total</span>
            <MoneyCell value={cout.total} />
            <span className="text-xs text-amber-800">
              {cout.expense_count} expense(s)
            </span>
          </div>
          {cout.by_category.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F9FAFB] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cout.by_category.map((row) => (
                    <tr key={row.category} className="border-t border-[#E5E7EB]">
                      <td className="px-3 py-2 text-[#374151]">{row.category}</td>
                      <td className="px-3 py-2 text-right">
                        <MoneyCell value={row.amount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">No paid expenses in this period.</p>
          )}
        </>
      ) : null}

      {data.net_cash_flow != null ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-navy/20 bg-brand-navy/5 px-4 py-3">
          <span className="font-serif text-lg font-medium text-brand-navy">
            Net cash flow
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-brand-navy">
            {data.net_cash_flow}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RentRollDisplay({ data }: { data: RentRollReport }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-[#6B7280]">
        As of {data.as_of ?? "—"}
        {data.total_scheduled_rent != null ? (
          <>
            {" "}
            · Total scheduled rent:{" "}
            <span className="font-mono font-medium text-[#111827]">
              {data.total_scheduled_rent}
            </span>
          </>
        ) : null}
        {data.lease_count != null ? (
          <span className="ml-2">· {data.lease_count} lease(s)</span>
        ) : null}
      </p>
      {data.rows.length === 0 ? (
        <p className="text-[#6B7280]">No active leases match this date.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-[#F9FAFB] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              <tr>
                <th className="px-3 py-2">Building</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2 text-right">Rent</th>
                <th className="px-3 py-2">Cycle</th>
                <th className="px-3 py-2">Lease</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.lease_id} className="border-t border-[#E5E7EB]">
                  <td className="px-3 py-2 text-[#374151]">{row.building_name}</td>
                  <td className="px-3 py-2 font-medium text-[#111827]">
                    {row.unit_number}
                  </td>
                  <td className="px-3 py-2 text-[#374151]">{row.tenant_name}</td>
                  <td className="px-3 py-2 text-right">
                    <MoneyCell value={row.rent_amount} />
                    {row.rent_currency ? (
                      <span className="ml-1 text-xs text-[#6B7280]">
                        {row.rent_currency}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 capitalize text-[#6B7280]">
                    {row.billing_cycle}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6B7280]">
                    {row.lease_start}
                    {row.lease_end ? ` → ${row.lease_end}` : " → open"}
                  </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StubDisplay({ data }: { data: ReportStubPayload }) {
  return (
    <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-[#FAFAFA] p-4">
      <p className="text-sm text-[#374151]">
        This report is not wired to live data yet. The API returned a placeholder
        payload.
      </p>
      <pre className="mt-3 max-h-64 overflow-auto rounded border border-[#E5E7EB] bg-white p-3 text-xs text-[#4B5563]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function GenericJsonDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-xs text-[#374151]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function ReportResultPayload({
  report,
  data,
}: {
  report: ReportDefinition;
  data: unknown;
}) {
  if (data === null || typeof data !== "object") {
    return (
      <p className="text-sm text-[#6B7280]">No data returned from the server.</p>
    );
  }

  const o = data as Record<string, unknown>;
  const status = o.status;

  if (status === "stub") {
    return <StubDisplay data={o as ReportStubPayload} />;
  }

  switch (report.slug) {
    case "income-statement":
      return <IncomeStatementDisplay data={data as IncomeStatementReport} />;
    case "cash-flow":
      return <CashFlowDisplay data={data as CashFlowReport} />;
    case "rent-roll":
      return <RentRollDisplay data={data as RentRollReport} />;
    default:
      return <GenericJsonDisplay data={o} />;
  }
}
