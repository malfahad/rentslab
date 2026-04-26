import Link from "next/link";

export default function DocsIndexPage() {
  return (
    <main style={{ padding: "20px", fontFamily: "Courier New, monospace", color: "#000000" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Document Renderers</h1>
        <ul style={{ margin: 0, paddingLeft: "16px", lineHeight: 1.6 }}>
          <li>
            <Link href="/docs/receipt/demo">Receipt renderer</Link>
          </li>
          <li>
            <Link href="/docs/invoice/1">Invoice renderer</Link>
          </li>
          <li>
            <Link href="/docs/report/1">Report renderer</Link>
          </li>
          <li>
            <Link href="/docs/lease/1">Lease renderer</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
