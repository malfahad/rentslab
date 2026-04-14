"use client";

import { useEffect, useState } from "react";
import { BILLING_CYCLES, DEFAULT_BILLING_CYCLE } from "@/lib/constants/billing-cycles";
import { RENT_CURRENCIES } from "@/lib/constants/currencies";
import { listOrgUserRoles } from "@/services/user-role-service";
import type { LeaseDto, LeaseUpdate } from "@/types/operations";

const LEASE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "terminated", label: "Terminated" },
  { value: "expired", label: "Expired" },
];

export type LeaseFormProps = {
  initial: LeaseDto;
  onSubmit: (body: LeaseUpdate) => Promise<void>;
  formId?: string;
};

export function LeaseForm({
  initial,
  onSubmit,
  formId = "lease-edit-form",
}: LeaseFormProps) {
  const [staff, setStaff] = useState<{ id: number; label: string }[]>([]);
  const [startDate, setStartDate] = useState(initial.start_date);
  const [endDate, setEndDate] = useState(initial.end_date ?? "");
  const [rentAmount, setRentAmount] = useState(initial.rent_amount);
  const [rentCurrency, setRentCurrency] = useState(
    initial.rent_currency?.trim() || "USD",
  );
  const [depositAmount, setDepositAmount] = useState(
    initial.deposit_amount ?? "",
  );
  const [depositCurrency, setDepositCurrency] = useState(
    initial.deposit_currency?.trim() || "USD",
  );
  const [billingCycle, setBillingCycle] = useState(
    initial.billing_cycle || DEFAULT_BILLING_CYCLE,
  );
  const [status, setStatus] = useState(initial.status);
  const [managedBy, setManagedBy] = useState(
    initial.managed_by != null ? String(initial.managed_by) : "",
  );
  const [billingSame, setBillingSame] = useState(
    initial.billing_same_as_tenant_address,
  );
  const [billLine1, setBillLine1] = useState(initial.billing_address_line1);
  const [billLine2, setBillLine2] = useState(initial.billing_address_line2);
  const [billCity, setBillCity] = useState(initial.billing_city);
  const [billRegion, setBillRegion] = useState(initial.billing_region);
  const [billPostal, setBillPostal] = useState(initial.billing_postal_code);
  const [billCountry, setBillCountry] = useState(initial.billing_country_code);
  const [externalRef, setExternalRef] = useState(initial.external_reference);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const roles = await listOrgUserRoles();
        if (cancelled) return;
        const byUser = new Map<number, string>();
        for (const r of roles) {
          if (!byUser.has(r.user)) byUser.set(r.user, r.user_label);
        }
        setStaff(
          [...byUser.entries()]
            .map(([id, label]) => ({ id, label }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );
      } catch {
        if (!cancelled) setStaff([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initial.managed_by == null) return;
    setStaff((prev) => {
      if (prev.some((s) => s.id === initial.managed_by)) return prev;
      return [
        ...prev,
        {
          id: initial.managed_by!,
          label: initial.managed_by_name?.trim() || "Staff member",
        },
      ].sort((a, b) => a.label.localeCompare(b.label));
    });
  }, [initial.managed_by, initial.managed_by_name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: LeaseUpdate = {
      start_date: startDate,
      end_date: endDate.trim() === "" ? null : endDate,
      rent_amount: rentAmount,
      rent_currency: rentCurrency,
      deposit_amount: depositAmount.trim() === "" ? null : depositAmount,
      deposit_currency: depositCurrency,
      billing_cycle: billingCycle,
      status,
      managed_by: managedBy === "" ? null : Number(managedBy),
      billing_same_as_tenant_address: billingSame,
      billing_address_line1: billLine1,
      billing_address_line2: billLine2,
      billing_city: billCity,
      billing_region: billRegion,
      billing_postal_code: billPostal,
      billing_country_code: billCountry,
      external_reference: externalRef,
    };
    await onSubmit(body);
  }

  const input =
    "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20";

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Parties
        </h2>
        <p className="text-sm text-[#1A1A1A]">
          <span className="text-[#6B7280]">Tenant: </span>
          {initial.tenant_name?.trim() || `Tenant #${initial.tenant}`}
        </p>
        <p className="text-sm text-[#1A1A1A]">
          <span className="text-[#6B7280]">Unit: </span>
          {initial.unit_label?.trim() || `Unit #${initial.unit}`}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Term & rent
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Start date
            </span>
            <input
              type="date"
              required
              className={input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              End date
            </span>
            <input
              type="date"
              className={input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Rent amount
            </span>
            <input
              inputMode="decimal"
              required
              className={input}
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Currency
            </span>
            <select
              className={`${input} bg-white`}
              value={rentCurrency}
              onChange={(e) => setRentCurrency(e.target.value)}
            >
              {RENT_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Deposit amount
            </span>
            <input
              inputMode="decimal"
              className={input}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Deposit currency
            </span>
            <select
              className={`${input} bg-white`}
              value={depositCurrency}
              onChange={(e) => setDepositCurrency(e.target.value)}
            >
              {RENT_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-brand-blue hover:underline"
          onClick={() => setDepositCurrency(rentCurrency)}
        >
          Match rent currency
        </button>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block max-w-xs">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Billing cycle
            </span>
            <select
              className={`${input} bg-white`}
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
            >
              {BILLING_CYCLES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block max-w-xs">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Status
            </span>
            <select
              className={`${input} bg-white`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {LEASE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block max-w-md">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Managed by
          </span>
          <select
            className={`${input} bg-white`}
            value={managedBy}
            onChange={(e) => setManagedBy(e.target.value)}
          >
            <option value="">— Not assigned —</option>
            {staff.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            External reference
          </span>
          <input
            className={input}
            value={externalRef}
            onChange={(e) => setExternalRef(e.target.value)}
            placeholder="Contract or portfolio reference"
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Billing address
        </h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#D1D5DB] text-brand-navy focus:ring-brand-navy"
            checked={billingSame}
            onChange={(e) => setBillingSame(e.target.checked)}
          />
          <span className="text-sm text-[#1A1A1A]">
            Same as tenant correspondence address
          </span>
        </label>
        {!billingSame ? (
          <div className="space-y-3 border-t border-[#F3F4F6] pt-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Address line 1
              </span>
              <input
                className={input}
                value={billLine1}
                onChange={(e) => setBillLine1(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Address line 2
              </span>
              <input
                className={input}
                value={billLine2}
                onChange={(e) => setBillLine2(e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  City
                </span>
                <input
                  className={input}
                  value={billCity}
                  onChange={(e) => setBillCity(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Region
                </span>
                <input
                  className={input}
                  value={billRegion}
                  onChange={(e) => setBillRegion(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Postal code
                </span>
                <input
                  className={input}
                  value={billPostal}
                  onChange={(e) => setBillPostal(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Country (ISO-2)
                </span>
                <input
                  className={input}
                  value={billCountry}
                  onChange={(e) => setBillCountry(e.target.value)}
                  maxLength={2}
                />
              </label>
            </div>
          </div>
        ) : null}
      </section>
    </form>
  );
}
