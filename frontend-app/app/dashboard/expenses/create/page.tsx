"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchCombobox } from "@/components/portfolio/search-combobox";
import { PortfolioFormShell } from "@/components/portfolio/portfolio-form-shell";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import { CURRENCY_OPTIONS } from "@/lib/currencies";
import { ApiError } from "@/lib/api/errors";
import {
  createExpense,
  createExpenseCategory,
  listAllExpenseCategories,
} from "@/services/expense-service";
import { listAllJobOrders } from "@/services/job-order-service";
import { listAllLeases } from "@/services/lease-service";
import { listAllBuildings } from "@/services/building-service";
import { listAllUnits } from "@/services/unit-service";
import { listAllVendors } from "@/services/vendor-service";
import type { ExpenseCategoryDto, ExpenseCreate } from "@/types/expense";
import type { BuildingDto, UnitDto } from "@/types/portfolio";
import type { JobOrderDto, LeaseDto, VendorDto } from "@/types/operations";

const FORM_ID = "expense-create-form";

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "approved", label: "Approved" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];

const METHOD_OPTIONS: { id: string; label: string }[] = [
  { id: "", label: "— None —" },
  { id: "bank", label: "Bank" },
  { id: "mobile_money", label: "Mobile money" },
  { id: "card", label: "Card" },
  { id: "cash", label: "Cash" },
  { id: "check", label: "Check" },
  { id: "other", label: "Other" },
];

function localDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localDateTimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function leaseLabel(l: LeaseDto): string {
  const u = l.unit_label?.trim() || `Lease #${l.id}`;
  const t = l.tenant_name?.trim();
  return t ? `${u} · ${t}` : u;
}

function leaseSearchText(l: LeaseDto): string {
  return [leaseLabel(l), l.building_name ?? ""].filter(Boolean).join(" ");
}

type IdLabel = { id: string; label: string };

