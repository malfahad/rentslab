"use client";

import { useMemo, useState } from "react";
import { getRegisterUrl } from "@/lib/auth-urls";

const MONTHLY_PER_UNIT = 0.79;
const YEARLY_PER_UNIT = 8.99;

function usd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PricingCalculator() {
  const [unitsInput, setUnitsInput] = useState("50");
  const registerUrl = getRegisterUrl();
  const units = useMemo(() => {
    const parsed = Number.parseInt(unitsInput, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }, [unitsInput]);

  const monthlyTotal = useMemo(
    () => Number((units * MONTHLY_PER_UNIT).toFixed(2)),
    [units],
  );
  const yearlyTotal = useMemo(
    () => Number((units * YEARLY_PER_UNIT).toFixed(2)),
    [units],
  );
  const yearlyAtMonthlyRate = useMemo(
    () => Number((monthlyTotal * 12).toFixed(2)),
    [monthlyTotal],
  );
  const annualSavings = useMemo(
    () => Number((yearlyAtMonthlyRate - yearlyTotal).toFixed(2)),
    [yearlyAtMonthlyRate, yearlyTotal],
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-surface-main p-6 md:p-8">
      <h2 className="font-serif text-2xl font-medium tracking-wide text-brand-navy">
        Pricing calculator
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#374151]">
        License pricing is based on unit count:{" "}
        <span className="font-medium text-[#111827]">{usd(MONTHLY_PER_UNIT)} per unit/month</span>{" "}
        or <span className="font-medium text-[#111827]">{usd(YEARLY_PER_UNIT)} per unit/year</span>.
      </p>

      <div className="mt-6">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Number of units
          </span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={unitsInput}
            onChange={(e) => setUnitsInput(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#111827] outline-none transition focus:border-brand-navy"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Monthly billing
          </p>
          <p className="mt-2 font-serif text-2xl font-medium text-brand-navy">
            {usd(monthlyTotal)}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {units} units × {usd(MONTHLY_PER_UNIT)}
          </p>
        </article>

        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Yearly billing
          </p>
          <p className="mt-2 font-serif text-2xl font-medium text-brand-navy">
            {usd(yearlyTotal)}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {units} units × {usd(YEARLY_PER_UNIT)}
          </p>
        </article>
      </div>

      <p className="mt-4 text-sm text-[#374151]">
        Choosing yearly saves <span className="font-medium text-[#111827]">{usd(annualSavings)}</span> per year
        compared to paying monthly for 12 months.
      </p>

      {registerUrl ? (
        <a
          href={registerUrl}
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-brand-gold px-5 py-3 text-sm font-medium text-brand-navy transition-opacity hover:opacity-90"
        >
          Start now
        </a>
      ) : null}
    </section>
  );
}
