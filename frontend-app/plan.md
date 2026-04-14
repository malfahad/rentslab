# PMS Web Application — Implementation Plan

This document plans the **staff-facing web application** for RentSlab: property managers, org admins, agents, and finance users operating inside a single organization context. It assumes the backend exposes org-scoped APIs consistent with the domain model (organization, users/roles, landlords, buildings, units, tenants, leases as the operational pivot, services, invoices, payments, allocations).

**Brand alignment** is summarized from [`branding.md`](../branding.md) (PMS product UI only).

---

## 1. Brand and UI system (from `branding.md`)

### Positioning and audience

- **Core idea:** operational clarity with premium trust — a **data-first** system, not marketing-first.
- **Users:** property managers, landlords, finance/admin teams (plus agents and org admins as in this plan).

**Personality:** professional (structured, efficient), premium (calm, understated), trustworthy (financial-grade clarity), quiet luxury (minimal, intentional).

### Typography

| Role | Font | Use |
|------|------|-----|
| Primary UI | **Inter** (fallback: system-ui, -apple-system, Segoe UI) | Tables, forms, navigation, buttons, dense UI, H3 |
| Accent | **Canela** (fallback: Source Serif 4; alt: IBM Plex Serif) | **Only** section headers, page titles, property names on detail views, major financial highlights (e.g. revenue totals) |

**Rules:** navigation, tables, forms, buttons → Inter. Headers (H1/H2) and financial highlights → serif. Avoid heavy weights: default 400, emphasis 500, 600 rare.

**Scale (reference):** H1 serif 32–40px / 500 / 1.3; H2 serif 24–28px; H3 Inter 18–20px / 600. Body 14–16px; labels 12–13px; table text 13–14px; buttons 14px. Header letter-spacing ~0.2–0.5px.

### Color

| Token | Hex | Use |
|-------|-----|-----|
| Primary (trust navy) | `#1E3A5F` | Sidebar, primary buttons, headers |
| Secondary (muted blue) | `#2F5D8A` | Hover, active states |
| Accent (luxury gold) | `#C7A348` | Sparingly: key CTAs, highlights, focus accents |
| Background main | `#F7F9FB` | App canvas |
| Card | `#FFFFFF` | Cards |
| Section alt | `#F1F4F7` | Section bands |
| Text primary / secondary / muted | `#1A1A1A` / `#6B7280` / `#9CA3AF` | Body and hierarchy |
| Status success / warning / error / info | `#2E7D32` / `#ED6C02` / `#D32F2F` / `#0288D1` | Badges, alerts |

**Principle:** color for **meaning**, not decoration; remove visual noise.

### Layout and spacing

- **Grid:** 12 columns, max width **1280px**, gutter **24px**.
- **Spacing (8pt):** 4 → micro; 8 → tight; 16 → standard; 24 → section; 32 → large; 48 → page blocks.
- **Cards:** white bg, **1px** `#E5E7EB`, radius **12px**, padding 16–24px, subtle shadow.

### Components (product patterns)

- **Buttons:** primary = navy + white text, radius **8px**; secondary = outline `#D1D5DB`; **accent (gold)** only for the most important action on a screen.
- **Inputs:** height **40px**, border `#D1D5DB`; focus → navy border + soft ring.
- **Tables (critical):** row height **48px**; header bg `#F9FAFB`; light zebra; **sticky** headers; sorting; inline row actions.
- **Property summary cards:** prioritize name, unit count, occupancy, revenue; **de-emphasize** large imagery (small thumbnails OK).

### Shell navigation (labels aligned with brand)

Sidebar (navy): **Dashboard**, **Properties**, **Units**, **Tenants**, **Leases**, **Payments**, **Maintenance**, **Reports**. Active item: light background + **gold** indicator. Top bar: search, notifications, user menu.

Map domain concepts: landlords/buildings live under **Properties** (hierarchy); **Billing** / org settings can appear under Reports, Organization, or a settings area — keep hierarchy shallow.

