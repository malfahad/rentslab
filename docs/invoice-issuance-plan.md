# Invoice issuance (automated billing) — implementation plan

This document describes how to implement an **invoice issuing** job that scans an organization, finds active leases and applicable service subscriptions, walks **missed billing periods**, and creates **consolidated invoices** with **explicit line items per period**. It complements the codebase constant `MAX_ISSUANCE_PERIODS_PER_LEASE` in `backend/invoice/constants.py`.

---

## 1. Objectives

- **Scope**: One **org** per run (`X-Org-ID` / `org_id`).
- **Inputs**: Optional **`as_of`** date (default: today) used to determine which periods are in the past or current and still billable.
- **Behavior**:
  - Consider **active** leases (and subscriptions subject to `effective_from` / `effective_to`).
  - **Walk prior billing periods** from the lease (and subscription) start through **`as_of`**, not only the single “current” period.
  - For periods where charges were **never invoiced**, create **one invoice per lease per issuance run** that contains **multiple `InvoiceLineItem` rows**—one row per missed period per charge (rent line per period; service lines per period where applicable).
  - **Do not** create duplicate lines for a period that is already covered (idempotency).
- **Triggers**:
  - Django **management command** (shell / cron).
  - **API** invoked by a **button** on the invoices dashboard page.
- **Execution**: Prefer a **background task** (e.g. Celery) so HTTP and shell do not block on large orgs; support a **sync** or **dry-run** path for development and ops.

---

## 2. Product rules (lock before coding)

| Topic | Decision needed |
|--------|------------------|
| **Period definition** | **Calendar** (e.g. monthly = calendar month) vs **lease anniversary** (periods anchored to `lease.start_date`). Same function must be used for rent and for aligning subscription lines unless explicitly different. |
| **Active lease** | e.g. `status = 'active'` and lease overlaps the period (handle `end_date` if set). |
| **Subscriptions** | Include a line for period *P* only if subscription is effective for *P* (`effective_from` / `effective_to`). Subscription `billing_cycle` may match or differ from lease—define whether you prorate, skip, or use separate sub-periods. |
| **Consolidated invoice** | **One invoice document per lease per run** listing all **new** missed period lines generated in that run (not one invoice per period). |
| **Due date** | Single `due_date` on the invoice header: e.g. `issue_date + N days`, or based on the **earliest** missed period—document the rule. |
| **Currencies** | Single currency per invoice if the org standard is one; if rent and services differ, define split invoices or conversion (v1 often: one org default currency). |

---

## 3. Data model

### 3.1 Current state

- `Invoice` is tied to `lease`, has `issue_date`, `due_date`, `total_amount`, `org`, etc. It does **not** yet encode **which billing periods** are represented when one invoice aggregates many periods.
- `InvoiceLineItem` has `description`, `amount`, optional `service` FK.

### 3.2 Recommended additions

**Invoice (header)**

- Optional metadata for catch-up runs, e.g. `issue_kind` (`standard` | `catch_up`) or free-text notes—only if needed for reporting.
- **Do not** rely on a single `billing_period_start` / `billing_period_end` for the whole invoice when one invoice spans **many** periods; that belongs on lines.

**InvoiceLineItem (required for idempotency and clarity)**

- `billing_period_start` (`DateField`, nullable initially for legacy rows)
- `billing_period_end` (`DateField`, nullable)
- Optional: `line_kind` (`rent` | `service` | `other`) if you want reporting without parsing `description`.

**Idempotency**

- Uniqueness / check before insert: no duplicate line for the same **`(lease_id, billing_period_start, billing_period_end, charge identity)`**, where **charge identity** is “rent” vs `service_id` for subscription lines.
- Implement via **DB constraint** (hard) or **application check** querying existing lines for that lease and period range (simpler for v1).

**`total_amount`**

- Must equal the **sum of line items** when the invoice is posted (existing invariant).

---

## 4. Period walking and cap

### 4.1 Algorithm (per lease)

1. Determine the **first billable period** (e.g. from `lease.start_date` and subscription `effective_from` as needed).
2. Generate the sequence of period boundaries `(start, end)` for `lease.billing_cycle` until **`as_of`**.
3. **Filter** to periods that are **missing** invoice coverage (no existing line with matching period + charge type).
4. **Apply the cap** (see §4.2).
5. Build **one new `Invoice`** if there is at least one missing line; append **one line per (period × charge)**.

