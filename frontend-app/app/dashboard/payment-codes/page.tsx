"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { OrgMissingBanner } from "@/components/portfolio/org-missing-banner";
import { useOrg } from "@/contexts/org-context";
import {
  activatePaymentLink,
  deactivatePaymentLink,
  getPaymentCodeUnitDetail,
  listPaymentCodeUnits,
} from "@/services/payment-link-service";
import type { PaymentCodeUnitDetailDto, PaymentCodeUnitDto } from "@/types/payment-links";

type DetailTab = "payments" | "invoices";

export default function PaymentCodesPage() {
  const { orgReady, orgId } = useOrg();
  const [units, setUnits] = useState<PaymentCodeUnitDto[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PaymentCodeUnitDetailDto | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("payments");

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    setLoadingList(true);
    void listPaymentCodeUnits()
      .then((res) => {
        setUnits(res.results);
        setSelectedUnitId((prev) => prev ?? res.results[0]?.id ?? null);
      })
      .finally(() => setLoadingList(false));
  }, [orgReady, orgId]);

  useEffect(() => {
    if (selectedUnitId == null) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    void getPaymentCodeUnitDetail(selectedUnitId)
      .then((res) => setDetail(res))
      .finally(() => setLoadingDetail(false));
  }, [selectedUnitId]);

  const selected = useMemo(
    () => units.find((u) => u.id === selectedUnitId) ?? null,
    [selectedUnitId, units],
  );

  if (!orgReady) {
    return <DashboardListView title="Payment Codes" description="Loading workspace..." />;
  }
  if (orgId == null) {
    return (
      <div className="min-h-0 flex-1 overflow-auto bg-surface-main p-4 md:p-6">
        <OrgMissingBanner />
      </div>
    );
  }

  return (
    <DashboardListView
      title="Payment Codes"
      description="Manage unit-linked payment codes and public payment links for tenants."
    >
      <div className="mx-auto grid max-w-content gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="font-serif text-lg text-brand-navy">Units</h2>
            <p className="text-sm text-[#6B7280]">Code, lease status, and outstanding balances</p>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            {loadingList ? (
              <p className="p-4 text-sm text-[#6B7280]">Loading units...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-2">Unit</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Tenant</th>
                    <th className="px-4 py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr
                      key={u.id}
                      className={`cursor-pointer border-t border-[#F3F4F6] ${u.id === selectedUnitId ? "bg-[#F8FAFF]" : "hover:bg-[#FAFAFA]"}`}
                      onClick={() => setSelectedUnitId(u.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#111827]">{u.building_name}</div>
                        <div className="text-xs text-[#6B7280]">Unit {u.unit_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-[#EEF2FF] px-2 py-1 text-xs font-semibold text-[#3730A3]">
                          {u.payment_code || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#374151]">{u.active_tenant_name || "Vacant"}</td>
                      <td className="px-4 py-3 font-medium text-[#111827]">{u.outstanding_balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="font-serif text-lg text-brand-navy">Selected Unit</h2>
            {selected ? (
              <p className="text-sm text-[#6B7280]">
                {selected.building_name} · Unit {selected.unit_number}
              </p>
            ) : null}
          </div>
          <div className="space-y-4 p-4">
            {loadingDetail || !detail ? (
              <p className="text-sm text-[#6B7280]">Select a unit to view link details.</p>
            ) : (
              <>
                <div className="rounded-lg bg-[#F8FAFC] p-3">
                  <p className="text-xs uppercase tracking-wide text-[#6B7280]">Payment code</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-[#111827]">
                    {detail.unit.payment_code}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] p-3">
                  <p className="text-xs uppercase tracking-wide text-[#6B7280]">Public payment link</p>
                  <p className="mt-1 break-all text-sm text-brand-blue">
                    {typeof window === "undefined"
                      ? detail.payment_link.public_url
                      : `${window.location.origin}${detail.payment_link.public_url}`}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#374151]"
                      onClick={() => {
                        const base = window.location.origin;
                        void navigator.clipboard.writeText(`${base}${detail.payment_link.public_url}`);
                      }}
                    >
                      Copy link
                    </button>
                    {detail.payment_link.is_active ? (
                      <button
                        type="button"
                        className="rounded-md bg-[#FEF2F2] px-3 py-1.5 text-xs font-semibold text-[#991B1B]"
                        onClick={async () => {
                          await deactivatePaymentLink(detail.unit.id);
                          const next = await getPaymentCodeUnitDetail(detail.unit.id);
                          setDetail(next);
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-md bg-[#ECFDF5] px-3 py-1.5 text-xs font-semibold text-[#065F46]"
                        onClick={async () => {
                          await activatePaymentLink(detail.unit.id);
                          const next = await getPaymentCodeUnitDetail(detail.unit.id);
                          setDetail(next);
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 border-b border-[#E5E7EB] pb-2">
                  <button
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${activeTab === "payments" ? "bg-brand-navy text-white" : "bg-[#F3F4F6] text-[#374151]"}`}
                    onClick={() => setActiveTab("payments")}
                    type="button"
                  >
                    Payment attempts
                  </button>
                  <button
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${activeTab === "invoices" ? "bg-brand-navy text-white" : "bg-[#F3F4F6] text-[#374151]"}`}
                    onClick={() => setActiveTab("invoices")}
                    type="button"
                  >
                    Invoices
                  </button>
                </div>

                {activeTab === "payments" ? (
                  <div className="space-y-2">
                    {detail.payments.length === 0 ? (
                      <p className="text-sm text-[#6B7280]">No payment attempts yet.</p>
                    ) : (
                      detail.payments.map((p) => (
                        <div key={p.id} className="rounded-md border border-[#E5E7EB] p-2">
                          <p className="text-sm font-medium text-[#111827]">
                            {p.amount} · {p.status}
                          </p>
                          <p className="text-xs text-[#6B7280]">{p.payer_name || p.payer_email}</p>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.invoices.map((inv) => (
                      <div key={inv.id} className="rounded-md border border-[#E5E7EB] p-2">
                        <p className="text-sm font-medium text-[#111827]">
                          {inv.invoice_number || `Invoice #${inv.id}`}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Due {inv.due_date} · Outstanding {inv.outstanding_amount}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </DashboardListView>
  );
}
