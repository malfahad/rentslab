# RentSlab Document Design System

Applies to: receipts, invoices, reports, extracts

---

## 1. Typeface

Single typeface throughout every document: **Courier New** (monospace).  
No secondary or decorative fonts are used anywhere.

| Role | Size | Weight |
|---|---|---|
| Organisation name | 13px | Bold |
| Document title | 12px | Bold |
| Staff name | 11px | Bold |
| Body / line items | 10–11px | Regular |
| Column headers | 10px | Bold |
| Footer / timestamps | 10px | Regular |

---

## 2. Colour

Two colours only, sourced directly from the source document.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#000000` | All text, table borders, header/footer rules |
| `--rule-light` | `#cccccc` | Row separator lines between line items |
| `--surface` | `#ffffff` | Page background — no fills anywhere |

No background colours, no coloured text, no accent colours.

---

## 3. Document Structure

Every document follows this exact top-to-bottom zone order.

```
┌─────────────────────────────────────────┐
│  ZONE 1 — DATE / TIME                   │  left-aligned, 11px
│  ZONE 2 — ORGANISATION BLOCK            │  centred, 13px bold (name)
│             address line                │  centred, 11px
│             TEL: number                 │  centred, 11px
├─────────────────────────────────────────┤
│  ZONE 3 — DOCUMENT TITLE               │  centred, 12px bold
│             subtitle / type            │  centred, 11px
│  For The Period  DD/MM/YYYY            │  left-aligned, 11px
│  Page X / Y                            │  left-aligned, 11px
├─────────────────────────────────────────┤
│  ZONE 4 — OPERATOR NAME ___________    │  left-aligned, 11px bold
├─────────────────────────────────────────┤
│  ZONE 5 — COLUMN HEADERS               │  10px bold, 1px solid #000 below
│─────────────────────────────────────────│
│  line item row                          │  10px regular, 0.5px #ccc below
│  line item row (repeats)               │
│─────────────────────────────────────────│
│  SUBTOTAL ROW                          │  10px bold, 1px solid #000 above
│  GRAND TOTAL ROW                       │  10px bold, 1.5px solid #000 above
├─────────────────────────────────────────┤
│  ZONE 6 — REPORT ID · TIMESTAMP        │  left-aligned, 10px, colour #555
└─────────────────────────────────────────┘
```

---

## 4. Zone Specifications

### Zone 1 — Date / Time
- Two separate lines: date on line 1, time on line 2
- Format: `M/DD/YYYY` and `HH:MM` (no seconds)
- Left-aligned, 11px regular

### Zone 2 — Organisation Block
- Location / street name: centred, 11px regular
- Organisation name: centred, 13px bold, ALL CAPS
- Address line: centred, 11px regular
- Telephone: centred, 11px regular, prefix `TEL:`
- No logo, no decorative rule

### Zone 3 — Document Title Block
- Document title: centred, 12px bold (e.g. `Staff POS Sales - Detailed`)
- Document subtype or scope: centred, 11px regular (e.g. `For The Period 3/31/2026`)
- Page indicator: left-aligned, 11px regular, format `Page X / Y`

### Zone 4 — Operator Name
- Staff / operator name: left-aligned, 11px bold, ALL CAPS
- Followed immediately by a dashed underline of fixed width (`________________`)
- No label prefix

### Zone 5 — Line Items Table

#### Column order (left to right)
1. Item code + description (combined, left-aligned)
2. Date (DD/MM/YYYY HH:MM, left-aligned)
3. Qty (right-aligned)
4. Discount (right-aligned)
5. % Discount (right-aligned)
6. Sales UGX (right-aligned)
7. Cost UGX (right-aligned)
8. Profit UGX (right-aligned)

Adapt column set to document type:
- **Receipt** — Item, Date, Qty, Sales UGX
- **Invoice** — Item, Qty, Unit Price UGX, Total UGX
- **Extract** — use only columns relevant to the extract's scope
- **Report** — full column set as above

#### Column header row
- 10px bold, left-aligned for text columns, right-aligned for numeric columns
- Separated from data rows by `1px solid #000`

#### Data rows
- 10px regular
- All numeric values right-aligned
- All text values left-aligned
- Row separator: `0.5px solid #ccc` below each row

#### Totals
- Subtotal row: 10px bold, `1px solid #000` above
- Grand total row: 10px bold, `1.5px solid #000` above
- Same column alignment as data rows
- Empty cells in non-numeric columns left blank (no label, no dash)

### Zone 6 — Footer
- Report reference code, then two spaces, then full timestamp
- Format: `REP_xxxxx  DD/MM/YYYY H:MM:SS AM/PM`
- Left-aligned, 10px regular, colour `#555555`
- No page number repeated here (page number is in Zone 3)

---

## 5. Number Formatting

| Value type | Format | Example |
|---|---|---|
| Quantities | Two decimal places | `10.00` |
| Currency amounts | Comma-separated thousands, no decimals in line items | `1,500,000` |
| Currency totals | Comma-separated thousands, two decimal places | `5,651,000.00` |
| Discount amount | Integer | `0` |
| Discount percent | One decimal place, `%` suffix | `0.0%` |
| Zero cost | `0` (not blank, not dash) | `0` |

Currency label (`UGX`) appears in the column header only, not repeated per cell.

---

## 6. Date and Time Formatting

| Context | Format | Example |
|---|---|---|
| Document date (Zone 1) | `M/DD/YYYY` | `3/31/2026` |
| Period reference | `M/DD/YYYY` | `3/31/2026` |
| Line item timestamp | `DD/MM/YYYY HH:MM` | `31/03/2026 18:50` |
| Footer timestamp | `M/DD/YYYY H:MM:SS AM/PM` | `3/31/2026 7:11:46 PM` |

---

## 7. Borders and Rules

| Element | Rule |
|---|---|
| Column header bottom | `1px solid #000` |
| Subtotal top | `1px solid #000` |
| Grand total top | `1.5px solid #000` |
| Data row bottom | `0.5px solid #ccc` |
| All other borders | none |

No rounded corners. No box shadows. No decorative rules or dividers.

---

## 8. Spacing and Alignment

- Page margins: narrow (documents are dense, tabular)
- No padding between zones — zones are visually separated by font weight and rules only
- Table: `border-collapse: collapse`, `table-layout: fixed`
- Numeric columns: `text-align: right`
- Text columns: `text-align: left`
- No cell background colours

---

## 9. Document Type Variations

All document types share Zones 1–4 and Zone 6 unchanged.  
Zone 3 title and Zone 5 columns change per document type.

| Document | Zone 3 Title | Zone 5 Columns |
|---|---|---|
| Sales report | `Staff POS Sales - Detailed` | Code+Item, Date, Qty, Discount, %Discount, Sales UGX, Cost UGX, Profit UGX |
| Receipt | `Payment Receipt` | Item, Date, Qty, Sales UGX |
| Invoice | `Tax Invoice` | Code+Item, Qty, Unit Price UGX, Discount, Total UGX |
| Extract | `[Period] Extract` | Columns relevant to extract scope only |

---

## 10. What Is Not in the Design System

The following are absent from the source document and must not be introduced:

- Logo or graphic marks
- Accent colours or coloured text
- Background fills on any row, header, or cell
- Rounded corners or box shadows
- Icons or symbols
- Horizontal rules outside the table
- Zebra striping (rows differ only by the `0.5px #ccc` separator)
- Bold or coloured totals (totals are bold only, same colour as body)
- Fonts other than Courier New