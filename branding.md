Here is your **fully updated `branding.md`** with the refined **luxury + readability typography system** integrated and aligned for a **PMS (data-first system)**.

---

# branding.md

## 1. Brand Positioning

### Core Idea

**Operational clarity with premium trust**

This system is not marketing-first. It is built for:

* Property managers
* Landlords
* Finance/admin teams

### Brand Personality

| Trait        | Description                     |
| ------------ | ------------------------------- |
| Professional | Structured, efficient, no noise |
| Premium      | Calm, understated, confident    |
| Trustworthy  | Financial-grade clarity         |
| Quiet Luxury | Minimal, intentional, refined   |

---

## 2. Typography System (Luxury + Readability)

### Philosophy

> Luxury comes from restraint, spacing, and clarity — not decorative typography.

---

### Primary UI Font (System Backbone)

**Font:** Inter
**Fallback:** system-ui, -apple-system, Segoe UI

Used for:

* Tables
* Forms
* Navigation
* Buttons
* All dense UI

---

### Secondary Accent Font (Luxury + Readable)

**Primary:** Canela
**Fallback:** Source Serif 4
**Alternative:** IBM Plex Serif

Used ONLY for:

* Section headers
* Page titles
* Property names (detail view)
* Financial highlights (e.g., revenue totals)

---

### Strict Usage Rules

| Context    | Font  |
| ---------- | ----- |
| Navigation | Inter |
| Tables     | Inter |
| Forms      | Inter |
| Buttons    | Inter |
| Headers    | Serif |
| Highlights | Serif |

---

### Typography Scale

#### Headers (Sparse, Intentional)

| Element | Font  | Size    | Weight | Line Height |
| ------- | ----- | ------- | ------ | ----------- |
| H1      | Serif | 32–40px | 500    | 1.3         |
| H2      | Serif | 24–28px | 500    | 1.3         |
| H3      | Inter | 18–20px | 600    | 1.4         |

---

#### Body & UI

| Element    | Size    | Weight | Line Height |
| ---------- | ------- | ------ | ----------- |
| Body       | 14–16px | 400    | 1.5–1.6     |
| Labels     | 12–13px | 500    | 1.4         |
| Table Text | 13–14px | 400    | 1.4         |
| Buttons    | 14px    | 500    | 1.4         |

---

### Letter Spacing

* Headers: `0.2px – 0.5px`
* Body: default (no adjustment)

---

### Weight Discipline

Avoid heavy UI. Use:

* 400 → default
* 500 → emphasis
* 600 → rare

---

## 3. Color System

### Core Principle

> Remove visual noise. Use color for meaning, not decoration.

---

### Primary (Trust Navy)

* `#1E3A5F`

Used for:

* Sidebar
* Primary buttons
* Headers

---

### Secondary (Muted Blue)

* `#2F5D8A`

Used for:

* Hover states
* Active UI

---

### Accent (Luxury Gold)

* `#C7A348`

Used sparingly for:

* Primary actions
* Highlights
* Focus states

---

### Backgrounds

| Type    | Color   |
| ------- | ------- |
| Main    | #F7F9FB |
| Card    | #FFFFFF |
| Section | #F1F4F7 |

---

### Text Colors

| Type      | Color   |
| --------- | ------- |
| Primary   | #1A1A1A |
| Secondary | #6B7280 |
| Muted     | #9CA3AF |

---

### Status Colors

| Status  | Color   |
| ------- | ------- |
| Success | #2E7D32 |
| Warning | #ED6C02 |
| Error   | #D32F2F |
| Info    | #0288D1 |

---

## 4. Layout System

### Grid

* 12 columns
* Max width: 1280px
* Gutter: 24px

---

### Spacing (8pt System)

```
4px  → micro
8px  → tight
16px → standard
24px → section
32px → large
48px → page blocks
```

---

### Cards (Core Component)

* Background: white
* Border: 1px solid #E5E7EB
* Radius: 12px
* Padding: 16–24px
* Shadow: subtle

---

## 5. Component System

### Buttons

#### Primary

* Background: Navy
* Text: White
* Radius: 8px

#### Secondary

* Outline
* Border: #D1D5DB
* Background: white

#### Accent

* Gold
* Use only for key actions

---

### Inputs

* Height: 40px
* Border: #D1D5DB

Focus:

* Border → Navy
* Soft focus ring

---

### Tables (Critical PMS Component)

#### Structure

* Row height: 48px
* Header background: #F9FAFB
* Subtle zebra striping

#### Features

* Sticky headers
* Sorting
* Inline actions

---

### Property Cards (Simplified)

Prioritize:

* Property name
* Unit count
* Occupancy
* Revenue

De-emphasize images.

---

## 6. Navigation System

### Sidebar (Primary)

Sections:

