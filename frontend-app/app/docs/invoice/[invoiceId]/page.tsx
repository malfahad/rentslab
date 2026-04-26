"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { getPublicInvoiceDocument } from "@/services/invoice-service";
import type { InvoiceDto, InvoiceLineItemDto } from "@/types/billing";
import type { LeaseDto, TenantDto } from "@/types/operations";
import type { BuildingDto, LandlordDto, UnitDto } from "@/types/portfolio";
import type { OrgDto } from "@/types/org";

function parseAmount(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function formatCurrency(raw: string): string {
  return parseAmount(raw).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function rule() {
  return <div style={{ borderTop: "1px solid #000000", margin: "10px 0" }} />;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "___________________";
  return value;
}

function checked(flag: boolean): string {
  return flag ? "x" : " ";
}

function compactAddress(parts: Array<string | null | undefined>): string {
  return parts.map((v) => (v || "").trim()).filter(Boolean).join(", ");
}

export default function InvoiceDocumentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const searchParams = useSearchParams();
  const exportMode = useMemo(() => searchParams.get("export"), [searchParams]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [lines, setLines] = useState<InvoiceLineItemDto[]>([]);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [unit, setUnit] = useState<UnitDto | null>(null);
  const [building, setBuilding] = useState<BuildingDto | null>(null);
  const [landlord, setLandlord] = useState<LandlordDto | null>(null);
  const [org, setOrg] = useState<OrgDto | null>(null);
  const [invoiceNotes, setInvoiceNotes] = useState("");
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
    void getPublicInvoiceDocument(invoiceId)
      .then((payload) => {
        const p = payload as {
          invoice: InvoiceDto;
          line_items: InvoiceLineItemDto[];
          lease: LeaseDto;
          tenant: TenantDto;
          unit: UnitDto;
          building: BuildingDto;
          landlord: LandlordDto;
          org: (OrgDto & { settings?: Record<string, unknown> }) | null;
        };
        setInvoice(p.invoice);
        setLines(p.line_items || []);
        setLease(p.lease || null);
        setTenant(p.tenant || null);
        setUnit(p.unit || null);
        setBuilding(p.building || null);
        setLandlord(p.landlord || null);
        setOrg(p.org || null);
        const note = typeof p.org?.settings?.invoice_notes === "string" ? p.org.settings.invoice_notes : "";
        setInvoiceNotes(note.trim());
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.messageForUser : "Could not load invoice document.");
      });
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice || !exportMode || exported) return;
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
            filename: `invoice-${invoice.id}.pdf`,
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
            html2canvas: { scale: 3, backgroundColor: "#ffffff", useCORS: true, windowWidth: target.scrollWidth },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .save();
      };
      void run();
    }
  }, [exportMode, exported, invoice]);

  if (error) {
    return <main style={{ padding: "16px", fontFamily: "Courier New, monospace" }}>{error}</main>;
  }

  if (!invoice) {
    return <main style={{ padding: "16px", fontFamily: "Courier New, monospace" }}>Loading invoice...</main>;
  }

  const firstPeriodStart = lines
    .map((l) => l.billing_period_start)
    .filter((v): v is string => Boolean(v))
    .sort()[0];
  const lastPeriodEnd = lines
    .map((l) => l.billing_period_end)
    .filter((v): v is string => Boolean(v))
    .sort()
    .slice(-1)[0];
  const propertyAddress = building
    ? compactAddress([
        building.name,
        building.address_line1,
        building.address_line2,
        compactAddress([building.city, building.region, building.postal_code]),
        building.country_code,
      ])
    : "_______________________________";
  const tenantAddress = compactAddress([
    invoice.bill_to_address_line1 || tenant?.address_line1,
    invoice.bill_to_address_line2 || tenant?.address_line2,
    compactAddress([invoice.bill_to_city || tenant?.city, invoice.bill_to_region || tenant?.region, invoice.bill_to_postal_code || tenant?.postal_code]),
    invoice.bill_to_country_code || tenant?.country_code,
  ]);
  const landlordAddress = compactAddress([
    landlord?.address_line1,
    landlord?.address_line2,
    compactAddress([landlord?.city, landlord?.region, landlord?.postal_code]),
    landlord?.country_code,
  ]);
  const totalDue = formatCurrency(invoice.total_amount);
  const status = invoice.status.toLowerCase();
  const paymentCode = unit?.payment_code?.trim() || "";
  const paymentLink = paymentCode
    ? `${appOrigin || "http://localhost:3000"}/pay/${paymentCode}`
    : "";
  const issuedByAddress = compactAddress([
    org?.address_line1,
    org?.address_line2,
    compactAddress([org?.city, org?.region, org?.postal_code]),
    org?.country_code,
  ]);

  return (
    <main style={{ padding: "16px", background: "#ffffff", color: "#000000", fontFamily: "Courier New, monospace" }}>
      <div ref={rootRef} style={{ maxWidth: "900px", margin: "0 auto", lineHeight: 1.4 }}>
        {rule()}
        <header style={{ textAlign: "center", fontWeight: 700, fontSize: "12px" }}>RENT INVOICE</header>
        {rule()}

        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>
            Invoice No. : {invoice.invoice_number?.trim() || `INV-${invoice.id}`} <span style={{ marginLeft: "28px" }} />
            Issue Date : {formatDate(invoice.issue_date)}
          </div>
          <div>
            Due Date : {formatDate(invoice.due_date)} <span style={{ marginLeft: "55px" }} />
            Period : {formatDate(firstPeriodStart)} to {formatDate(lastPeriodEnd)}
          </div>
        </section>

        {rule()}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "11px", lineHeight: 1.5 }}>
          <div>
            <div style={{ fontWeight: 700 }}>LANDLORD</div>
            <div>Name : {landlord?.name || "_______________________"}</div>
            <div>Address : {landlordAddress || "_______________________"}</div>
            <div>Phone : {landlord?.phone || "_______________________"}</div>
            <div>Email : {landlord?.email || "_______________________"}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>TENANT</div>
            <div>Name : {invoice.bill_to_name?.trim() || tenant?.name || "_______________________"}</div>
            <div>Phone : {tenant?.phone || "_______________________"}</div>
            <div>Email : {tenant?.email || "_______________________"}</div>
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>PROPERTY</div>
          <div>Address : {building?.name || "___________________"}</div>
          <div>         {propertyAddress}</div>
          <div>
            Unit : {unit?.unit_number || lease?.unit_label || "___________________"} <span style={{ marginLeft: "35px" }} />
            Type : {unit?.unit_type || "___________________"}
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px" }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>LINE ITEMS</div>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "10px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 6px 4px 0", width: "8%" }}>#</th>
                <th style={{ textAlign: "left", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 6px", width: "46%" }}>Description</th>
                <th style={{ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 6px", width: "12%" }}>Qty</th>
                <th style={{ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 6px", width: "17%" }}>Rate</th>
                <th style={{ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 0 4px 6px", width: "17%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ borderBottom: "1px solid #ccc", padding: "5px 6px 5px 0" }}>{idx + 1}.</td>
                  <td style={{ borderBottom: "1px solid #ccc", padding: "5px 6px" }}>{row.description || `Line ${row.line_number}`}</td>
                  <td style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "5px 6px" }}>1.00</td>
                  <td style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "5px 6px" }}>{formatCurrency(row.amount)}</td>
                  <td style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "5px 0 5px 6px" }}>{formatCurrency(row.amount)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} />
                <td style={{ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "5px 6px", fontWeight: 700 }}>
                  TOTAL DUE
                </td>
                <td style={{ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "5px 0 5px 6px", fontWeight: 700 }}>
                  {totalDue}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {paymentCode ? (
          <>
            {rule()}
            <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>PAYMENT CODE</div>
              <div>Code : {paymentCode}</div>
              <div>Link : {paymentLink}</div>
            </section>
          </>
        ) : null}

        {invoiceNotes ? (
          <>
            {rule()}
            <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>NOTES</div>
              <div>{invoiceNotes}</div>
            </section>
          </>
        ) : null}

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>
            Status : [{checked(status === "unpaid")}] Unpaid    [{checked(status.includes("partial"))}] Partially Paid    [{checked(status === "paid" || status.includes("paid_in_full"))}] Paid in Full
          </div>
          <div>Issued by : {org?.name || "_______________________________"}</div>
          <div>            {issuedByAddress || "_______________________________"}</div>
          <div>Date : {formatDate(invoice.issue_date)}</div>
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            This invoice was electronically issued and is valid without a wet signature.
          </div>
          <div style={{ textAlign: "center" }}>Please retain for your records.</div>
        </section>
        {rule()}
      </div>
    </main>
  );
}
