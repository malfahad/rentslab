"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOrg } from "@/contexts/org-context";
import { ApiError } from "@/lib/api/errors";
import { getOrg, updateOrg, type OrgUpdatePayload } from "@/services/org-service";
import type { OrgDto } from "@/types/org";

const TIMEZONE_OPTIONS = [
  { value: "Africa/Nairobi", label: "EAT (UTC+3) — Africa/Nairobi" },
  { value: "Africa/Kampala", label: "EAT (UTC+3) — Africa/Kampala" },
  { value: "Africa/Dar_es_Salaam", label: "EAT (UTC+3) — Africa/Dar es Salaam" },
];

const CURRENCY_OPTIONS: Array<OrgDto["default_currency"]> = ["KES", "UGX", "TZS", "USD"];

type FormState = {
  name: string;
  logo_url: string;
  tagline: string;
  timezone: string;
  language: string;
  locale: string;
  default_currency: OrgDto["default_currency"];
  email: string;
  phone: string;
  website: string;
  legal_name: string;
  business_registration_number: string;
  tax_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
};

function toFormState(org: OrgDto): FormState {
  return {
    name: org.name || "",
    logo_url: org.logo_url || "",
    tagline: org.tagline || "",
    timezone: org.timezone || "Africa/Nairobi",
    language: org.language || "en",
    locale: org.locale || "en-KE",
    default_currency: org.default_currency || "KES",
    email: org.email || "",
    phone: org.phone || "",
    website: org.website || "",
    legal_name: org.legal_name || "",
    business_registration_number: org.business_registration_number || "",
    tax_id: org.tax_id || "",
    address_line1: org.address_line1 || "",
    address_line2: org.address_line2 || "",
    city: org.city || "",
    region: org.region || "",
    postal_code: org.postal_code || "",
    country_code: org.country_code || "",
  };
}

export function OrganizationSettingsPanel() {
  const { orgId, refreshOrgLabel } = useOrg();
  const [initial, setInitial] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId == null) {
      setInitial(null);
      setForm(null);
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    void getOrg(orgId)
      .then((org) => {
        const next = toFormState(org);
        setInitial(next);
        setForm(next);
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.messageForUser : "Could not load organization settings.");
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const dirty = useMemo(() => {
    if (!initial || !form) return false;
    return JSON.stringify(initial) !== JSON.stringify(form);
  }, [initial, form]);

  if (orgId == null) {
    return <p className="text-sm text-[#6B7280]">Select an organization to configure settings.</p>;
  }

  if (loading || !form) {
    return <p className="text-sm text-[#6B7280]">Loading organization settings…</p>;
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || orgId == null) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: OrgUpdatePayload = {
      ...form,
      country_code: form.country_code.toUpperCase(),
    };
    try {
      const updated = await updateOrg(orgId, payload);
      const next = toFormState(updated);
      setInitial(next);
      setForm(next);
      await refreshOrgLabel();
      setMessage("Organization settings saved.");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.messageForUser : "Could not save organization settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Branding</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[#374151]">Organization name</span>
            <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[#374151]">Logo URL</span>
            <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
          </label>
        </div>
        <label className="space-y-1 text-sm block">
          <span className="text-[#374151]">Tagline</span>
          <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </label>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Regional defaults</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-[#374151]">Timezone</span>
            <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[#374151]">Language</span>
            <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.language} onChange={(e) => set("language", e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[#374151]">Locale</span>
            <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.locale} onChange={(e) => set("locale", e.target.value)} />
          </label>
        </div>
        <label className="space-y-1 text-sm block max-w-xs">
          <span className="text-[#374151]">Default currency</span>
          <select
            className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2"
            value={form.default_currency}
            onChange={(e) => set("default_currency", e.target.value as OrgDto["default_currency"])}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Contact & registration</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Email</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Phone</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Website</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.website} onChange={(e) => set("website", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Legal name</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Business registration #</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.business_registration_number} onChange={(e) => set("business_registration_number", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Tax ID</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Address line 1</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Address line 2</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">City</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.city} onChange={(e) => set("city", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Region</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.region} onChange={(e) => set("region", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Postal code</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2" value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></label>
          <label className="space-y-1 text-sm"><span className="text-[#374151]">Country code</span><input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 uppercase" value={form.country_code} onChange={(e) => set("country_code", e.target.value.toUpperCase())} maxLength={2} /></label>
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-[#E5E7EB] pt-4">
        <button
          type="submit"
          className="btn-primary-sm h-10 px-5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || !dirty}
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
        {!dirty ? <span className="text-xs text-[#6B7280]">No unsaved changes</span> : null}
      </div>
    </form>
  );
}
