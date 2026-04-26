"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { getPublicLeaseDocument } from "@/services/lease-service";
import type { LeaseDto, ServiceSubscriptionDto, TenantDto } from "@/types/operations";
import type { BuildingDto, UnitDto } from "@/types/portfolio";
import type { OrgDto } from "@/types/org";

function rule() {
  return <div style={{ borderTop: "1px solid #000000", margin: "10px 0" }} />;
}

function compactAddress(parts: Array<string | null | undefined>): string {
  return parts.map((v) => (v || "").trim()).filter(Boolean).join(", ");
}

function blank(value?: string | null): string {
  const v = (value || "").trim();
  return v || "___________________";
}

function parseAmount(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export default function LeaseDocumentPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const searchParams = useSearchParams();
  const exportMode = useMemo(() => searchParams.get("export"), [searchParams]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [subs, setSubs] = useState<ServiceSubscriptionDto[]>([]);
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [unit, setUnit] = useState<UnitDto | null>(null);
  const [building, setBuilding] = useState<BuildingDto | null>(null);
  const [org, setOrg] = useState<OrgDto | null>(null);
  const [leaseTerms, setLeaseTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [appOrigin, setAppOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setError(null);
    void getPublicLeaseDocument(leaseId)
      .then((payload) => {
        const p = payload as {
          lease: LeaseDto;
          tenant: TenantDto;
          unit: UnitDto;
          building: BuildingDto;
          org: (OrgDto & { settings?: Record<string, unknown> }) | null;
          subscriptions: ServiceSubscriptionDto[];
        };
        setLease(p.lease || null);
        setTenant(p.tenant || null);
        setUnit(p.unit || null);
        setBuilding(p.building || null);
        setSubs(p.subscriptions || []);
        setOrg(p.org || null);
        const terms = typeof p.org?.settings?.lease_terms === "string" ? p.org.settings.lease_terms : "";
        setLeaseTerms(terms.trim());
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.messageForUser : "Could not load lease document.");
      });
  }, [leaseId]);

  useEffect(() => {
    if (!lease || !exportMode || exported) return;
    if (exportMode === "print") {
      setExported(true);
      window.print();
      return;
    }
    if (exportMode === "pdf" && rootRef.current) {
      setExported(true);
      const run = async () => {
        const html2pdf = (await import("html2pdf.js")).default;
        const target = rootRef.current;
        await html2pdf()
          .from(target)
          .set({
            margin: [10, 10, 10, 10],
            filename: `lease-${lease.id}.pdf`,
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
            html2canvas: { scale: 3, backgroundColor: "#ffffff", useCORS: true, windowWidth: target.scrollWidth },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .save();
      };
      void run();
    }
  }, [exportMode, exported, lease]);

  if (error) {
    return <main style={{ padding: "16px", fontFamily: "Courier New, monospace" }}>{error}</main>;
  }

  if (!lease) {
    return <main style={{ padding: "16px", fontFamily: "Courier New, monospace" }}>Loading lease...</main>;
  }

  const landlordAddress = compactAddress([
    lease.landlord_address,
  ]);
  const tenantAddress = compactAddress([
    tenant?.address_line1,
    tenant?.address_line2,
    compactAddress([tenant?.city, tenant?.region, tenant?.postal_code]),
    tenant?.country_code,
  ]);
  const propertyAddress = building
    ? compactAddress([
        building.name,
        building.address_line1,
        building.address_line2,
        compactAddress([building.city, building.region, building.postal_code]),
        building.country_code,
      ])
    : "";
  const rentCurrency = (lease.rent_currency || "").trim();
  const parsedRent = parseAmount(lease.rent_amount);
  const subsTotal = subs.reduce((sum, s) => sum + parseAmount(s.rate), 0);
  const subCurrencies = new Set(
    subs.map((s) => (s.currency || "").trim()).filter(Boolean),
  );
  const hasMixedCurrencies =
    subCurrencies.size > 1 || (subCurrencies.size === 1 && rentCurrency && !subCurrencies.has(rentCurrency));
  const totalMonthlyDue = parsedRent + subsTotal;
  const totalMonthlyDueLabel = hasMixedCurrencies
    ? `${totalMonthlyDue.toFixed(2)} ${rentCurrency || ""} (mixed subscription currencies)`
    : `${totalMonthlyDue.toFixed(2)} ${rentCurrency || Array.from(subCurrencies)[0] || ""}`.trim();
  const paymentCode = unit?.payment_code?.trim() || "";
  const paymentLink = paymentCode
    ? `${appOrigin || "http://localhost:3000"}/pay/${paymentCode}`
    : "";
  const leaseTermText = lease.end_date
    ? `${lease.start_date} to ${lease.end_date}`
    : `${lease.start_date} onward`;

  return (
    <main style={{ padding: "16px", background: "#ffffff", color: "#000000", fontFamily: "Courier New, monospace" }}>
      <div ref={rootRef} style={{ maxWidth: "900px", margin: "0 auto", lineHeight: 1.4 }}>
        {rule()}
        <header style={{ textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>LEASE DOCUMENT</div>
          <div style={{ fontSize: "11px" }}>(Electronically Issued Document)</div>
        </header>
        {rule()}

        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>
            Document No. : {lease.id} <span style={{ marginLeft: "52px" }} />
            Date Issued : {blank(lease.created_at?.slice(0, 10))}
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>PARTIES</div>
        </section>
        {rule()}

        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>LANDLORD</div>
          <div>Full Name : {blank(lease.landlord_name)}</div>
          <div>ID / Reg No. : ___________________</div>
          <div>Address : {blank(landlordAddress)}</div>
          <div>
            Phone : {blank(lease.landlord_phone)} <span style={{ marginLeft: "42px" }} />
            Email : {blank(lease.landlord_email)}
          </div>
          <div style={{ height: "8px" }} />
          <div style={{ fontWeight: 700 }}>TENANT(S)</div>
          <div>Full Name : {blank(tenant?.name)}</div>
          <div>ID / Passport: {blank(tenant?.tax_id || tenant?.company_registration_number)}</div>
          <div>Address : {blank(tenantAddress)} (prior to move-in)</div>
          <div>
            Phone : {blank(tenant?.phone)} <span style={{ marginLeft: "42px" }} />
            Email : {blank(tenant?.email)}
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>PROPERTY DETAILS</div>
        </section>
        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>Address : {blank(propertyAddress)}</div>
          <div>
            Unit / Flat : {blank(unit?.unit_number)} <span style={{ marginLeft: "35px" }} />
            Type : {blank(unit?.unit_type)}
          </div>
          <div>
            Floor : {blank(unit?.floor)} <span style={{ marginLeft: "64px" }} />
            Size : {blank(unit?.size || "")}
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>LEASE TERMS</div>
        </section>
        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>Lease Type : {blank(lease.billing_cycle)}</div>
          <div>
            Start Date : {blank(lease.start_date)} <span style={{ marginLeft: "35px" }} />
            End Date : {blank(lease.end_date)}
          </div>
          <div>Lease Term : {leaseTermText}</div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>FINANCIALS</div>
        </section>
        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.6 }}>
          <div>Monthly Rent : {blank(`${lease.rent_amount} ${lease.rent_currency || ""}`)}</div>
          <div>Due Date : {blank(lease.start_date?.slice(8, 10))} of every month</div>
          <div>Grace Period : ___________________ days</div>
          <div>Late Payment Fee : ___________________</div>
          <div style={{ height: "6px" }} />
          <div>Security Deposit : {blank(`${lease.deposit_amount || ""} ${lease.deposit_currency || ""}`)}</div>
          <div>Deposit Due Date : {blank(lease.start_date)}</div>
          <div>Deposit Terms : Refundable within ___ days of lease end, less any deductions for damages or unpaid charges.</div>
          <div style={{ height: "6px" }} />
          <div style={{ fontWeight: 700 }}>ADDITIONAL CHARGES</div>
          <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
          {subs.length === 0 ? (
            <div>No subscription charges configured for this lease.</div>
          ) : (
            subs.map((s) => (
              <div key={s.id}>
                {(s.service_name || `Service #${s.service}`).trim()} : {parseAmount(s.rate).toFixed(2)}{" "}
                {(s.currency || "").trim() || rentCurrency || ""} ({s.billing_cycle})
              </div>
            ))
          )}
          <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
          <div>Total Monthly Due : {totalMonthlyDueLabel || "___________________"}</div>
          {paymentCode ? <div>Payment Code : {paymentCode}  {paymentLink}</div> : null}
        </section>

        {leaseTerms ? (
          <>
            {rule()}
            <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>Lease Terms</div>
            </section>
            {rule()}
            <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
              <div>{leaseTerms}</div>
            </section>
          </>
        ) : null}

        {rule()}
        <section style={{ fontSize: "11px", textAlign: "center", lineHeight: 1.5 }}>
          <div>This lease document was electronically issued. Both parties should retain</div>
          <div>a signed copy for their records. This document is</div>
          <div>legally binding upon execution by all named parties.</div>
        </section>
        {rule()}
      </div>
    </main>
  );
}