* Dashboard
* Properties
* Units
* Tenants
* Leases
* Payments
* Maintenance
* Reports

---

### Style

* Background: Navy
* Active item:

  * Light background
  * Gold indicator

---

### Top Bar

Contains:

* Search
* Notifications
* User menu

---

## 7. Data Visualization

### Rules

* Muted palette
* Minimal gridlines
* Clear labels

---

### Focus Metrics

* Rent collection
* Occupancy rate
* Cash flow

---

## 8. Iconography

### Style

* Line icons
* 1.5px stroke

---

### Rules

* Always paired with labels
* Avoid icon-only critical actions

---

## 9. Imagery Guidelines

### Remove

* Hero banners
* Lifestyle imagery

---

### Keep

* Small property thumbnails
* Document previews

---

## 10. UX Principles (PMS Shift)

### Priorities

#### 1. Information Density

More data, less decoration

#### 2. Speed

* Inline edits
* Quick actions

#### 3. Clarity

* Strong hierarchy
* No visual noise

#### 4. Consistency

* Reusable patterns across modules

---

## 11. Page Templates

### Dashboard

* KPI cards
* Charts
* Alerts

---

### Property List

* Default: table
* Optional: card view

---

### Property Detail

Sections:

* Overview
* Units
* Tenants
* Financials
* Maintenance

---

## 12. Forms

### Structure

* Single column
* Grouped sections

---

### Behavior

* Inline validation
* Clear errors
* Optional autosave

---

## 13. Motion

### Rules

* Subtle only
* No marketing animations

---

### Examples

* Hover elevation
* Fast dropdown transitions

---

## 14. Accessibility

* Contrast ≥ 4.5
* Keyboard navigation
* Clear focus states

---

## 15. Design Tokens

```json
{
  "colors": {
    "primary": "#1E3A5F",
    "secondary": "#2F5D8A",
    "accent": "#C7A348",
    "background": "#F7F9FB",
    "text": "#1A1A1A"
  },
  "radius": {
    "card": "12px",
    "button": "8px"
  },
  "spacing": {
    "sm": "8px",
    "md": "16px",
    "lg": "24px"
  },
  "typography": {
    "primary": "Inter",
    "accent": "Canela, Source Serif 4, IBM Plex Serif"
  }
}
```

---

## 16. Public marketing / landing (benchmark-informed)

Industry benchmarks (e.g. high-converting SaaS landings) often use a **repeatable page skeleton**: sticky header with primary CTA, a strong hero, a **social proof** strip, a **three-pillar feature grid**, a closing CTA band, and a **deep footer**. That **structure** is useful for RentSlab.

**What we do not import:** competitor **brand colors** (e.g. bright magenta/pink palettes), vacation-rental–specific lifestyle stock, or noisy motion. RentSlab stays **trust navy**, **muted blue**, **luxury gold**, and **quiet luxury** typography.

### Mapped patterns (RentSlab)

| Benchmark pattern | RentSlab interpretation |
| ----------------- | ------------------------- |
| Sticky header + Log in + Sign up | Same; optional **Demo** link when `NEXT_PUBLIC_DEMO_URL` is set |
| Hero: headline, subhead, CTAs | **Headline** should state **operational proof** (e.g. rent, units, cash) — not abstract taglines alone; **hero background** = navy → blue gradient plus optional **ghosted chart lines** (rent / occupancy signal), not lifestyle stock |
| Third CTA: “View demo dashboard” | High-trust for PMS — wire to demo URL from env (video, sandbox, or read-only dashboard) |
| Logo / integration strip | **Named** integrations where possible (e.g. mobile money, accounting, e-sign); placeholders only until contracts allow logos |
| Feature cards with tinted panels | **Four** pillars when space allows: portfolio, billing/arrears, access, **financial reporting** |
| Proof / metrics section | Prefer **capability claims** you can defend; avoid invented statistics — use CMS or env when publishing real numbers |
| Product UI preview | Dashboard / rent-roll **mock or screenshot** — non-optional for elite PMS positioning when assets exist |
| Final “start” section | Closing CTA with **Register** (gold) + optional **Demo** + **Log in** (outline on dark) |
| Footer columns | Product, company, legal; **footer background** = deep navy (darker than sidebar primary if desired) |

### Motion and imagery (marketing)

* **Motion:** still subtle (hover, short transitions only).
* **Imagery:** prefer **UI mockup**, **diagram**, or **small thumbnail** over hero stock photos; if a hero image is used later, it must pass brand review for tone and performance.

---

## 17. Transformation Summary

### Before (Landing Page)

* Image-heavy
* Marketing-focused
* Low data density

---

### After (PMS System)

* Data-first
* Fast workflows
* Structured UI
* Quiet luxury

---

## Final Principle

> If it doesn’t help manage property operations faster, remove it.