### Data visualization

Muted palette, minimal gridlines, clear labels. **Focus metrics:** rent collection, occupancy, cash flow.

### Iconography

Line icons, **1.5px** stroke. Pair icons with **text labels**; avoid icon-only controls for critical actions.

### Imagery (in-app)

No marketing-style hero or lifestyle imagery. Use **small property thumbnails** and **document previews** where needed.

### UX principles

1. **Information density** — more data, less decoration.  
2. **Speed** — inline edits, quick actions where safe.  
3. **Clarity** — strong hierarchy, no noise.  
4. **Consistency** — reusable patterns across modules.

### Forms

Single column, grouped sections; inline validation; clear errors; optional autosave for long forms.

### Motion

Subtle only (e.g. hover elevation, fast dropdowns). **No** marketing-style animation.

### Accessibility

Contrast **≥ 4.5:1** where specified in brand; keyboard navigation; visible focus (navy/gold system).

### Design tokens (implement as CSS/theme)

```json
{
  "colors": {
    "primary": "#1E3A5F",
    "secondary": "#2F5D8A",
    "accent": "#C7A348",
    "background": "#F7F9FB",
    "text": "#1A1A1A"
  },
  "radius": { "card": "12px", "button": "8px" },
  "spacing": { "sm": "8px", "md": "16px", "lg": "24px" },
  "typography": {
    "primary": "Inter",
    "accent": "Canela, Source Serif 4, IBM Plex Serif"
  }
}
```

**Principle:** if it does not help manage property operations faster, remove it.

---

## 2. Goals and non-goals

**Goals**

- Full operational coverage for day-to-day PMS work: portfolio overview, tenancy lifecycle, billing and cash application, user and permission management within an org.
- Strict **org isolation** in the UI (no cross-org data; org selected after login or embedded in session).
- Responsive layouts for desktop-first workflows; tablet-friendly where it helps (e.g. walk-throughs).
- Accessibility (WCAG 2.1 AA) for forms, tables, and critical flows.

**Non-goals (initial phases)**

- Public marketing site (see `frontend-landing`).
- Native mobile features (see `frontend-mobile`); the web app may still be usable on mobile browsers for light tasks.
- Replacing accounting general ledger; export and integrations are enough until a later phase.

---

## 3. Recommended technical stack (decision point)

Pick one stack and standardize; the plan is stack-agnostic but assumes:

| Layer | Suggested options |
|--------|-------------------|
| Framework | React (Next.js or Vite + React Router), or Vue (Nuxt), or SvelteKit |
| State | TanStack Query for server state; lightweight client state (Zustand/Pinia) |
| Forms | React Hook Form + Zod (or equivalent) with API error mapping |
| Tables | TanStack Table + virtual scrolling for large lists |
| Auth | OIDC/JWT or session cookies per backend contract; refresh handling and CSRF if cookie-based |
| i18n | Optional from day one if multi-region; otherwise English first |

Document API base URL, environment flags, and feature flags in `.env` examples (without committing secrets).

---

## 4. Information architecture and navigation

**Primary navigation** (role-gated; labels match brand sidebar — see §1):

1. **Dashboard** — KPIs: occupancy, rent roll, arrears, upcoming lease expiries, recent payments; shortcuts to common actions (charts per brand data-viz rules).
2. **Properties** — Landlords → buildings → portfolio context; links into units.
3. **Units** — Unit status (vacant/occupied/maintenance); quick link to active lease; table-first list.
4. **Tenants** — Directory, profile, contact, linked leases and payment history (read-heavy; edits audited).
5. **Leases** — Create/edit/terminate; `managed_by` assignment; billing cycle and amounts; status workflow (`active` / `terminated` / `expired`).
6. **Payments** — Record payments (method, reference, date), optional `lease_id` linkage, **allocations** to invoices (many-to-many), partial allocations.
7. **Maintenance** — Work orders / tickets as backend supports (placeholder if API not ready).
8. **Reports** — Arrears aging, cash by period, occupancy, export CSV/PDF as backend supports.