### 4.2 Built-in cap: 100 periods

- **Constant**: `MAX_ISSUANCE_PERIODS_PER_LEASE = 100` in `backend/invoice/constants.py`.
- **Semantics**: Per lease, per issuance run, walk at most **100** billing periods when discovering missed cycles (after which the run stops for that lease and can be continued in a **subsequent** run if needed).
- **Ordering**: Define explicitly (e.g. **oldest missed periods first** until cap, or **most recent 100 periods** ending at `as_of`) and document it in code.

---

## 5. Core service module

- **Location**: e.g. `invoice/services/issue_invoices.py` (or `billing/services/…`).
- **Responsibilities**:
  - Accept `org_id`, `as_of`, `dry_run`, optional `sync` flag.
  - Enumerate leases and subscriptions (select/prefetch to avoid N+1).
  - For each lease, compute missed periods within the cap, build line payloads (description labels including period), compute `total_amount`, snapshot **bill_to_*** from tenant/lease billing rules.
  - Allocate **`invoice_number`** per org (sequence with concurrency safety).
  - Return a structured result: `{ created_invoices: [...], skipped_leases: [...], errors: [...], truncated_leases: [...] }` where **`truncated_leases`** lists leases that hit the 100-period cap so operators can re-run.

---

## 6. Async execution

- **Preferred**: **Celery** (or **django-rq**) task `issue_invoices_for_org.delay(org_id, as_of=..., dry_run=...)`.
- **Management command**: e.g. `python manage.py issue_invoices --org-id ID [--as-of DATE] [--dry-run] [--sync]`  
  - `--sync` runs the service in-process (for debugging); default enqueues the async task if configured.
- **No queue yet**: Implement the service synchronously behind the command and API first; add the queue when infrastructure is ready.

---

## 7. API and UI

- **Endpoint**: e.g. `POST /api/v1/invoices/issue/` or `POST /api/v1/billing/issue-invoices/` with body `{ "as_of": "optional ISO date" }`.
- **Auth**: Same org context as other finance endpoints; restrict to **org admin** (or a dedicated permission).
- **Response**:
  - **Queued**: `202` + `job_id` if async.
  - **Sync**: `200` + summary counts and any `truncated_leases`.
- **Invoices page**: Primary button **“Issue invoices”** (or “Run billing”) calling the API; show loading, then toast or modal with summary; if truncated, show a notice to run again.

---

## 8. Edge cases

- **Zero lines** after filtering: do not create an empty invoice.
- **Very long backlog**: Cap at 100 periods per lease per run; operators may run multiple times.
- **Duplicate run**: Idempotency via line-level period + charge checks prevents double-billing the same period.
- **Partial historical data**: Migrations may need backfill for `billing_period_*` on old lines if you enforce DB uniqueness only for new rows.

---

## 9. Testing

- Unit tests: period generator for each `billing_cycle` value; cap behavior (101 periods → only 100 processed + truncation flag).
- Integration: create lease + subscriptions, no prior lines, run issuance → one invoice, N lines; run again → **no** new invoice or lines.
- API: permission, `dry_run`, invalid `org`.

---

## 10. Implementation order

1. Migration: `InvoiceLineItem` period fields (+ optional invoice metadata).
2. Pure service: period walk, missed-period detection, cap, line building, idempotency checks.
3. Management command (`--dry-run`, `--sync`).
4. Celery task + wiring.
5. API + invoices page button.
6. Optional: `InvoiceIssuanceRun` audit table (org, timestamps, JSON stats) for support and UI polling.

---

## 11. References

| Item | Location |
|------|-----------|
| Period cap constant | `backend/invoice/constants.py` — `MAX_ISSUANCE_PERIODS_PER_LEASE` |
| Domain reference | `models.txt` — `invoice`, `invoice_line_item`, `lease`, `service_subscription` |

---

## 12. Out of scope (later)

- Email/PDF delivery of issued invoices.
- Proration mid-period move-in/out.
- Payment allocation automation.
