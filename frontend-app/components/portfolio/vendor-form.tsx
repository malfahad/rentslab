"use client";

import { useEffect, useState } from "react";
import {
  parseJsonObjectField,
  stringifyJsonObjectField,
} from "@/lib/portfolio-json";
import type { JsonObject } from "@/types/portfolio";
import type { VendorCreate, VendorDto } from "@/types/operations";

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";
const textareaClass =
  "mt-1 min-h-[72px] w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

export type VendorFormValues = Omit<VendorCreate, "org">;

function dtoToFormState(d: VendorDto): VendorFormValues {
  return {
    name: d.name,
    vendor_type: d.vendor_type ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    address_line1: d.address_line1 ?? "",
    address_line2: d.address_line2 ?? "",
    city: d.city ?? "",
    region: d.region ?? "",
    postal_code: d.postal_code ?? "",
    country_code: d.country_code ?? "",
    tax_id: d.tax_id ?? "",
    payment_terms: d.payment_terms ?? "",
    bank_details: d.bank_details ?? null,
    contact_info: d.contact_info ?? null,
    is_active: d.is_active,
    internal_notes: d.internal_notes ?? "",
  };
}

export function VendorForm({
  formId,
  initial,
  onSubmit,
  pending,
}: {
  formId: string;
  initial?: VendorDto | null;
  onSubmit: (values: VendorFormValues) => Promise<void>;
  pending?: boolean;
}) {
  const [name, setName] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [contactInfoJson, setContactInfoJson] = useState("");
  const [bankDetailsJson, setBankDetailsJson] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonError(null);
    if (initial) {
      const s = dtoToFormState(initial);
      setName(s.name);
      setVendorType(s.vendor_type ?? "");
      setEmail(s.email ?? "");
      setPhone(s.phone ?? "");
      setAddressLine1(s.address_line1 ?? "");
      setAddressLine2(s.address_line2 ?? "");
      setCity(s.city ?? "");
      setRegion(s.region ?? "");
      setPostalCode(s.postal_code ?? "");
      setCountryCode(s.country_code ?? "");
      setTaxId(s.tax_id ?? "");
      setPaymentTerms(s.payment_terms ?? "");
      setContactInfoJson(stringifyJsonObjectField(s.contact_info));
      setBankDetailsJson(stringifyJsonObjectField(s.bank_details));
      setIsActive(s.is_active ?? true);
      setInternalNotes(s.internal_notes ?? "");
    } else {
      setName("");
      setVendorType("");
      setEmail("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setRegion("");
      setPostalCode("");
      setCountryCode("");
      setTaxId("");
      setPaymentTerms("");
      setContactInfoJson("");
      setBankDetailsJson("");
      setIsActive(true);
      setInternalNotes("");
    }
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJsonError(null);
    let contact_info: JsonObject | null = null;
    let bank_details: JsonObject | null = null;
    try {
      contact_info = parseJsonObjectField(contactInfoJson);
    } catch {
      setJsonError("Contact info is not valid JSON object.");
      return;
    }
    try {
      bank_details = parseJsonObjectField(bankDetailsJson);
    } catch {
      setJsonError("Bank details is not valid JSON object.");
      return;
    }
    const values: VendorFormValues = {
      name: name.trim(),
      vendor_type: vendorType.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim(),
      city: city.trim(),
      region: region.trim(),
      postal_code: postalCode.trim(),
      country_code: countryCode.trim().toUpperCase().slice(0, 2),
      tax_id: taxId.trim(),
      payment_terms: paymentTerms.trim(),
      bank_details,
      contact_info,
      is_active: isActive,
      internal_notes: internalNotes.trim(),
    };
    await onSubmit(values);
  }

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)}>


      <fieldset className="mt-4 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Identity
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Name</span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Plumbing Ltd"
            data-testid="vendor-form-name"
            disabled={pending}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Vendor type</span>
          <input
            className={inputClass}
            value={vendorType}
            onChange={(e) => setVendorType(e.target.value)}
            placeholder="e.g. plumbing, electrical"
            disabled={pending}
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#D1D5DB] text-brand-navy focus:ring-brand-navy/20"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={pending}
          />
          <span className="font-medium text-[#374151]">Active</span>
        </label>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Contact
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Email</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="accounts@example.com"
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Phone</span>
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="E.164 or local"
            disabled={pending}
          />
        </label>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Address
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Line 1</span>
          <input
            className={inputClass}
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Line 2</span>
          <input
            className={inputClass}
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            disabled={pending}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">City</span>
            <input
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Region</span>
            <input
              className={inputClass}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={pending}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Postal code</span>
            <input
              className={inputClass}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Country (ISO-2)</span>
            <input
              className={inputClass}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              maxLength={2}
              placeholder="KE"
              disabled={pending}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Commercial
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Tax ID</span>
          <input
            className={inputClass}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Payment terms</span>
          <input
            className={inputClass}
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="e.g. Net 30"
            disabled={pending}
          />
        </label>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Internal
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Notes</span>
          <textarea
            className={textareaClass}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Private notes for your team"
            disabled={pending}
          />
        </label>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          JSON (optional)
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Contact info</span>
          <textarea
            className={textareaClass}
            value={contactInfoJson}
            onChange={(e) => setContactInfoJson(e.target.value)}
            placeholder='{"whatsapp": "+254..."}'
            spellCheck={false}
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Bank details</span>
          <textarea
            className={textareaClass}
            value={bankDetailsJson}
            onChange={(e) => setBankDetailsJson(e.target.value)}
            placeholder="Structured payout metadata"
            spellCheck={false}
            disabled={pending}
          />
        </label>
      </fieldset>

      {jsonError ? (
        <p className="mt-3 text-sm text-red-700">{jsonError}</p>
      ) : null}
    </form>
  );
}
