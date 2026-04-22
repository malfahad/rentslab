"use client";

import { useState } from "react";

const cases = [
  {
    id: "landlords",
    label: "Landlords",
    bullets: [
      "See your entire portfolio in one dashboard — occupancy, arrears, and cash, all live",
      "Know which tenants are current and which are overdue, without asking anyone",
      "See real money collected, not just invoices sent",
    ],
  },
  {
    id: "managers",
    label: "Property managers",
    bullets: [
      "Leases, renewals, and handovers per unit",
      "Tenant records and lease history in one place",
      "Maintenance tickets tied to the right unit",
    ],
  },
  {
    id: "finance",
    label: "Finance teams",
    bullets: [
      "Payments matched to invoices and rent lines",
      "Collections visibility with payment attempts and balances",
      "Audit trail of who changed what and when",
    ],
  },
] as const;

export function UseCaseTabs() {
  const [active, setActive] = useState<(typeof cases)[number]["id"]>("managers");

  const current = cases.find((c) => c.id === active) ?? cases[1];

  return (
    <section
      className="bg-white py-16 md:py-20"
      aria-labelledby="usecase-heading"
    >
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h2
          id="usecase-heading"
          className="text-center font-serif text-2xl font-medium tracking-wide text-brand-navy md:text-3xl"
        >
          Different roles. One source of truth.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#374151]">
          Whether you own the buildings or manage them, RentSlab shows you
          exactly what you need.
        </p>
        <div
          className="mt-8 flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label="Audience"
        >
          {cases.map((c) => {
            const selected = active === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`rounded-lg px-5 py-2.5 text-sm font-normal transition ${
                  selected
                    ? "bg-brand-navy text-white"
                    : "border border-gray-200 bg-white text-[#374151] hover:border-brand-navy/40"
                }`}
                onClick={() => setActive(c.id)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          className="mx-auto mt-8 max-w-2xl rounded-xl border border-gray-200 bg-surface-main px-8 py-8 text-left md:px-10"
        >
          <ul className="space-y-4">
            {current.bullets.map((line) => (
              <li key={line} className="flex gap-3 text-[#1A1A1A]">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold"
                  aria-hidden
                />
                <span className="text-base leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
