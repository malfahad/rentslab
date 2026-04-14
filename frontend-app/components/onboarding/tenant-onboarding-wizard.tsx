"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrg } from "@/contexts/org-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { BILLING_CYCLES, DEFAULT_BILLING_CYCLE } from "@/lib/constants/billing-cycles";
import { RENT_CURRENCIES } from "@/lib/constants/currencies";
import { QuickCreateServiceModal } from "@/components/services/quick-create-service-modal";
import { createLease } from "@/services/lease-service";
import { listOrgServices } from "@/services/catalog-service";
import { createServiceSubscription } from "@/services/service-subscription-service";
import { createTenant } from "@/services/tenant-service";
import { listOrgUserRoles } from "@/services/user-role-service";
import { listUnits } from "@/services/unit-service";
import type { ServiceDto, TenantType } from "@/types/operations";
import type { UnitDto } from "@/types/portfolio";
import { ApiError } from "@/lib/api/errors";

const STEPS = [
  { n: 1, label: "Tenant info" },
  { n: 2, label: "Lease terms" },
  { n: 3, label: "Billing" },
  { n: 4, label: "Services" },
  { n: 5, label: "Review" },
] as const;

type ServiceLine = {
  serviceId: number;
  name: string;
  selected: boolean;
  rate: string;
  currency: string;
};

