"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardListView } from "@/components/dashboard/main-view";
import { QuickCreateServiceModal } from "@/components/services/quick-create-service-modal";
import { useOrg } from "@/contexts/org-context";
import { listOrgServicesAll } from "@/services/catalog-service";
import type { ServiceDto } from "@/types/operations";

export function ServicesPageClient() {
  const { orgId, orgReady } = useOrg();
  const [rows, setRows] = useState<ServiceDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (orgId == null) return;
    setLoadError(null);
    try {
      const list = await listOrgServicesAll();
      setRows(list.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setLoadError("Could not load services.");
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgReady || orgId == null) return;
    void refresh();
  }, [orgReady, orgId, refresh]);

  if (!orgReady || orgId == null) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading organization…
      </div>
    );
  }

  return (
    <>
      <DashboardListView
        title="Services"
        description="Billable services for leases and subscriptions."
        actions={
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-navy px-4 text-sm font-medium text-white hover:bg-[#152a45]"
            onClick={() => setModalOpen(true)}
          >
            Add service
          </button>
        }
      >
        {loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-content rounded-xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
            <p className="text-sm text-[#6B7280]">No services yet.</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-brand-blue hover:text-brand-navy hover:underline"
              onClick={() => setModalOpen(true)}
            >
              Create your first service
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-content overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Name</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Billing type</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Currency</th>
                  <th className="px-4 py-3 font-semibold text-[#374151]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{s.name}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{s.billing_type}</td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {s.currency?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          s.is_active ? "text-[#2E7D32]" : "text-[#9CA3AF]"
                        }
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardListView>

      <QuickCreateServiceModal
        open={modalOpen}
        orgId={orgId}
        onClose={() => setModalOpen(false)}
        onCreated={(svc) => {
          setRows((prev) => {
            if (prev.some((r) => r.id === svc.id)) return prev;
            return [...prev, svc].sort((a, b) => a.name.localeCompare(b.name));
          });
        }}
      />
    </>
  );
}
