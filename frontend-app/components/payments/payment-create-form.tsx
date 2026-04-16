"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/errors";
import { getInvoice, listAllInvoicesForTenant } from "@/services/invoice-service";
import { getLease, listLeases } from "@/services/lease-service";
import { createPayment } from "@/services/payment-service";
import { getTenant, listTenants } from "@/services/tenant-service";
import type { InvoiceDto } from "@/types/billing";
import type { LeaseDto, TenantDto } from "@/types/operations";

const METHOD_OPTIONS = [
  { value: "bank", label: "Bank" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

const FORM_ID = "payment-create-form";

function localDateTimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse user decimal input; returns null if empty/invalid. */
function parseDecimalInput(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  if (Number.isNaN(n)) return null;
  return n;
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function leaseDisplayLabel(l: LeaseDto): string {
  const unit = l.unit_label?.trim() || `Lease #${l.id}`;
  const b = l.building_name?.trim();
  return b ? `${unit} · ${b}` : unit;
}

function parsePositiveInt(raw: string | null | undefined): number | undefined {
  const t = (raw ?? "").trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function PaymentCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceFromUrl = searchParams.get("invoice");
  const tenantListId = useId();
  const leaseListId = useId();

  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);

  const [selectedTenant, setSelectedTenant] = useState<TenantDto | null>(null);
  const [tenantQuery, setTenantQuery] = useState("");
  const debouncedTenantQ = useDebouncedValue(tenantQuery.trim(), 300);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [tenantHits, setTenantHits] = useState<TenantDto[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);

  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);
  const [leaseQuery, setLeaseQuery] = useState("");
  const debouncedLeaseQ = useDebouncedValue(leaseQuery.trim(), 200);
  const [leaseOpen, setLeaseOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");
  const [paymentLocal, setPaymentLocal] = useState(() =>
    localDateTimeInputValue(new Date()),
  );
  const [allocByInvoice, setAllocByInvoice] = useState<Record<number, string>>(
    {},
  );

  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [prefillInvoiceId, setPrefillInvoiceId] = useState<number | null>(null);
  const prefillAppliedRef = useRef(false);

  const tenantWrapRef = useRef<HTMLDivElement>(null);
  const leaseWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (tenantWrapRef.current && !tenantWrapRef.current.contains(t)) {
        setTenantOpen(false);
      }
      if (leaseWrapRef.current && !leaseWrapRef.current.contains(t)) {
        setLeaseOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (selectedTenant) return;
    if (debouncedTenantQ.length < 1) {
      setTenantHits([]);
      return;
    }
    let cancelled = false;
    setTenantLoading(true);
    (async () => {
      try {
        const r = await listTenants({
          search: debouncedTenantQ,
          pageSize: 24,
          ordering: "name",
        });
        if (!cancelled) setTenantHits(r.results);
      } catch {
        if (!cancelled) setTenantHits([]);
      } finally {
        if (!cancelled) setTenantLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedTenantQ, selectedTenant]);

  const tid = selectedTenant?.id ?? null;

  const loadLeasesAndInvoices = useCallback(
    async (tenantPk: number) => {
      setLoadError(null);
      try {
        const restrictToUnpaid = !invoiceFromUrl?.trim();
        const [leaseRes, invs] = await Promise.all([
          listLeases({ tenant: tenantPk, pageSize: 100, ordering: "-start_date" }),
          listAllInvoicesForTenant(tenantPk, {
            status: restrictToUnpaid ? "unpaid" : undefined,
          }),
        ]);
        setLeases(leaseRes.results);
        setInvoices(invs);
        setAllocByInvoice({});
        setSelectedLeaseId(null);
        setLeaseQuery("");
      } catch (e) {
        setLeases([]);
        setInvoices([]);
        setLoadError(
          e instanceof ApiError ? e.messageForUser : "Could not load lease data.",
        );
      }
    },
    [invoiceFromUrl],
  );

  useEffect(() => {
    if (tid == null || !Number.isFinite(tid)) {
      setLeases([]);
      setInvoices([]);
      setSelectedLeaseId(null);
      setLeaseQuery("");
      setAllocByInvoice({});
      return;
    }
    void loadLeasesAndInvoices(tid);
  }, [tid, loadLeasesAndInvoices]);

  useEffect(() => {
    const invId = parsePositiveInt(invoiceFromUrl);
    if (invId == null) {
      setPrefillInvoiceId(null);
      prefillAppliedRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const inv = await getInvoice(invId);
        const lease = await getLease(inv.lease);
        const tenant = await getTenant(lease.tenant);
        if (cancelled) return;
        setSelectedTenant(tenant);
        setSelectedLeaseId(inv.lease);
        setPrefillInvoiceId(invId);
        prefillAppliedRef.current = false;
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof ApiError
              ? e.messageForUser
              : "Could not load invoice for this payment.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceFromUrl]);

  const visibleInvoices = useMemo(() => {
    if (selectedLeaseId == null) return invoices;
    return invoices.filter((inv) => inv.lease === selectedLeaseId);
  }, [invoices, selectedLeaseId]);

  useEffect(() => {
    if (prefillInvoiceId == null || prefillAppliedRef.current) return;
    const inv = visibleInvoices.find((i) => i.id === prefillInvoiceId);
    if (!inv) return;
    prefillAppliedRef.current = true;
    const out = inv.outstanding_amount?.trim() ?? "";
    if (out) {
      setAmount(out);
      setAllocByInvoice((prev) => ({ ...prev, [inv.id]: out }));
    }
  }, [visibleInvoices, prefillInvoiceId]);

  const invoiceTotalById = useMemo(() => {
    const m = new Map<number, number>();
    for (const inv of visibleInvoices) {
      const v = parseDecimalInput(inv.total_amount);
      if (v != null) m.set(inv.id, v);
    }
    return m;
  }, [visibleInvoices]);

  const paymentAmountNum = useMemo(() => parseDecimalInput(amount), [amount]);

  const allocationBreakdown = useMemo(() => {
    let totalApplied = 0;
    const rowErrors: Record<number, string> = {};
    for (const inv of visibleInvoices) {
      const raw = (allocByInvoice[inv.id] ?? "").trim();
      if (raw === "") continue;
      const applied = parseDecimalInput(raw);
      if (applied == null) {
        rowErrors[inv.id] = "Invalid amount";
        continue;
      }
      if (applied <= 0) {
        rowErrors[inv.id] = "Must be greater than zero";
        continue;
      }
      const cap = invoiceTotalById.get(inv.id);
      if (cap != null && applied > cap + 0.000001) {
        rowErrors[inv.id] = `Cannot exceed invoice total (${formatMoney(cap)})`;
        continue;
      }
      totalApplied += applied;
    }
    const roundedApplied = Math.round(totalApplied * 100) / 100;
    const pay = paymentAmountNum;
    const unallocated =
      pay != null ? Math.round((pay - roundedApplied) * 100) / 100 : null;
    const overPayment =
      pay != null && roundedApplied > pay + 0.000001 ? roundedApplied - pay : 0;
    return {
      totalApplied: roundedApplied,
      unallocated,
      overPayment,
      rowErrors,
      hasRowErrors: Object.keys(rowErrors).length > 0,
    };
  }, [visibleInvoices, allocByInvoice, invoiceTotalById, paymentAmountNum]);

  const {
    totalApplied,
    unallocated,
    overPayment,
    rowErrors,
    hasRowErrors,
  } = allocationBreakdown;

  const canSubmit =
    tid != null &&
    paymentAmountNum != null &&
    paymentAmountNum > 0 &&
    overPayment <= 0.000001 &&
    !hasRowErrors &&
    !pending;

  const leaseHits = useMemo(() => {
    if (leases.length === 0) return [];
    const q = debouncedLeaseQ.toLowerCase();
    if (q === "") return leases;
    return leases.filter((l) => {
      const label = leaseDisplayLabel(l).toLowerCase();
      const tn = (l.tenant_name ?? "").toLowerCase();
      return label.includes(q) || tn.includes(q) || String(l.id).includes(q);
    });
  }, [leases, debouncedLeaseQ]);

  const selectedLease =
    selectedLeaseId != null
      ? leases.find((l) => l.id === selectedLeaseId)
      : null;

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (tid == null || !Number.isFinite(tid)) {
      setFormError("Select a tenant.");
      return;
    }
    const amt = amount.trim();
    const pay = parseDecimalInput(amt);
    if (pay == null || pay <= 0) {
      setFormError("Enter a valid payment amount.");
      return;
    }
    if (overPayment > 0.000001) {
      setFormError("Total applied cannot exceed the payment amount.");
      return;
    }
    if (hasRowErrors) {
      setFormError("Fix invoice allocation amounts.");
      return;
    }
    const allocations: { invoice: number; amount_applied: string }[] = [];
    for (const inv of visibleInvoices) {
      const raw = (allocByInvoice[inv.id] ?? "").trim();
      if (raw === "") continue;
      const n = parseDecimalInput(raw);
      if (n == null || n <= 0) continue;
      allocations.push({ invoice: inv.id, amount_applied: raw.trim() });
    }
    const paymentDateIso = new Date(paymentLocal).toISOString();
    setPending(true);
    try {
      const created = await createPayment({
        tenant: tid,
        lease: selectedLeaseId,
        amount: amt,
        method,
        reference: reference.trim() || undefined,
        payment_date: paymentDateIso,
        ...(allocations.length > 0 ? { allocations } : {}),
      });
      router.push(`/dashboard/payments/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.messageForUser : "Could not save payment.",
      );
    } finally {
      setPending(false);
    }
  }

  const tenantInputValue = selectedTenant
    ? selectedTenant.name
    : tenantQuery;

  const leaseInputValue =
    selectedLease != null ? leaseDisplayLabel(selectedLease) : leaseQuery;

  return (
    <PortfolioFormShell
      backHref="/dashboard/payments"
      backLabel="Back to payments"
      title="Add payment"
      description="Record money received and optionally apply it to open invoices."
      footer={
        <>
          <Link
            href="/dashboard/payments"
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary-sm h-10 px-5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
          >
            {pending ? "Saving…" : "Save payment"}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="space-y-5" onSubmit={handleSubmit}>
        {formError ? (
          <p className="text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}
        {loadError ? (
          <p className="text-sm text-amber-800" role="status">
            {loadError}
          </p>
        ) : null}

        <div className="relative" ref={tenantWrapRef}>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Tenant</span>
            <input
              required
              className={inputClass}
              value={tenantInputValue}
              onChange={(e) => {
                setSelectedTenant(null);
                setTenantQuery(e.target.value);
                setTenantOpen(true);
              }}
              onFocus={() => setTenantOpen(true)}
              placeholder="Search by name, email, phone…"
              role="combobox"
              aria-expanded={tenantOpen}
              aria-controls={tenantListId}
              aria-autocomplete="list"
              autoComplete="off"
            />
          </label>
          {tenantOpen &&
          (!selectedTenant || tenantQuery.length > 0) &&
          (tenantQuery.trim().length > 0 || tenantHits.length > 0) ? (
            <ul
              id={tenantListId}
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
              role="listbox"
            >
              {tenantLoading ? (
                <li className="px-3 py-2 text-sm text-[#6B7280]">Searching…</li>
              ) : tenantHits.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[#6B7280]">
                  {debouncedTenantQ.length < 1
                    ? "Type to search tenants"
                    : "No matches"}
                </li>
              ) : (
                tenantHits.map((t) => (
                  <li key={t.id} role="option">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-section"
                      onClick={() => {
                        setSelectedTenant(t);
                        setTenantQuery("");
                        setTenantOpen(false);
                      }}
                    >
                      <span className="font-medium text-[#1A1A1A]">{t.name}</span>
                      {t.email?.trim() ? (
                        <span className="ml-2 text-[#6B7280]">{t.email}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        <div className="relative" ref={leaseWrapRef}>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Lease (optional)</span>
            <input
              className={inputClass}
              disabled={tid == null}
              value={leaseInputValue}
              onChange={(e) => {
                setSelectedLeaseId(null);
                setLeaseQuery(e.target.value);
                setLeaseOpen(true);
              }}
              onFocus={() => {
                if (tid != null) setLeaseOpen(true);
              }}
              placeholder={
                tid == null
                  ? "Select a tenant first"
                  : "Search leases or leave empty…"
              }
              role="combobox"
              aria-expanded={leaseOpen}
              aria-controls={leaseListId}
              aria-autocomplete="list"
              autoComplete="off"
            />
          </label>
          {tid != null && leaseOpen ? (
            <ul
              id={leaseListId}
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
              role="listbox"
            >
              <li role="option">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-section"
                  onClick={() => {
                    setSelectedLeaseId(null);
                    setLeaseQuery("");
                    setLeaseOpen(false);
                  }}
                >
                  <span className="text-[#6B7280]">Not linked to a single lease</span>
                </button>
              </li>
              {leaseHits.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[#6B7280]">No matches</li>
              ) : (
                leaseHits.map((l) => (
                  <li key={l.id} role="option">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-section"
                      onClick={() => {
                        setSelectedLeaseId(l.id);
                        setLeaseQuery("");
                        setLeaseOpen(false);
                      }}
                    >
                      <span className="font-medium text-[#1A1A1A]">
                        {leaseDisplayLabel(l)}
                      </span>
                      {l.tenant_name ? (
                        <span className="ml-2 text-[#6B7280]">{l.tenant_name}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Amount</span>
            <input
              required
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Method</span>
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-[#374151]">Payment &amp; allocation</span>
            {paymentAmountNum != null ? (
              <span
                className={
                  overPayment > 0.000001
                    ? "font-medium text-red-700"
                    : hasRowErrors
                      ? "text-amber-800"
                      : "text-[#059669]"
                }
              >
                {overPayment > 0.000001
                  ? `Over by ${formatMoney(overPayment)}`
                  : hasRowErrors
                    ? "Fix row errors"
                    : "Totals in balance"}
              </span>
            ) : null}
          </div>
          <dl className="mt-2 grid gap-1 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[#6B7280]">Payment amount</dt>
              <dd className="font-mono font-semibold text-[#1A1A1A]">
                {paymentAmountNum != null ? formatMoney(paymentAmountNum) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#6B7280]">Total applied to invoices</dt>
              <dd className="font-mono font-semibold text-[#1A1A1A]">
                {formatMoney(totalApplied)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#6B7280]">Unallocated</dt>
              <dd
                className={`font-mono font-semibold ${
                  unallocated != null && unallocated < -0.000001
                    ? "text-red-700"
                    : "text-[#1A1A1A]"
                }`}
              >
                {unallocated != null ? formatMoney(unallocated) : "—"}
              </dd>
            </div>
          </dl>
          {paymentAmountNum != null && overPayment > 0.000001 ? (
            <p className="mt-2 text-xs text-red-700">
              Reduce applied amounts or increase the payment so applied does not
              exceed the payment total.
            </p>
          ) : null}
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Reference</span>
          <input
            type="text"
            className={inputClass}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Bank ref, transaction id…"
            autoComplete="off"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Payment received</span>
          <input
            type="datetime-local"
            required
            className={inputClass}
            value={paymentLocal}
            onChange={(e) => setPaymentLocal(e.target.value)}
          />
        </label>

        {tid != null && visibleInvoices.length > 0 ? (
          <div className="border-t border-[#E5E7EB] pt-4">
            <h2 className="text-sm font-semibold text-[#374151]">
              Apply to unpaid invoices (optional)
            </h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Applied amounts cannot exceed each invoice total or the payment
              amount. Partially paid invoices may still show full total; the
              server will reject if outstanding is lower.
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <tr>
                    <th className="px-3 py-2 font-medium text-[#374151]">
                      Invoice
                    </th>
                    <th className="px-3 py-2 font-medium text-[#374151]">
                      Due
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-[#374151]">
                      Invoice total
                    </th>
                    <th className="px-3 py-2 font-medium text-[#374151]">
                      Apply
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {visibleInvoices.map((inv) => {
                    const cap = invoiceTotalById.get(inv.id);
                    const err = rowErrors[inv.id];
                    return (
                      <tr key={inv.id}>
                        <td className="px-3 py-2 text-[#1A1A1A]">
                          {inv.invoice_number?.trim() || `#${inv.id}`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-[#6B7280]">
                          {inv.due_date}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">
                          {inv.total_amount}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-invalid={err != null}
                            className={`h-9 w-full max-w-[9rem] rounded border px-2 font-mono text-sm ${
                              err
                                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                                : "border-[#D1D5DB] focus:border-brand-navy focus:ring-brand-navy/20"
                            } focus:outline-none focus:ring-2`}
                            placeholder={cap != null ? `max ${formatMoney(cap)}` : "—"}
                            value={allocByInvoice[inv.id] ?? ""}
                            onChange={(e) =>
                              setAllocByInvoice((prev) => ({
                                ...prev,
                                [inv.id]: e.target.value,
                              }))
                            }
                          />
                          {err ? (
                            <p className="mt-1 text-xs text-red-700">{err}</p>
                          ) : cap != null ? (
                            <p className="mt-0.5 text-xs text-[#9CA3AF]">
                              Max {formatMoney(cap)}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-[#E5E7EB] bg-[#FAFBFC]">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-2 text-right text-xs font-medium text-[#6B7280]"
                    >
                      Total applied (this list)
                    </td>
                    <td className="px-3 py-2 font-mono text-sm font-semibold text-[#1A1A1A]">
                      {formatMoney(totalApplied)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}

        {tid != null && !loadError && visibleInvoices.length === 0 ? (
          <p className="text-sm text-[#6B7280]">
            No unpaid invoices for this tenant
            {selectedLeaseId != null ? " on the selected lease" : ""}. You can
            still save the payment.
          </p>
        ) : null}
      </form>
    </PortfolioFormShell>
  );
}
