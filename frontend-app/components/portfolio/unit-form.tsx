"use client";

import { useEffect, useState } from "react";
import type { BuildingDto, UnitCreate, UnitDto } from "@/types/portfolio";

export const UNIT_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "shop", label: "Shop" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
];

export const UNIT_STATUSES = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "offline", label: "Offline" },
];

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";
const textareaClass =
  "mt-1 min-h-[60px] w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm text-[#1A1A1A] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20";

export type UnitFormValues = UnitCreate;

function dtoToState(d: UnitDto): UnitFormValues {
  return {
    building: d.building,
    unit_number: d.unit_number,
    unit_type: d.unit_type,
    status: d.status,
    floor: d.floor,
    entrance: d.entrance,
    size: d.size,
    address_override_line1: d.address_override_line1,
    address_override_city: d.address_override_city,
    internal_notes: d.internal_notes,
  };
}

export function UnitForm({
  formId,
  buildings,
  initial,
  defaultBuildingId,
  onSubmit,
  pending,
}: {
  formId: string;
  buildings: BuildingDto[];
  initial?: UnitDto | null;
  /** When creating (no `initial`), pre-select building from e.g. `?building=` query. */
  defaultBuildingId?: number;
  onSubmit: (payload: UnitFormValues) => Promise<void>;
  pending?: boolean;
}) {
  const [buildingId, setBuildingId] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState("apartment");
  const [status, setStatus] = useState("vacant");
  const [floor, setFloor] = useState("");
  const [entrance, setEntrance] = useState("");
  const [size, setSize] = useState("");
  const [addressOverrideLine1, setAddressOverrideLine1] = useState("");
  const [addressOverrideCity, setAddressOverrideCity] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (initial) {
      const s = dtoToState(initial);
      setBuildingId(String(s.building));
      setUnitNumber(s.unit_number);
      setUnitType(s.unit_type || "apartment");
      setStatus(s.status || "vacant");
      setFloor(s.floor ?? "");
      setEntrance(s.entrance ?? "");
      setSize(s.size != null ? String(s.size) : "");
      setAddressOverrideLine1(s.address_override_line1 ?? "");
      setAddressOverrideCity(s.address_override_city ?? "");
      setInternalNotes(s.internal_notes ?? "");
    } else {
      setBuildingId(
        defaultBuildingId != null && Number.isFinite(defaultBuildingId)
          ? String(defaultBuildingId)
          : "",
      );
      setUnitNumber("");
      setUnitType("apartment");
      setStatus("vacant");
      setFloor("");
      setEntrance("");
      setSize("");
      setAddressOverrideLine1("");
      setAddressOverrideCity("");
      setInternalNotes("");
    }
  }, [initial, defaultBuildingId]);

  function buildPayload(): UnitFormValues {
    const sizeTrim = size.trim();
    return {
      building: parseInt(buildingId, 10),
      unit_number: unitNumber.trim(),
      unit_type: unitType,
      status,
      floor: floor.trim(),
      entrance: entrance.trim(),
      size: sizeTrim === "" ? null : sizeTrim,
      address_override_line1: addressOverrideLine1.trim(),
      address_override_city: addressOverrideCity.trim(),
      internal_notes: internalNotes.trim(),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(buildPayload());
  }

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)}>
      <p className="text-xs text-[#6B7280]">
        Suite details, optional size, and address overrides when the postal line differs
        from the building.
      </p>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-[#374151]">Building</span>
        <select
          className={`${inputClass} bg-white`}
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value)}
          data-testid="unit-form-building"
          disabled={pending}
          required
        >
          <option value="">Select building</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Unit number</span>
        <input
          className={inputClass}
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          data-testid="unit-form-number"
          disabled={pending}
          required
        />
      </label>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Floor</span>
          <input
            className={inputClass}
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="e.g. 3, G, B1"
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Entrance</span>
          <input
            className={inputClass}
            value={entrance}
            onChange={(e) => setEntrance(e.target.value)}
            placeholder="Wing, stairwell"
            disabled={pending}
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Unit type</span>
        <select
          className={`${inputClass} bg-white`}
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
          disabled={pending}
        >
          {UNIT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Size (area)</span>
        <input
          className={inputClass}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="e.g. 45.5 (document unit in org settings)"
          disabled={pending}
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Status</span>
        <select
          className={`${inputClass} bg-white`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          data-testid="unit-form-status"
          disabled={pending}
        >
          {UNIT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-5 space-y-3 border-0 p-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Address override (optional)
        </legend>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Override line 1</span>
          <input
            className={inputClass}
            value={addressOverrideLine1}
            onChange={(e) => setAddressOverrideLine1(e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Override city</span>
          <input
            className={inputClass}
            value={addressOverrideCity}
            onChange={(e) => setAddressOverrideCity(e.target.value)}
            disabled={pending}
          />
        </label>
      </fieldset>

      <label className="mt-3 block text-sm">
        <span className="font-medium text-[#374151]">Internal notes</span>
        <textarea
          className={textareaClass}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Access / handover (non-secret)"
          disabled={pending}
        />
      </label>
    </form>
  );
}