export function TenantOnboardingWizard() {
  const router = useRouter();
  const { orgId, orgReady } = useOrg();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantType, setTenantType] = useState<TenantType>("individual");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [showMoreTenant, setShowMoreTenant] = useState(false);
  const [tenantCity, setTenantCity] = useState("");
  const [tenantCountry, setTenantCountry] = useState("");

  const [unitQuery, setUnitQuery] = useState("");
  const debouncedUnitQ = useDebouncedValue(unitQuery, 300);
  const [unitHits, setUnitHits] = useState<UnitDto[]>([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitDto | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [rentCurrency, setRentCurrency] = useState("USD");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("USD");
  const [billingCycle, setBillingCycle] = useState<string>(DEFAULT_BILLING_CYCLE);
  const [managedBy, setManagedBy] = useState<string>("");

  const [billingSame, setBillingSame] = useState(true);
  const [billLine1, setBillLine1] = useState("");
  const [billLine2, setBillLine2] = useState("");
  const [billCity, setBillCity] = useState("");
  const [billRegion, setBillRegion] = useState("");
  const [billPostal, setBillPostal] = useState("");
  const [billCountry, setBillCountry] = useState("");

  const [staff, setStaff] = useState<{ id: number; label: string }[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const [roles, svc] = await Promise.all([listOrgUserRoles(), listOrgServices()]);
        if (cancelled) return;
        const byUser = new Map<number, string>();
        for (const r of roles) {
          if (!byUser.has(r.user)) byUser.set(r.user, r.user_label);
        }
        setStaff(
          [...byUser.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label)),
        );
        setServiceLines(
          svc.map((s) => ({
            serviceId: s.id,
            name: s.name,
            selected: false,
            rate: "",
            currency: (s.currency && s.currency.trim()) || "USD",
          })),
        );
      } catch {
        if (!cancelled) setFormError("Could not load staff or services.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgReady, orgId]);

  useEffect(() => {
    if (debouncedUnitQ.trim().length < 1) {
      setUnitHits([]);
      return;
    }
    let cancelled = false;
    setUnitLoading(true);
    listUnits({
      search: debouncedUnitQ.trim(),
      pageSize: 25,
      available_for_lease: true,
    })
      .then((r) => {
        if (!cancelled) setUnitHits(r.results);
      })
      .catch(() => {
        if (!cancelled) setUnitHits([]);
      })
      .finally(() => {
        if (!cancelled) setUnitLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedUnitQ]);

  const canNext = useMemo(() => {
    if (step === 1) return tenantName.trim().length > 0;
    if (step === 2)
      return (
        selectedUnit != null &&
        !selectedUnit.has_active_lease &&
        startDate.length > 0 &&
        rentAmount.trim().length > 0 &&
        rentCurrency.trim().length > 0
      );
    if (step === 3) {
      if (billingSame) return true;
      return billLine1.trim().length > 0 && billCity.trim().length > 0;
    }
    if (step === 4)
      return serviceLines.every((l) => !l.selected || l.rate.trim().length > 0);
    return true;
  }, [
    step,
    tenantName,
    selectedUnit,
    startDate,
    rentAmount,
    rentCurrency,
    billingSame,
    billLine1,
    billCity,
    serviceLines,
  ]);

  const goNext = () => {
    setFormError(null);
    if (!canNext) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const goBack = () => {
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const toggleService = (id: number) => {
    setServiceLines((lines) =>
      lines.map((l) => (l.serviceId === id ? { ...l, selected: !l.selected } : l)),
    );
  };

  const setServiceRate = (id: number, rate: string) => {
    setServiceLines((lines) => lines.map((l) => (l.serviceId === id ? { ...l, rate } : l)));
  };

  const setServiceCurrency = (serviceId: number, currency: string) => {
    setServiceLines((lines) =>
      lines.map((l) => (l.serviceId === serviceId ? { ...l, currency } : l)),
    );
  };

  const submit = useCallback(async () => {
    if (orgId == null) return;
    setFormError(null);
    if (selectedUnit?.has_active_lease) {
      setFormError("This unit already has an active lease. Choose another unit.");
      return;
    }
    setSubmitting(true);
    try {
      const tenant = await createTenant({
        org: orgId,
        name: tenantName.trim(),
        tenant_type: tenantType,
        email: tenantEmail.trim() || undefined,
        phone: tenantPhone.trim() || undefined,
        city: tenantCity.trim() || undefined,
        country_code: tenantCountry.trim() || undefined,
      });

      const managedId =
        managedBy === "" ? null : Number.parseInt(managedBy, 10);
      const lease = await createLease({
        unit: selectedUnit!.id,
        tenant: tenant.id,
        managed_by: Number.isFinite(managedId as number) ? managedId : null,
        start_date: startDate,
        end_date: endDate.trim() || null,
        rent_amount: rentAmount.trim(),
        rent_currency: rentCurrency.trim(),
        deposit_amount: depositAmount.trim() || null,
        deposit_currency: depositCurrency.trim(),
        billing_cycle: billingCycle,
        status: "active",
        billing_same_as_tenant_address: billingSame,
        billing_address_line1: billingSame ? "" : billLine1.trim(),
        billing_address_line2: billingSame ? "" : billLine2.trim(),
        billing_city: billingSame ? "" : billCity.trim(),
        billing_region: billingSame ? "" : billRegion.trim(),
        billing_postal_code: billingSame ? "" : billPostal.trim(),
        billing_country_code: billingSame ? "" : billCountry.trim(),
      });

      const subs = serviceLines.filter((l) => l.selected && l.rate.trim().length > 0);
      for (const line of subs) {
        await createServiceSubscription({
          lease: lease.id,
          service: line.serviceId,
          rate: line.rate.trim(),
          currency: line.currency.trim(),
          billing_cycle: billingCycle,
        });
      }

      router.push("/dashboard/leases");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.messageForUser
          : e instanceof Error
            ? e.message
            : "Something went wrong.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    orgId,
    tenantName,
    tenantType,
    tenantEmail,
    tenantPhone,
    tenantCity,
    tenantCountry,
    selectedUnit,
    managedBy,
    startDate,
    endDate,
    rentAmount,
    rentCurrency,
    depositAmount,
    depositCurrency,
    billingCycle,
    billingSame,
    billLine1,
    billLine2,
    billCity,
    billRegion,
    billPostal,
    billCountry,
    serviceLines,
    router,
  ]);

  if (!orgReady || orgId == null) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading organization…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-main">
      <header className="shrink-0 border-b border-[#E5E7EB] bg-white px-4 py-4 md:px-6">
        <Link
          href="/dashboard/tenants"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-navy"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tenants
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-medium text-brand-navy md:text-[28px]">
          New tenant onboarding
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Add a tenant, lease, billing, and optional services in guided steps.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl">
          <Stepper current={step} />

          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            {formError ? (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            {step === 1 && (
              <section className="space-y-4" aria-labelledby="step-1-title">
                <h2 id="step-1-title" className="text-lg font-semibold text-brand-navy">
                  Tenant info
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Start with the basics. You can add more detail anytime later.
                </p>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Name <span className="text-red-600">*</span>
                  </span>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Full name or company name"
                    autoComplete="name"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Type</span>
                    <select
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={tenantType}
                      onChange={(e) => setTenantType(e.target.value as TenantType)}
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Email</span>
                    <input
                      type="email"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Phone</span>
                    <input
                      type="tel"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      placeholder="+254 …"
                      autoComplete="tel"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-brand-blue hover:underline"
                  onClick={() => setShowMoreTenant((v) => !v)}
                >
                  {showMoreTenant ? "Hide" : "More"} address fields
                </button>
                {showMoreTenant ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">City</span>
                      <input
                        className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                        value={tenantCity}
                        onChange={(e) => setTenantCity(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                        Country code
                      </span>
                      <input
                        className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm uppercase outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                        value={tenantCountry}
                        onChange={(e) => setTenantCountry(e.target.value)}
                        placeholder="KE"
                        maxLength={2}
                      />
                    </label>
                  </div>
                ) : null}
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4" aria-labelledby="step-2-title">
                <h2 id="step-2-title" className="text-lg font-semibold text-brand-navy">
                  Lease terms
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Search by building name, city, or unit number. Only units available for a new lease
                  are shown (vacant, no active tenancy; not in maintenance).
                </p>
                <div className="relative">
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      Unit <span className="text-red-600">*</span>
                    </span>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={selectedUnit ? `${selectedUnit.building_name ?? "Building"} · ${selectedUnit.unit_number}` : unitQuery}
                      onChange={(e) => {
                        setSelectedUnit(null);
                        setUnitQuery(e.target.value);
                        setUnitOpen(true);
                      }}
                      onFocus={() => setUnitOpen(true)}
                      placeholder="Search units…"
                      role="combobox"
                      aria-expanded={unitOpen}
                      aria-autocomplete="list"
                    />
                  </label>
                  {unitOpen && (unitQuery.trim().length > 0 || unitHits.length > 0) ? (
                    <ul
                      className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
                      role="listbox"
                    >
                      {unitLoading ? (
                        <li className="px-3 py-2 text-sm text-[#6B7280]">Searching…</li>
                      ) : unitHits.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-[#6B7280]">No matches</li>
                      ) : (
                        unitHits.map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-section"
                              onClick={() => {
                                setSelectedUnit(u);
                                setUnitQuery("");
                                setUnitOpen(false);
                              }}
                            >
                              <span className="font-medium text-[#1A1A1A]">
                                {u.building_name ?? `Building #${u.building}`} · {u.unit_number}
                              </span>
                              <span className="ml-2 text-[#6B7280]">{u.status}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      Start date <span className="text-red-600">*</span>
                    </span>
                    <input
                      type="date"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">End date</span>
                    <input
                      type="date"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      Rent amount <span className="text-red-600">*</span>
                    </span>
                    <input
                      inputMode="decimal"
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      Currency <span className="text-red-600">*</span>
                    </span>
                    <select
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
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
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
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
                      className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
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

                <label className="block max-w-xs">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Billing cycle</span>
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
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

                <label className="block max-w-md">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Managed by</span>
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
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
                  <p className="mt-1 text-xs text-[#9CA3AF]">Staff members in this organization.</p>
                </label>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-4" aria-labelledby="step-3-title">
                <h2 id="step-3-title" className="text-lg font-semibold text-brand-navy">
                  Billing
                </h2>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#D1D5DB] text-brand-navy focus:ring-brand-navy"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                  />
                  <span className="text-sm text-[#1A1A1A]">Billing address same as tenant correspondence</span>
                </label>
                {!billingSame ? (
                  <div className="space-y-3 border-t border-[#F3F4F6] pt-4">
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                        Address line 1 <span className="text-red-600">*</span>
                      </span>
                      <input
                        className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                        value={billLine1}
                        onChange={(e) => setBillLine1(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Address line 2</span>
                      <input
                        className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                        value={billLine2}
                        onChange={(e) => setBillLine2(e.target.value)}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                          City <span className="text-red-600">*</span>
                        </span>
                        <input
                          className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          value={billCity}
                          onChange={(e) => setBillCity(e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Region</span>
                        <input
                          className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          value={billRegion}
                          onChange={(e) => setBillRegion(e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Postal code</span>
                        <input
                          className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          value={billPostal}
                          onChange={(e) => setBillPostal(e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                          Country (ISO-2)
                        </span>
                        <input
                          className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm uppercase outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
                          value={billCountry}
                          onChange={(e) => setBillCountry(e.target.value)}
                          maxLength={2}
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {step === 4 && (
              <section className="space-y-4" aria-labelledby="step-4-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 id="step-4-title" className="text-lg font-semibold text-brand-navy">
                    Services
                  </h2>
                  <button
                    type="button"
                    className="h-9 shrink-0 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-brand-navy hover:bg-[#F9FAFB]"
                    onClick={() => setServiceModalOpen(true)}
                  >
                    Add service
                  </button>
                </div>
                <p className="text-sm text-[#6B7280]">
                  Optionally subscribe this lease to billable services. Enter a rate for each selected service.
                </p>
                {serviceLines.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-6 text-center">
                    <p className="text-sm text-[#6B7280]">No active services yet.</p>
                    <button
                      type="button"
                      className="mt-3 text-sm font-medium text-brand-blue hover:text-brand-navy hover:underline"
                      onClick={() => setServiceModalOpen(true)}
                    >
                      Add a service
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-[#E5E7EB]">
                    {serviceLines.map((line) => (
                      <li key={line.serviceId} className="flex flex-wrap items-center gap-3 px-3 py-3">
                        <label className="flex min-w-0 flex-1 items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#D1D5DB] text-brand-navy focus:ring-brand-navy"
                            checked={line.selected}
                            onChange={() => toggleService(line.serviceId)}
                          />
                          <span className="text-sm font-medium text-[#1A1A1A]">{line.name}</span>
                        </label>
                        <input
                          inputMode="decimal"
                          placeholder="Rate"
                          disabled={!line.selected}
                          className="h-9 w-28 rounded-lg border border-[#D1D5DB] px-2 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20 disabled:bg-[#F9FAFB]"
                          value={line.rate}
                          onChange={(e) => setServiceRate(line.serviceId, e.target.value)}
                        />
                        <select
                          className="h-9 w-[5.5rem] rounded-lg border border-[#D1D5DB] bg-white px-1 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20 disabled:bg-[#F9FAFB]"
                          value={line.currency}
                          disabled={!line.selected}
                          onChange={(e) =>
                            setServiceCurrency(line.serviceId, e.target.value)
                          }
                          aria-label={`Currency for ${line.name}`}
                        >
                          {RENT_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {step === 5 && (
              <section className="space-y-4" aria-labelledby="step-5-title">
                <h2 id="step-5-title" className="text-lg font-semibold text-brand-navy">
                  Review
                </h2>
                <dl className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-[#F3F4F6] py-2">
                    <dt className="text-[#6B7280]">Tenant</dt>
                    <dd className="text-right font-medium text-[#1A1A1A]">{tenantName}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#F3F4F6] py-2">
                    <dt className="text-[#6B7280]">Unit</dt>
                    <dd className="text-right font-medium text-[#1A1A1A]">
                      {selectedUnit
                        ? `${selectedUnit.building_name ?? "Building"} · ${selectedUnit.unit_number}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#F3F4F6] py-2">
                    <dt className="text-[#6B7280]">Rent</dt>
                    <dd className="text-right font-medium text-[#1A1A1A]">
                      {rentAmount} {rentCurrency} ({billingCycle})
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#F3F4F6] py-2">
                    <dt className="text-[#6B7280]">Deposit</dt>
                    <dd className="text-right font-medium text-[#1A1A1A]">
                      {depositAmount.trim()
                        ? `${depositAmount} ${depositCurrency}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#F3F4F6] py-2">
                    <dt className="text-[#6B7280]">Managed by</dt>
                    <dd className="text-right text-[#1A1A1A]">
                      {managedBy
                        ? staff.find((s) => String(s.id) === managedBy)?.label ?? "—"
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#F3F4F6] py-2">
                    <dt className="text-[#6B7280]">Services</dt>
                    <dd className="text-right text-[#1A1A1A]">
                      {serviceLines.filter((l) => l.selected && l.rate.trim()).length > 0
                        ? serviceLines
                            .filter((l) => l.selected && l.rate.trim())
                            .map((l) => `${l.name} (${l.rate} ${l.currency})`)
                            .join(", ")
                        : "None"}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-[#F3F4F6] pt-6">
              <button
                type="button"
                className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
                onClick={goBack}
                disabled={step === 1 || submitting}
              >
                Back
              </button>
              <div className="flex gap-2">
                {step < 5 ? (
                  <button
                    type="button"
                    className="h-10 rounded-lg bg-brand-navy px-5 text-sm font-medium text-white hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={goNext}
                    disabled={!canNext || submitting}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    className="h-10 rounded-lg bg-brand-navy px-5 text-sm font-medium text-white hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void submit()}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Complete onboarding"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {orgId != null ? (
        <QuickCreateServiceModal
          open={serviceModalOpen}
          orgId={orgId}
          onClose={() => setServiceModalOpen(false)}
          onCreated={(svc: ServiceDto) => {
            setServiceLines((lines) => {
              if (lines.some((l) => l.serviceId === svc.id)) return lines;
                return [
                ...lines,
                {
                  serviceId: svc.id,
                  name: svc.name,
                  selected: true,
                  rate: "",
                  currency: (svc.currency && svc.currency.trim()) || "USD",
                },
              ];
            });
          }}
        />
      ) : null}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Onboarding steps">
      <ol className="flex flex-wrap items-center gap-2 md:gap-0">
        {STEPS.map((s, idx) => {
          const done = current > s.n;
          const active = current === s.n;
          return (
            <li key={s.n} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? "bg-[#2E7D32] text-white"
                      : active
                        ? "bg-brand-blue text-white ring-2 ring-brand-blue/30"
                        : "border border-[#D1D5DB] bg-white text-[#9CA3AF]"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:inline ${active ? "text-brand-navy" : "text-[#6B7280]"}`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 ? (
                <div
                  className="mx-2 hidden h-px min-w-[1rem] flex-1 bg-[#E5E7EB] md:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
