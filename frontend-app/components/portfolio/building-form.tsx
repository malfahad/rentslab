"use client";

import { useEffect, useState } from "react";
import type { BuildingCreate, BuildingDto, LandlordDto } from "@/types/portfolio";

export const BUILDING_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed", label: "Mixed" },
  { value: "industrial", label: "Industrial" },
];

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";
const textareaClass =
  "mt-1 min-h-[60px] w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

export type BuildingFormValues = Omit<BuildingCreate, "org">;

function dtoToState(d: BuildingDto): BuildingFormValues {
  return {
    landlord: d.landlord,
    name: d.name,
    building_type: d.building_type,
    address_line1: d.address_line1,
    address_line2: d.address_line2,
    city: d.city,
    region: d.region,
    postal_code: d.postal_code,
    country_code: d.country_code,
    latitude: d.latitude,
    longitude: d.longitude,
    location_notes: d.location_notes,
  };
}

export function BuildingForm({
  formId,
  landlords,
  initial,
  defaultLandlordId,
  onSubmit,
  pending,
}: {
  formId: string;
  landlords: LandlordDto[];
  initial?: BuildingDto | null;
  /** When creating (no `initial`), pre-select landlord from e.g. `?landlord=` query. */
  defaultLandlordId?: number;
  onSubmit: (payload: BuildingFormValues) => Promise<void>;
  pending?: boolean;
}) {
  const [landlordId, setLandlordId] = useState("");
  const [name, setName] = useState("");
  const [buildingType, setBuildingType] = useState("residential");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationNotes, setLocationNotes] = useState("");

  useEffect(() => {
    if (initial) {
      const s = dtoToState(initial);
      setLandlordId(String(s.landlord));
      setName(s.name);
      setBuildingType(s.building_type || "residential");
      setAddressLine1(s.address_line1 ?? "");
      setAddressLine2(s.address_line2 ?? "");
      setCity(s.city ?? "");
      setRegion(s.region ?? "");
      setPostalCode(s.postal_code ?? "");
      setCountryCode(s.country_code ?? "");
      setLatitude(s.latitude != null ? String(s.latitude) : "");
      setLongitude(s.longitude != null ? String(s.longitude) : "");
      setLocationNotes(s.location_notes ?? "");
    } else {
      setLandlordId(
        defaultLandlordId != null && Number.isFinite(defaultLandlordId)
          ? String(defaultLandlordId)
          : "",
      );
      setName("");
      setBuildingType("residential");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setRegion("");
      setPostalCode("");
      setCountryCode("");
      setLatitude("");
      setLongitude("");
      setLocationNotes("");
    }
  }, [initial, defaultLandlordId]);

  function buildPayload(): BuildingFormValues {
    const latTrim = latitude.trim();
    const lngTrim = longitude.trim();
    return {
      landlord: parseInt(landlordId, 10),
      name: name.trim(),
      building_type: buildingType,
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim(),
      city: city.trim(),
      region: region.trim(),
      postal_code: postalCode.trim(),
      country_code: countryCode.trim().toUpperCase().slice(0, 2),
      latitude: latTrim === "" ? null : latTrim,
      longitude: lngTrim === "" ? null : lngTrim,
      location_notes: locationNotes.trim(),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(buildPayload());
  }

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)}>
      <p className="text-xs text-[#6B7280]">
        Site address, classification, and optional map coordinates.
      </p>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-[#374151]">Landlord</span>
        <select
          className={`${inputClass} bg-white`}
          value={landlordId}
          onChange={(e) => setLandlordId(e.target.value)}
          data-testid="building-form-landlord"
          disabled={pending}
          required
        >
          <option value="">Select landlord</option>
          {landlords.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Building name</span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="building-form-name"
          disabled={pending}
          required
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Type</span>
        <select
          className={`${inputClass} bg-white`}
          value={buildingType}
          onChange={(e) => setBuildingType(e.target.value)}
          data-testid="building-form-type"
          disabled={pending}
        >
          {BUILDING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

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
            placeholder="Street"
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
              disabled={pending}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Location
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Latitude</span>
            <input
              className={inputClass}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="WGS-84"
              disabled={pending}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Longitude</span>
            <input
              className={inputClass}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={pending}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Location notes</span>
          <textarea
            className={textareaClass}
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            placeholder="Directions, landmarks"
            disabled={pending}
          />
        </label>
      </fieldset>
    </form>
  );
}