**Additional areas** (settings drawer, org menu, or sub-routes): **Billing** (service catalog, subscriptions, invoices, credit notes), **Organization** (org profile, **Users & roles** — `UserRole`: unique `user_id` + `org_id`, roles such as `org_admin`, `property_manager`, `agent`, `read_only`).

**Deep links** — Support URLs such as `/leases/:id`, `/units/:id`, `/tenants/:id` for support and bookmarks.

---

## 5. Core user flows (must-have)

| Flow | Steps | Notes |
|------|--------|--------|
| Login / org context | Authenticate → resolve org(s) → select or default org → load permissions | Cache permission set client-side; revalidate on 403 |
| Create lease | Pick vacant unit → tenant (new or existing) → terms → save → optional invoice schedule | Enforce at most one **active** lease per unit (surface API errors clearly) |
| Record payment | Tenant/lease → amount → method → optional allocations to open invoices | Show allocation math; warn if over/under applied |
| Invoice lifecycle | Generate from lease/services → send (if integrated) → track paid vs open | Credit notes linked to invoices |
| User invite | Email → role → UserRole row | Align with backend invitation endpoints |

---

## 6. API integration principles

- **Pagination and filtering** on all list endpoints; debounced search for tenants/units/buildings.
- **Optimistic UI** only where safe; financial actions should await confirmation and show server truth.
- **Error contract** — Map validation errors to form fields; show idempotent retry for transient failures.
- **Real-time** — Optional WebSocket or polling for notification badges; not required for MVP if email/push handled elsewhere.

---

## 7. Security and compliance

- Store tokens per security guidelines (httpOnly cookies vs memory); never log PII or payment details.
- Role-based UI: hide or disable actions; **server remains source of truth** (403 on forbidden actions).
- Audit: display `created_at` / `updated_at` and actor where API provides it for sensitive entities.
- Session timeout and re-auth for sensitive operations if required by policy.

---

## 8. Phased delivery

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **P0 — Foundation** | Auth, org shell, branded layout (§1), sidebar + top bar, users/roles read-only, empty states | Deployed env; smoke tests |
| **P1 — Properties & leases** | Landlords, buildings, units, tenants CRUD; lease create/edit/list | Core invariants respected in UI |
| **P2 — Billing** | Services, subscriptions, invoices, credit notes | End-to-end invoice on test org |
| **P3 — Payments** | Payment entry, allocations, payment history | Reconciliation report matches backend |
| **P4 — Polish** | Reports, exports, performance, a11y pass (contrast, keyboard, focus per §1) | Stakeholder sign-off |

---

## 9. Testing strategy

- **Contract tests** or generated types from OpenAPI (if available) to reduce drift.
- **E2E** (Playwright/Cypress): login, create tenant, create lease, record payment with allocation.
- **Visual regression** optional for key pages.

---

## 10. Dependencies on backend

- Stable list/detail DTOs for all entities above; consistent error shape.
- Endpoints for reports or server-side aggregates for dashboard (avoid N+1 in browser).
- File upload if documents (leases, IDs) are required later.

---

## 11. Open decisions

- [ ] Exact framework (Next vs SPA).
- [ ] PDF generation: client-side vs server-only.
- [ ] Offline support: none vs minimal (service worker) for P1.

---

## 12. Milestone checklist (rolling)

- [ ] Repository scaffold, lint, CI, env templates
- [ ] Auth + org context + route guards
- [ ] Properties hierarchy UI + API wiring
- [ ] Lease workflow + validation messages
- [ ] Billing + payments + allocations
- [ ] Dashboard metrics
- [ ] E2E happy path + accessibility review

This plan should be updated when backend API versions or role names change.
