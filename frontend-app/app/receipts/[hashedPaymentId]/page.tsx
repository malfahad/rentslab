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

export default function PublicReceiptPage() {
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
        await html2pdf()
          .from(receiptRef.current)
          .set({
            margin: [8, 8, 8, 8],
            filename: `receipt-${receipt.receipt_id}.pdf`,
            html2canvas: { scale: 2, backgroundColor: "#ffffff" },
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
        padding: "10px",
        fontFamily: "Courier New, monospace",
      }}
    >
      <div ref={receiptRef} style={{ maxWidth: "980px", margin: "0 auto" }}>
        <section style={{ fontSize: "11px", lineHeight: 1.25 }}>
          <div>{formatDocumentDate(receipt.date_time)}</div>
          <div>{formatDocumentTime(receipt.date_time)}</div>
        </section>

        <section style={{ textAlign: "center", marginTop: "4px" }}>
          <div style={{ fontSize: "11px" }}>{receipt.org.location || receipt.org.name}</div>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>{receipt.org.name.toUpperCase()}</div>
          <div style={{ fontSize: "11px" }}>{receipt.org.address}</div>
          <div style={{ fontSize: "11px" }}>TEL: {receipt.org.telephone || "-"}</div>
        </section>

        <section style={{ marginTop: "6px" }}>
          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700 }}>{receipt.title}</div>
          <div style={{ textAlign: "center", fontSize: "11px" }}>{receipt.subtitle}</div>
          <div style={{ fontSize: "11px", marginTop: "2px" }}>
            For The Period {formatDocumentDate(receipt.date_time)}
          </div>
          <div style={{ fontSize: "11px" }}>
            Page {receipt.page.current} / {receipt.page.total}
          </div>
        </section>

        <section style={{ marginTop: "6px", fontSize: "11px", fontWeight: 700 }}>
          {receipt.operator_name} ______________________
        </section>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            marginTop: "6px",
            fontSize: "10px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #000000" }}>
              <th style={{ textAlign: "left", fontWeight: 700, width: "45%" }}>Item</th>
              <th style={{ textAlign: "left", fontWeight: 700, width: "25%" }}>Date</th>
              <th style={{ textAlign: "right", fontWeight: 700, width: "10%" }}>Qty</th>
              <th style={{ textAlign: "right", fontWeight: 700, width: "20%" }}>Sales UGX</th>
            </tr>
          </thead>
          <tbody>
            {receipt.rows.map((row, idx) => (
              <tr key={`${row.item}-${idx}`} style={{ borderBottom: "0.5px solid #cccccc" }}>
                <td style={{ textAlign: "left", padding: "2px 0" }}>{row.item}</td>
                <td style={{ textAlign: "left", padding: "2px 0" }}>
                  {formatLineItemDate(row.timestamp)}
                </td>
                <td style={{ textAlign: "right", padding: "2px 0" }}>{formatQuantity(row.quantity)}</td>
                <td style={{ textAlign: "right", padding: "2px 0" }}>
                  {formatLineCurrency(row.sales_ugx)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid #000000" }}>
              <td />
              <td />
              <td style={{ textAlign: "right", fontWeight: 700, paddingTop: "2px" }}>Subtotal</td>
              <td style={{ textAlign: "right", fontWeight: 700, paddingTop: "2px" }}>
                {formatTotalCurrency(receipt.subtotal_ugx)}
              </td>
            </tr>
            <tr style={{ borderTop: "1.5px solid #000000" }}>
              <td />
              <td />
              <td style={{ textAlign: "right", fontWeight: 700, paddingTop: "2px" }}>Grand Total</td>
              <td style={{ textAlign: "right", fontWeight: 700, paddingTop: "2px" }}>
                {formatTotalCurrency(receipt.grand_total_ugx)}
              </td>
            </tr>
          </tbody>
        </table>

        <footer style={{ marginTop: "8px", fontSize: "10px", color: "#555555" }}>
          {receipt.footer_reference}  {formatFooterDate(receipt.date_time)}
        </footer>
      </div>
    </main>
  );
}
