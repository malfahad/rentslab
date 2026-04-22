"use client";

import { useEffect, useMemo, useState } from "react";
import { getLicenseSummary } from "@/services/license-service";
import type { LicenseCycleDto, LicenseSummaryDto } from "@/types/license";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function moneyFromString(value: string | null | undefined): string {
  const n = Number(value ?? "0");
  return money(Number.isFinite(n) ? n : 0);
}

function cycleLabel(cycle: LicenseCycleDto): string {
  if (cycle.mode === "yearly") return String(cycle.cycle_year);
  const month = cycle.cycle_month ?? 1;
  return new Date(cycle.cycle_year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function LicenseSettingsPanel() {
  const [summary, setSummary] = useState<LicenseSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getLicenseSummary()
      .then((r) => {
        if (!cancelled) {
          setSummary(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load unit count.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const monthlyRate = useMemo(
    () => Number(summary?.rates.monthly_per_unit ?? "0.79"),
    [summary?.rates.monthly_per_unit],
  );
  const yearlyRate = useMemo(
    () => Number(summary?.rates.yearly_per_unit ?? "8.99"),
    [summary?.rates.yearly_per_unit],
  );
  const unitCount = summary?.units_count ?? 0;
  const projectedMonthly = Number((unitCount * monthlyRate).toFixed(2));

  return (
    <div className="space-y-6">
      <div className="border-b border-dashed border-[#E5E7EB] pb-4">
        <h2 className="font-serif text-lg font-medium text-brand-navy">License</h2>
        <p className="mt-2 text-sm text-[#6B7280]">
          Billing is based on total units in the system:{" "}
          <span className="font-medium text-[#111827]">{money(monthlyRate)} per unit/month</span> or{" "}
          <span className="font-medium text-[#111827]">{money(yearlyRate)} per unit/year</span>.
        </p>
      </div>

      {loading ? <p className="text-sm text-[#6B7280]">Loading unit count…</p> : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Units in system
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#111827]">
            {unitCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            License rates
          </p>
          <p className="mt-2 text-sm text-[#374151]">
            Monthly:{" "}
            <span className="font-mono font-medium text-[#111827]">
              {money(monthlyRate)}
            </span>{" "}
            / unit
          </p>
          <p className="mt-1 text-sm text-[#374151]">
            Yearly:{" "}
            <span className="font-mono font-medium text-[#111827]">
              {money(yearlyRate)}
            </span>{" "}
            / unit
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Credit balance
          </h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {moneyFromString(summary?.credit_balance)}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Available credits to offset future license cycles.
          </p>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Upcoming
          </h3>
          {summary?.upcoming ? (
            <>
              <p className="mt-2 text-sm text-[#374151]">
                Next cycle ({cycleLabel(summary.upcoming)})
              </p>
              <p className="mt-1 text-lg font-semibold text-[#111827]">
                {moneyFromString(summary.upcoming.amount_due)}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {summary.upcoming.units_count} unit(s) ×{" "}
                {moneyFromString(summary.upcoming.unit_price)}
              </p>
              {summary.upcoming.tenant_name ? (
                <p className="mt-1 text-xs text-[#6B7280]">
                  Billing contact: {summary.upcoming.tenant_name}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#374151]">No upcoming cycle recorded.</p>
              <p className="mt-1 text-lg font-semibold text-[#111827]">
                {money(projectedMonthly)}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Projection at current unit count.
              </p>
            </>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
            Due
          </h3>
          {summary?.due ? (
            <>
              <p className="mt-2 text-sm text-amber-900">
                Current cycle ({cycleLabel(summary.due)})
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-950">
                {moneyFromString(summary.due.amount_due)}
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Status: {summary.due.status}
              </p>
              {summary.due.tenant_name ? (
                <p className="mt-1 text-xs text-amber-800">
                  Billing contact: {summary.due.tenant_name}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-amber-900">No cycle currently due.</p>
              <p className="mt-1 text-lg font-semibold text-amber-950">
                {money(projectedMonthly)}
              </p>
            </>
          )}
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Previous cycles
          </h3>
          {summary && summary.previous_cycles.length > 0 ? (
            <div className="mt-2 space-y-2 text-sm">
              {summary.previous_cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-3 py-2"
                >
                  <span className="text-[#374151]">
                    {cycleLabel(cycle)}
                    <span className="ml-2 text-xs uppercase text-[#9CA3AF]">
                      {cycle.status}
                    </span>
                  </span>
                  <span className="font-mono text-[#111827]">
                    {moneyFromString(cycle.amount_due)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#6B7280]">
              No previous cycles available since registration.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
