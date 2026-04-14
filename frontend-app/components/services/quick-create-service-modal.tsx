"use client";

import { useEffect, useId, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { RENT_CURRENCIES } from "@/lib/constants/currencies";
import { createService } from "@/services/catalog-service";
import type { ServiceDto } from "@/types/operations";

const BILLING_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "metered", label: "Metered" },
  { value: "usage_based", label: "Usage-based" },
] as const;

type QuickCreateServiceModalProps = {
  open: boolean;
  orgId: number;
  onClose: () => void;
  /** Called after a successful create with the new service row. */
  onCreated: (service: ServiceDto) => void;
};

export function QuickCreateServiceModal({
  open,
  orgId,
  onClose,
  onCreated,
}: QuickCreateServiceModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [billingType, setBillingType] = useState<string>("fixed");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setBillingType("fixed");
    setCurrency("USD");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createService({
        org: orgId,
        name: trimmed,
        billing_type: billingType,
        currency: currency.trim(),
        is_active: true,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.messageForUser : "Could not create service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="font-serif text-xl font-medium text-brand-navy">
          New service
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Add a billable service to this organization. You can edit details later from Services.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </div>
          ) : null}
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Name</span>
            <input
              className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Water, Security"
              autoFocus
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Billing type</span>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
              value={billingType}
              onChange={(e) => setBillingType(e.target.value)}
            >
              {BILLING_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Currency</span>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {RENT_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-brand-navy px-4 text-sm font-medium text-white hover:bg-[#152a45] disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving…" : "Create service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
