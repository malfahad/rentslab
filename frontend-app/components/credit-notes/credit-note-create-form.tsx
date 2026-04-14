"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/errors";
import { createCreditNote } from "@/services/credit-note-service";
import { getInvoice, listInvoices } from "@/services/invoice-service";
import type { InvoiceDto } from "@/types/billing";

const FORM_ID = "credit-note-create-form";

function localDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDecimalInput(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  if (Number.isNaN(n)) return null;
  return n;
}

export function CreditNoteCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoicePrefillRaw = searchParams.get("invoice") ?? "";
  const listId = useId();

  const [invoiceQuery, setInvoiceQuery] = useState("");
  const debouncedQ = useDebouncedValue(invoiceQuery.trim(), 300);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceHits, setInvoiceHits] = useState<InvoiceDto[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(
    null,
  );
  const [prefillDone, setPrefillDone] = useState(false);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [creditDate, setCreditDate] = useState(() =>
    localDateInputValue(new Date()),
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) {
        setInvoiceOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    const raw = invoicePrefillRaw.trim();
    if (prefillDone || raw === "") return;
    const id = Number(raw);
    if (!Number.isFinite(id)) {
      setPrefillDone(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const inv = await getInvoice(id);
        if (!cancelled) {
          setSelectedInvoice(inv);
          setInvoiceQuery("");
        }
      } catch {
        /* ignore; user can search */
      } finally {
        if (!cancelled) setPrefillDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoicePrefillRaw, prefillDone]);

  useEffect(() => {
    if (selectedInvoice) return;
    if (debouncedQ.length < 1) {
      setInvoiceHits([]);
      return;
    }
    let cancelled = false;
    setInvoiceLoading(true);
    (async () => {
      try {
        const r = await listInvoices({
          search: debouncedQ,
          pageSize: 24,
          ordering: "-issue_date",
        });
        if (!cancelled) setInvoiceHits(r.results);
      } catch {
        if (!cancelled) setInvoiceHits([]);
      } finally {
        if (!cancelled) setInvoiceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, selectedInvoice]);

  const amountNum = parseDecimalInput(amount);
  const canSubmit =
    selectedInvoice != null &&
    amountNum != null &&
    amountNum > 0 &&
    creditDate.trim() !== "" &&
    !pending;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      if (selectedInvoice == null) {
        setFormError("Select an invoice.");
        return;
      }
      const pay = parseDecimalInput(amount);
      if (pay == null || pay <= 0) {
        setFormError("Enter a valid credit amount.");
        return;
      }
      setPending(true);
      try {
        const created = await createCreditNote({
          invoice: selectedInvoice.id,
          amount: amount.trim().replace(/,/g, ""),
          reason: reason.trim() || undefined,
          credit_date: creditDate,
        });
        router.push(`/dashboard/credit-notes/${created.id}`);
      } catch (err) {
        setFormError(
          err instanceof ApiError
            ? err.messageForUser
            : "Could not create credit note.",
        );
      } finally {
        setPending(false);
      }
    },
    [amount, creditDate, reason, router, selectedInvoice],
  );

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20";

  const backHref =
    invoicePrefillRaw.trim() !== ""
      ? `/dashboard/credit-notes?invoice=${encodeURIComponent(invoicePrefillRaw.trim())}`
      : "/dashboard/credit-notes";

  return (
    <PortfolioFormShell
      backHref={backHref}
      backLabel="Back to credit notes"
      title="New credit note"
      description="Issue a credit against an invoice (partial or full)."
      footer={
        <>
          <Link
            href={backHref}
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
            {pending ? "Saving…" : "Create credit note"}
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

        <div className="relative" ref={wrapRef}>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Invoice</span>
            <input
              required
              className={inputClass}
              value={
                selectedInvoice
                  ? `${selectedInvoice.invoice_number?.trim() || `#${selectedInvoice.id}`} · ${selectedInvoice.lease_label?.trim() || `Lease #${selectedInvoice.lease}`} · ${selectedInvoice.total_amount}`
                  : invoiceQuery
              }
              onChange={(e) => {
                setSelectedInvoice(null);
                setInvoiceQuery(e.target.value);
                setInvoiceOpen(true);
              }}
              onFocus={() => setInvoiceOpen(true)}
              placeholder="Search by invoice #, tenant, unit…"
              role="combobox"
              aria-expanded={invoiceOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
            />
          </label>
          {invoiceOpen &&
          (!selectedInvoice || invoiceQuery.length > 0) &&
          (invoiceQuery.trim().length > 0 || invoiceHits.length > 0) ? (
            <ul
              id={listId}
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
              role="listbox"
            >
              {invoiceLoading ? (
                <li className="px-3 py-2 text-sm text-[#6B7280]">Searching…</li>
              ) : invoiceHits.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[#6B7280]">
                  {debouncedQ.length < 1
                    ? "Type to search invoices"
                    : "No matches"}
                </li>
              ) : (
                invoiceHits.map((inv) => (
                  <li key={inv.id} role="option">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-section"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setInvoiceQuery("");
                        setInvoiceOpen(false);
                      }}
                    >
                      <span className="font-medium text-[#1A1A1A]">
                        {inv.invoice_number?.trim() || `Invoice #${inv.id}`}
                      </span>
                      <span className="ml-2 text-[#6B7280]">
                        {inv.lease_label?.trim() || `Lease #${inv.lease}`} ·{" "}
                        {inv.total_amount}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Credit amount</span>
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
            <span className="font-medium text-[#374151]">Credit date</span>
            <input
              required
              type="date"
              className={inputClass}
              value={creditDate}
              onChange={(e) => setCreditDate(e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Reason (optional)</span>
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Goodwill adjustment, billing error…"
            rows={3}
          />
        </label>
      </form>
    </PortfolioFormShell>
  );
}
