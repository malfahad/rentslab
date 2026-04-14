"use client";

import { useEffect, useState } from "react";
import type { TenantDto, TenantType, TenantUpdate } from "@/types/operations";

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";
const selectClass = inputClass;

export type TenantFormValues = TenantUpdate & {
  name: string;
  tenant_type: TenantType;
};

function dtoToValues(d: TenantDto): TenantFormValues {
  return {
    name: d.name,
    tenant_type: d.tenant_type,
    email: d.email ?? "",
    phone: d.phone ?? "",
    address_line1: d.address_line1 ?? "",
    address_line2: d.address_line2 ?? "",
    city: d.city ?? "",
    region: d.region ?? "",
    postal_code: d.postal_code ?? "",
    country_code: d.country_code ?? "",
    company_registration_number: d.company_registration_number ?? "",
    tax_id: d.tax_id ?? "",
  };
}

export function TenantForm({
  formId,
  initial,
  onSubmit,
  pending,
}: {
  formId: string;
  initial?: TenantDto | null;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  pending?: boolean;
}) {
  const [name, setName] = useState("");
  const [tenantType, setTenantType] = useState<TenantType>("individual");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [companyReg, setCompanyReg] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    if (initial) {
      const s = dtoToValues(initial);
      setName(s.name);
      setTenantType(s.tenant_type);
      setEmail(s.email ?? "");
      setPhone(s.phone ?? "");
      setAddressLine1(s.address_line1 ?? "");
      setAddressLine2(s.address_line2 ?? "");
      setCity(s.city ?? "");
      setRegion(s.region ?? "");
      setPostalCode(s.postal_code ?? "");
      setCountryCode(s.country_code ?? "");
      setCompanyReg(s.company_registration_number ?? "");
      setTaxId(s.tax_id ?? "");
    } else {
      setName("");
      setTenantType("individual");
      setEmail("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setRegion("");
      setPostalCode("");
      setCountryCode("");
      setCompanyReg("");
      setTaxId("");
    }
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({
      name: trimmed,
      tenant_type: tenantType,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address_line1: addressLine1.trim() || undefined,
      address_line2: addressLine2.trim() || undefined,
      city: city.trim() || undefined,
      region: region.trim() || undefined,
      postal_code: postalCode.trim() || undefined,
      country_code: countryCode.trim() || undefined,
      company_registration_number: companyReg.trim() || undefined,
      tax_id: taxId.trim() || undefined,
    });
  }

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Profile
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#374151]">Name *</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
              autoComplete="organization"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">Type</span>
            <select
              className={selectClass}
              value={tenantType}
              onChange={(e) => setTenantType(e.target.value as TenantType)}
              disabled={pending}
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">Email</span>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">Phone</span>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending}
              autoComplete="tel"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#374151]">Company registration</span>
            <input
              className={inputClass}
              value={companyReg}
              onChange={(e) => setCompanyReg(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#374151]">Tax ID</span>
            <input
              className={inputClass}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              disabled={pending}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Correspondence address
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#374151]">Line 1</span>
            <input
              className={inputClass}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#374151]">Line 2</span>
            <input
              className={inputClass}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">City</span>
            <input
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">Region</span>
            <input
              className={inputClass}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">Postal code</span>
            <input
              className={inputClass}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#374151]">Country (ISO-2)</span>
            <input
              className={inputClass}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={pending}
              maxLength={2}
            />
          </label>
        </div>
      </section>
    </form>
  );
}
