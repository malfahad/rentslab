"use client";

import { useEffect, useState } from "react";
import {
  parseJsonObjectField,
  stringifyJsonObjectField,
} from "@/lib/portfolio-json";
import type { JsonObject, LandlordCreate, LandlordDto } from "@/types/portfolio";

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";
const textareaClass =
  "mt-1 min-h-[72px] w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

export type LandlordFormValues = Omit<LandlordCreate, "org">;

function dtoToFormState(d: LandlordDto): LandlordFormValues {
  return {
    name: d.name,
    legal_name: d.legal_name ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    address_line1: d.address_line1 ?? "",
    address_line2: d.address_line2 ?? "",
    city: d.city ?? "",
    region: d.region ?? "",
    postal_code: d.postal_code ?? "",
    country_code: d.country_code ?? "",
    contact_info: d.contact_info ?? null,
    bank_details: d.bank_details ?? null,
  };
}

export function LandlordForm({
  formId,
  initial,
  onSubmit,
  pending,
}: {
  formId: string;
  initial?: LandlordDto | null;
  onSubmit: (values: LandlordFormValues) => Promise<void>;
  pending?: boolean;
}) {
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [contactInfoJson, setContactInfoJson] = useState("");
  const [bankDetailsJson, setBankDetailsJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonError(null);
    if (initial) {
      const s = dtoToFormState(initial);
      setName(s.name);
      setLegalName(s.legal_name ?? "");
      setEmail(s.email ?? "");
      setPhone(s.phone ?? "");
      setAddressLine1(s.address_line1 ?? "");
      setAddressLine2(s.address_line2 ?? "");
      setCity(s.city ?? "");
      setRegion(s.region ?? "");
      setPostalCode(s.postal_code ?? "");
      setCountryCode(s.country_code ?? "");
      setContactInfoJson(stringifyJsonObjectField(s.contact_info));
      setBankDetailsJson(stringifyJsonObjectField(s.bank_details));
    } else {
      setName("");
      setLegalName("");
      setEmail("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setRegion("");
      setPostalCode("");
      setCountryCode("");
      setContactInfoJson("");
      setBankDetailsJson("");
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
    const values: LandlordFormValues = {
      name: name.trim(),
      legal_name: legalName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim(),
      city: city.trim(),
      region: region.trim(),
      postal_code: postalCode.trim(),
      country_code: countryCode.trim().toUpperCase().slice(0, 2),
      contact_info,
      bank_details,
    };
    await onSubmit(values);
  }

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)}>
      <p className="text-xs text-[#6B7280]">
        Legal name, contact, address, and optional JSON for extra contacts or bank
        metadata.
      </p>

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
            placeholder="e.g. Riverside Holdings Ltd"
            data-testid="landlord-form-name"
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Legal name</span>
          <input
            className={inputClass}
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="If different from display name"
            disabled={pending}
          />
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
            placeholder="contact@example.com"
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
            placeholder="Structured bank metadata (encrypted at rest)"
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