export default function ExpenseCreatePage() {
  const router = useRouter();
  const { orgReady, orgId } = useOrg();
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [buildings, setBuildings] = useState<BuildingDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOrderDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [categoryQuickOpen, setCategoryQuickOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [categoryQuickPending, setCategoryQuickPending] = useState(false);
  const [categoryQuickError, setCategoryQuickError] = useState<string | null>(
    null,
  );

  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(() =>
    localDateInputValue(new Date()),
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [buildingId, setBuildingId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [leaseId, setLeaseId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [jobOrderId, setJobOrderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [expenseNumber, setExpenseNumber] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [paidAtLocal, setPaidAtLocal] = useState(() =>
    localDateTimeInputValue(new Date()),
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [cats, b, u, ls, v, jo] = await Promise.all([
        listAllExpenseCategories(),
        listAllBuildings(),
        listAllUnits(),
        listAllLeases(),
        listAllVendors(),
        listAllJobOrders(),
      ]);
      setCategories(
        cats.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setBuildings(b.sort((a, b) => a.name.localeCompare(b.name)));
      setUnits(u);
      setLeases(ls.sort((a, b) => a.start_date.localeCompare(b.start_date)));
      setVendors(v.filter((x) => x.is_active).sort((a, b) => a.name.localeCompare(b.name)));
      setJobOrders(jo);
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.messageForUser : "Could not load form data.",
      );
    }
  }, []);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void load();
  }, [orgReady, orgId, load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const v = q.get("vendor");
    if (v && /^\d+$/.test(v)) setVendorId(v);
    const jo = q.get("job_order");
    if (jo && /^\d+$/.test(jo)) setJobOrderId(jo);
  }, []);

  const bid =
    buildingId === "" ? null : Number.parseInt(buildingId, 10);
  const unitsForBuilding = useMemo(() => {
    if (bid == null || !Number.isFinite(bid)) return [];
    return units.filter((u) => u.building === bid);
  }, [units, bid]);

  const jobOrdersScoped = useMemo(() => {
    if (bid == null || !Number.isFinite(bid)) return jobOrders;
    return jobOrders.filter((j) => j.building === bid);
  }, [jobOrders, bid]);

  const buildingOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— None —" },
      ...buildings.map((b) => ({ id: String(b.id), label: b.name })),
    ],
    [buildings],
  );

  const unitOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— None —" },
      ...unitsForBuilding.map((u) => ({
        id: String(u.id),
        label: `${u.unit_number}${u.building_name ? ` · ${u.building_name}` : ""}`,
      })),
    ],
    [unitsForBuilding],
  );

  const leaseOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— None —" },
      ...leases.map((l) => ({ id: String(l.id), label: leaseLabel(l) })),
    ],
    [leases],
  );

  const vendorOptions: IdLabel[] = useMemo(
    () => [
      { id: "", label: "— None —" },
      ...vendors.map((v) => ({
        id: String(v.id),
        label: v.name,
      })),
    ],
    [vendors],
  );

  const jobOrderOptions: IdLabel[] = useMemo(() => {
    const list = bid == null ? jobOrders : jobOrdersScoped;
    return [
      { id: "", label: "— None —" },
      ...list.map((j) => ({
        id: String(j.id),
        label: `${j.job_number?.trim() || `#${j.id}`} — ${j.title}`,
      })),
    ];
  }, [bid, jobOrders, jobOrdersScoped]);

  useEffect(() => {
    if (unitId === "") return;
    const uid = Number.parseInt(unitId, 10);
    const un = units.find((x) => x.id === uid);
    if (un && bid != null && un.building !== bid) {
      setUnitId("");
    }
  }, [bid, unitId, units]);

  useEffect(() => {
    if (jobOrderId === "") return;
    const jid = Number.parseInt(jobOrderId, 10);
    const jo = jobOrders.find((x) => x.id === jid);
    if (!jo) return;
    if (buildingId === "" || Number.parseInt(buildingId, 10) !== jo.building) {
      setBuildingId(String(jo.building));
    }
  }, [jobOrderId, jobOrders, buildingId]);

  const inputClass =
    "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20";

  async function submitQuickCategory() {
    setCategoryQuickError(null);
    if (orgId == null) return;
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryQuickError("Enter a category name.");
      return;
    }
    setCategoryQuickPending(true);
    try {
      const created = await createExpenseCategory({
        org: orgId,
        name,
        ...(newCategoryCode.trim() ? { code: newCategoryCode.trim() } : {}),
      });
      setCategories((prev) =>
        [...prev.filter((c) => c.id !== created.id), created].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setCategoryId(String(created.id));
      setNewCategoryName("");
      setNewCategoryCode("");
      setCategoryQuickOpen(false);
    } catch (e) {
      setCategoryQuickError(
        e instanceof ApiError ? e.messageForUser : "Could not create category.",
      );
    } finally {
      setCategoryQuickPending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (orgId == null) {
      setFormError("No organization selected.");
      return;
    }
    const cid = Number.parseInt(categoryId, 10);
    if (!Number.isFinite(cid)) {
      setFormError("Select a category.");
      return;
    }
    const amt = amount.trim();
    if (!amt || Number.isNaN(Number.parseFloat(amt))) {
      setFormError("Enter a valid amount.");
      return;
    }
    const desc = description.trim();
    if (!desc) {
      setFormError("Enter a description.");
      return;
    }

    const body: ExpenseCreate = {
      org: orgId,
      expense_category: cid,
      expense_date: expenseDate,
      amount: amt,
      description: desc,
      status,
    };

    if (expenseNumber.trim()) body.expense_number = expenseNumber.trim();
    if (currencyCode.trim())
      body.currency_code = currencyCode.trim().toUpperCase();
    if (paymentMethod) body.payment_method = paymentMethod;
    if (reference.trim()) body.reference = reference.trim();
    if (receiptUrl.trim()) body.receipt_url = receiptUrl.trim();

    if (bid != null && Number.isFinite(bid)) body.building = bid;
    const uid =
      unitId === "" ? null : Number.parseInt(unitId, 10);
    if (uid != null && Number.isFinite(uid)) body.unit = uid;
    const lid =
      leaseId === "" ? null : Number.parseInt(leaseId, 10);
    if (lid != null && Number.isFinite(lid)) body.lease = lid;
    const vid =
      vendorId === "" ? null : Number.parseInt(vendorId, 10);
    if (vid != null && Number.isFinite(vid)) body.vendor = vid;
    const joid =
      jobOrderId === "" ? null : Number.parseInt(jobOrderId, 10);
    if (joid != null && Number.isFinite(joid)) body.job_order = joid;

    if (status === "paid") {
      body.paid_at = new Date(paidAtLocal).toISOString();
    }

    setPending(true);
    try {
      const created = await createExpense(body);
      router.push(`/dashboard/expenses/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.messageForUser : "Could not save expense.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!orgReady) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 text-sm text-[#6B7280]">
        Preparing workspace…
      </div>
    );
  }

  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  return (
    <PortfolioFormShell
      backHref="/dashboard/expenses"
      backLabel="Back to expenses"
      title="Record expense"
      description="Log operational spend and optional links to portfolio, vendors, or work orders."
      footer={
        <>
          <Link
            href="/dashboard/expenses"
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form={FORM_ID}
            className="btn-primary-sm h-10 px-5"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save expense"}
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

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-[#374151]">Category</span>
            <button
              type="button"
              className="text-sm font-medium text-brand-blue hover:text-brand-navy hover:underline"
              onClick={() => {
                setCategoryQuickOpen((o) => !o);
                setCategoryQuickError(null);
              }}
            >
              {categoryQuickOpen ? "Close" : "+ New category"}
            </button>
          </div>
          <SearchCombobox
            label={null}
            ariaLabel="Category"
            items={categories}
            value={categoryId}
            onChange={setCategoryId}
            getOptionId={(c) => String(c.id)}
            getOptionLabel={(c) => c.name}
            getSearchText={(c) =>
              [c.name, c.code?.trim() ?? ""].filter(Boolean).join(" ")
            }
            placeholder="Search categories…"
            required
            emptyMessage="No categories match. Create one below."
          />
          {categoryQuickOpen ? (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <p className="text-sm font-medium text-[#374151]">
                New expense category
              </p>
              {categoryQuickError ? (
                <p className="mt-2 text-sm text-red-800">{categoryQuickError}</p>
              ) : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-[#374151]">Name</span>
                  <input
                    className={inputClass}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Repairs & maintenance"
                    autoComplete="off"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-[#374151]">Code (optional)</span>
                  <input
                    className={inputClass}
                    value={newCategoryCode}
                    onChange={(e) => setNewCategoryCode(e.target.value)}
                    placeholder="e.g. R&M"
                    autoComplete="off"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary-sm h-9 px-4"
                  disabled={categoryQuickPending}
                  onClick={() => void submitQuickCategory()}
                >
                  {categoryQuickPending ? "Creating…" : "Create category"}
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm text-[#374151] hover:bg-white"
                  onClick={() => {
                    setCategoryQuickOpen(false);
                    setCategoryQuickError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Expense date</span>
            <input
              required
              type="date"
              className={inputClass}
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </label>
          <SearchCombobox
            label="Status"
            items={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            placeholder="Search status…"
            required
          />
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
            <span className="font-medium text-[#374151]">Currency</span>
            <select
              className={inputClass}
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code || "default"} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Description</span>
          <input
            required
            type="text"
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was purchased or paid for"
            autoComplete="off"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Expense number (optional)</span>
          <input
            type="text"
            className={inputClass}
            value={expenseNumber}
            onChange={(e) => setExpenseNumber(e.target.value)}
            placeholder="Your internal reference"
            autoComplete="off"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <SearchCombobox
            label="Building (optional)"
            items={buildingOptions}
            value={buildingId}
            onChange={(next) => {
              setBuildingId(next);
              setUnitId("");
              setJobOrderId("");
            }}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            placeholder="Search buildings…"
          />
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
        </div>

        <SearchCombobox
          label="Lease (optional)"
          items={leaseOptions}
          value={leaseId}
          onChange={setLeaseId}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => o.label}
          getSearchText={(o) => {
            const l = leases.find((x) => String(x.id) === o.id);
            return l ? leaseSearchText(l) : o.label;
          }}
          placeholder="Search leases…"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SearchCombobox
            label="Vendor (optional)"
            items={vendorOptions}
            value={vendorId}
            onChange={setVendorId}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            getSearchText={(o) => {
              const v = vendors.find((x) => String(x.id) === o.id);
              return v
                ? [v.name, v.email, v.phone].filter(Boolean).join(" ")
                : o.label;
            }}
            placeholder="Search vendors…"
          />
          <SearchCombobox
            label="Job order (optional)"
            items={jobOrderOptions}
            value={jobOrderId}
            onChange={setJobOrderId}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            placeholder="Search job orders…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SearchCombobox
            label="Payment method (optional)"
            items={METHOD_OPTIONS}
            value={paymentMethod}
            onChange={setPaymentMethod}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
            placeholder="Search methods…"
          />
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">
              Bank / external ref (optional)
            </span>
            <input
              type="text"
              className={inputClass}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#374151]">Receipt URL (optional)</span>
          <input
            type="url"
            className={inputClass}
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="https://…"
            autoComplete="off"
          />
        </label>

        {status === "paid" ? (
          <label className="block text-sm">
            <span className="font-medium text-[#374151]">Paid at</span>
            <input
              type="datetime-local"
              required
              className={inputClass}
              value={paidAtLocal}
              onChange={(e) => setPaidAtLocal(e.target.value)}
            />
          </label>
        ) : null}

        {categories.length === 0 && !loadError ? (
          <p className="text-sm text-amber-800">
            No expense categories yet. Use &quot;New category&quot; above or add
            categories via the API.
          </p>
        ) : null}
      </form>
    </PortfolioFormShell>
  );
}
