"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchCombobox } from "@/components/portfolio/search-combobox";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import {
  JOB_ORDER_STATUS_LABELS,
  JOB_ORDER_STATUSES,
} from "@/lib/constants/job-order-status";
import { ApiError } from "@/lib/api/errors";
import { getJobOrder, updateJobOrder } from "@/services/job-order-service";
import { listAllBuildings } from "@/services/building-service";
import { listAllUnits } from "@/services/unit-service";
import { listAllVendors } from "@/services/vendor-service";
import type { BuildingDto, UnitDto } from "@/types/portfolio";
import type { JobOrderDto, JobOrderUpdate, VendorDto } from "@/types/operations";

const FORM_ID = "job-order-edit-form";

type IdLabel = { id: string; label: string };

export default function JobOrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { orgReady, orgId } = useOrg();
  const [job, setJob] = useState<JobOrderDto | null>(null);
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const [buildingId, setBuildingId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [priority, setPriority] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [externalReference, setExternalReference] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid job order.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [j, b, u, v] = await Promise.all([
        getJobOrder(id),
        listAllBuildings(),
        listAllUnits(),
        listAllVendors(),
      ]);
      setJob(j);
      setBuildings(b.sort((x, y) => x.name.localeCompare(y.name)));
      setUnits(u);
      setVendors(v.filter((x) => x.is_active).sort((x, y) => x.name.localeCompare(y.name)));

      setBuildingId(String(j.building));
      setUnitId(j.unit != null ? String(j.unit) : "");
      setVendorId(j.vendor != null ? String(j.vendor) : "");
      setTitle(j.title ?? "");
      setDescription(j.description ?? "");
      setJobNumber(j.job_number ?? "");
      setStatus(j.status || "draft");
      setPriority(j.priority ?? "");
      setEstimatedCost(j.estimated_cost ?? "");
      setExternalReference(j.external_reference ?? "");
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load job order.",
      );
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  const bid = buildingId === "" ? null : Number.parseInt(buildingId, 10);

  const unitsForBuilding = useMemo(() => {
    if (bid == null || !Number.isFinite(bid)) return [];
    return units.filter((u) => u.building === bid);
  }, [units, bid]);

  const buildingOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— Select building —" },
      ...buildings.map((b) => ({ id: String(b.id), label: b.name })),
    ],
    [buildings],
  );

  const unitOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— Building-wide (no unit) —" },
      ...unitsForBuilding.map((u) => ({
        id: String(u.id),
        label: `${u.unit_number}${u.building_name ? ` · ${u.building_name}` : ""}`,
      })),
    ],
    [unitsForBuilding],
  );

  const vendorOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— Unassigned —" },
      ...vendors.map((v) => ({ id: String(v.id), label: v.name })),
    ],
    [vendors],
  );

  const statusOptions: IdLabel[] = useMemo(
    () =>
      JOB_ORDER_STATUSES.map((s) => ({
        id: s,
        label: JOB_ORDER_STATUS_LABELS[s] ?? s,
      })),
    [],
  );

  useEffect(() => {
    if (unitId === "") return;
    const uid = Number.parseInt(unitId, 10);
    const un = units.find((x) => x.id === uid);
    if (un && bid != null && un.building !== bid) {
      setUnitId("");
    }
  }, [bid, unitId, units]);

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!job) return;
    if (buildingId === "") {
      setFormError("Select a building.");
      return;
    }
    const t = title.trim();
    if (!t) {
      setFormError("Enter a title.");
      return;
    }

    const body: JobOrderUpdate = {
      building: Number.parseInt(buildingId, 10),
      title: t,
      status,
    };
    body.description = description.trim();
    body.job_number = jobNumber.trim();
    body.unit = unitId !== "" ? Number.parseInt(unitId, 10) : null;
    body.vendor = vendorId !== "" ? Number.parseInt(vendorId, 10) : null;
    body.priority = priority.trim();
    body.estimated_cost = estimatedCost.trim() || null;
    body.external_reference = externalReference.trim();

    setPending(true);
    try {
      const updated = await updateJobOrder(job.id, body);
      router.push(`/dashboard/job-orders/${updated.id}`);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.messageForUser : "Could not save job order.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/job-orders"
        backLabel="Back to job orders"
        title="Edit job order"
        footer={null}
      >
        <p className="text-sm text-[#6B7280]">Preparing workspace…</p>
      </PortfolioFormShell>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  if (loading) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/job-orders"
        backLabel="Back to job orders"
        title="Edit job order"
        footer={null}
      >
        <p className="text-sm text-[#6B7280]">Loading job order…</p>
      </PortfolioFormShell>
    );
  }

  if (loadError || !job) {
    return (
      <PortfolioFormShell
        backHref="/dashboard/job-orders"
        backLabel="Back to job orders"
        title="Edit job order"
        footer={
          <Link href="/dashboard/job-orders" className="btn-secondary-sm">
            Back
          </Link>
        }
      >
        <p className="text-sm text-red-800">{loadError ?? "Not found."}</p>
      </PortfolioFormShell>
    );
  }

  return (
    <PortfolioFormShell
      backHref={`/dashboard/job-orders/${job.id}`}
      backLabel="Back to job order"
      title="Edit job order"
      description={`${job.job_number?.trim() || `#${job.id}`}`}
      footer={
        <>
          <Link href={`/dashboard/job-orders/${job.id}`} className="btn-secondary-sm">
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary-sm"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      {formError ? <p className="mb-4 text-sm text-red-800">{formError}</p> : null}

      <form id={FORM_ID} className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <SearchCombobox
          label="Building"
          items={buildingOptions}
          value={buildingId}
          onChange={(next) => {
            setBuildingId(next);
            setUnitId("");
          }}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => o.label}
          placeholder="Search buildings…"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SearchCombobox
            label="Unit (optional)"
            items={unitOptions}
            value={unitId}
            onChange={setUnitId}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            placeholder={
              bid == null ? "Select a building first…" : "Search units…"
            }
            disabled={bid == null}
            emptyMessage={bid == null ? "Choose a building" : "No units match"}
          />
          <div>
            <SearchCombobox
              label="Vendor (optional)"
              items={vendorOptions}
              value={vendorId}
              onChange={setVendorId}
              getOptionId={(o) => o.id}
              getOptionLabel={(o) => o.label}
              placeholder="Search vendors…"
            />
            <Link
              href="/dashboard/vendors/create"
              className="mt-2 inline-flex text-xs font-medium text-brand-blue hover:text-brand-navy"
            >
              + Create new vendor
            </Link>
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Title</span>
          <input
            required
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix kitchen leak"
            autoComplete="off"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Description (optional)</span>
          <textarea
            className={`${inputClass} min-h-[88px] py-2`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope, access notes…"
            rows={3}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Job number (optional)</span>
            <input
              className={inputClass}
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              placeholder="Leave blank to auto-generate"
              autoComplete="off"
            />
          </label>
          <SearchCombobox
            label="Status"
            items={statusOptions}
            value={status}
            onChange={setStatus}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            placeholder="Status…"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Priority (optional)</span>
            <input
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="e.g. high, emergency"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">
              Estimated cost (optional)
            </span>
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="0.00"
              autoComplete="off"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">
            External reference (optional)
          </span>
          <input
            className={inputClass}
            value={externalReference}
            onChange={(e) => setExternalReference(e.target.value)}
            placeholder="CMMS or legacy ID"
            autoComplete="off"
          />
        </label>
      </form>
    </PortfolioFormShell>
  );
}
