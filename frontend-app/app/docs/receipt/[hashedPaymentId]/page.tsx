"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { getPublicReceipt } from "@/services/payment-service";
import type { PublicReceiptDto } from "@/types/billing";

function formatDocumentDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const month = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatDocumentTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatLineItemDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm}`;
}

function formatFooterDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const month = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours() % 12;
  if (hours === 0) hours = 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${month}/${day}/${year} ${hours}:${mm}:${ss} ${ampm}`;
}

function parseAmount(raw: string): number {
  const n = Number.parseFloat(String(raw).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function formatLineCurrency(raw: string): string {
  return parseAmount(raw).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatTotalCurrency(raw: string): string {
  return parseAmount(raw).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQuantity(raw: string): string {
  return parseAmount(raw).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function rule() {
  return (
    <div style={{ borderTop: "1px solid #000000", margin: "10px 0" }} />
  );
}

function methodChecked(current: string, expected: string): string {
  return current.toLowerCase() === expected ? "x" : " ";
}

export default function ReceiptDocumentPage() {
  const { hashedPaymentId } = useParams<{ hashedPaymentId: string }>();
  const searchParams = useSearchParams();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [receipt, setReceipt] = useState<PublicReceiptDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const exportMode = useMemo(() => searchParams.get("export"), [searchParams]);

  useEffect(() => {
    if (!hashedPaymentId) return;
    setError(null);
    void getPublicReceipt(hashedPaymentId)
      .then(setReceipt)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) {
          setError("Receipt not found.");
          return;
        }
        setError("Could not load this receipt.");
      });
  }, [hashedPaymentId]);

  useEffect(() => {
    if (!receipt || !exportMode || exported) return;
    if (exportMode === "print") {
      setExported(true);
      window.print();
      return;
    }
    if (exportMode === "pdf" && receiptRef.current) {
      setExported(true);
      const run = async () => {
        const html2pdf = (await import("html2pdf.js")).default;
        const target = receiptRef.current;
        if (!target) return;
        await html2pdf()
          .from(target)
          .set({
            margin: [10, 10, 10, 10],
            filename: `receipt-${receipt.receipt_id}.pdf`,
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
            html2canvas: {
              scale: 3,
              backgroundColor: "#ffffff",
              useCORS: true,
              windowWidth: target.scrollWidth,
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .save();
      };
      void run();
    }
  }, [exportMode, exported, receipt]);

  if (error) {
    return (
      <main style={{ padding: "24px", fontFamily: "Courier New, monospace", color: "#000000" }}>
        <p>{error}</p>
      </main>
    );
  }

  if (!receipt) {
    return (
      <main style={{ padding: "24px", fontFamily: "Courier New, monospace", color: "#000000" }}>
        <p>Loading receipt...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        background: "#ffffff",
        color: "#000000",
        padding: "12px",
        fontFamily: "Courier New, monospace",
      }}
    >
      <div
        ref={receiptRef}
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          lineHeight: 1.4,
          letterSpacing: "0.1px",
        }}
      >
        {rule()}
        <section style={{ textAlign: "center", fontSize: "12px", fontWeight: 700 }}>RENT RECEIPT</section>
        {rule()}

        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>
            Receipt No. : {receipt.receipt_id} <span style={{ marginLeft: "40px" }} /> Date Issued :{" "}
            {formatDocumentDate(receipt.issued_date_time)}
          </div>
          <div>
            <span style={{ visibility: "hidden" }}>Receipt No. : XXXXX</span>
            <span style={{ marginLeft: "40px" }} /> Payment Date : {formatDocumentDate(receipt.date_time)} {formatDocumentTime(receipt.date_time)}
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>LANDLORD</div>
          <div>Name : {receipt.landlord.name || "-"}</div>
          <div>Contact : {receipt.landlord.contact || "-"}</div>
          <div style={{ height: "8px" }} />
          <div style={{ fontWeight: 700 }}>TENANT</div>
          <div>Name : {receipt.tenant_name || "-"}</div>
          <div>Contact : {receipt.tenant_contact || "-"}</div>
          <div style={{ height: "8px" }} />
          <div style={{ fontWeight: 700 }}>PROPERTY</div>
          <div>Address : {receipt.building.address || "-"}</div>
          <div>Unit : {receipt.unit_number || "-"}</div>
          <div>
            Period : {receipt.period_start || "___________________"} to{" "}
            {receipt.period_end || "___________________"}
          </div>
        </section>

        {rule()}
        <section style={{ fontSize: "11px", lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Rent</span>
            <span>{formatTotalCurrency(receipt.rent_amount_ugx)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Other Charges</span>
            <span>{formatTotalCurrency(receipt.subscription_charge_ugx)}</span>
          </div>
          <div style={{ textAlign: "right" }}>-------------------</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>TOTAL PAID</span>
            <span>{formatTotalCurrency(receipt.grand_total_ugx)}</span>
          </div>

          <div style={{ marginTop: "8px" }}>
            Method : [{methodChecked(receipt.method, "cash")}] Cash  [{methodChecked(receipt.method, "bank")}] Bank Transfer  [{methodChecked(receipt.method, "mobile_money")}] Mobile Money  [{methodChecked(receipt.method, "check")}] Cheque
          </div>
          <div>Ref. No.: {receipt.reference || "___________________"}</div>
          <div>
            Status : [{receipt.status === "paid_in_full" ? "x" : " "}] Paid in Full    [{receipt.status === "partial" ? "x" : " "}] Partial - Balance Due: {formatTotalCurrency(receipt.balance_due_ugx)}
          </div>
        </section>

        {receipt.invoice_breakdown.length > 0 ? (
          <section style={{ marginTop: "10px", fontSize: "10px" }}>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>
              Invoice-by-invoice breakdown
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                lineHeight: 1.4,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #000", padding: "4px 6px 4px 0", width: "16%" }}>
                    Invoice
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #000", padding: "4px 6px", width: "24%" }}>
                    Line Item
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #000", padding: "4px 6px", width: "20%" }}>
                    Period
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #000", padding: "4px 6px", width: "10%" }}>
                    Type
                  </th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #000", padding: "4px 6px", width: "15%" }}>
                    Base UGX
                  </th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #000", padding: "4px 0 4px 6px", width: "15%" }}>
                    Alloc UGX
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.invoice_breakdown.flatMap((invoice) =>
                  invoice.line_items.map((line, idx) => (
                    <tr key={`${invoice.invoice_id}-${line.line_item_id ?? idx}`}>
                      <td style={{ borderBottom: "1px solid #ccc", padding: "4px 6px 4px 0", verticalAlign: "top" }}>
                        {idx === 0 ? invoice.invoice_number : ""}
                      </td>
                      <td style={{ borderBottom: "1px solid #ccc", padding: "4px 6px", verticalAlign: "top" }}>
                        {line.description}
                      </td>
                      <td style={{ borderBottom: "1px solid #ccc", padding: "4px 6px", verticalAlign: "top" }}>
                        {line.billing_period_start || "-"} to {line.billing_period_end || "-"}
                      </td>
                      <td style={{ borderBottom: "1px solid #ccc", padding: "4px 6px", verticalAlign: "top", textTransform: "capitalize" }}>
                        {line.line_kind}
                      </td>
                      <td style={{ borderBottom: "1px solid #ccc", padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>
                        {formatTotalCurrency(line.base_amount_ugx)}
                      </td>
                      <td style={{ borderBottom: "1px solid #ccc", padding: "4px 0 4px 6px", textAlign: "right", verticalAlign: "top" }}>
                        {formatTotalCurrency(line.allocated_amount_ugx)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </section>
        ) : null}

        {rule()}
        {receipt.notes ? (
          <>
            <section style={{ fontSize: "11px" }}>
              <div>Notes : {receipt.notes}</div>
            </section>
            {rule()}
          </>
        ) : null}

        <section style={{ fontSize: "11px", lineHeight: 1.5 }}>
          <div>Issued by : {receipt.issued_by || receipt.org.name}</div>
          <div>Date : {formatDocumentDate(receipt.issued_date_time)}</div>
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            This receipt was electronically issued. Retain for your records.
          </div>
        </section>
        {rule()}
      </div>
    </main>
  );
}
