# PMS Mobile Application — Implementation Plan

This document plans the **native or cross-platform mobile client** for RentSlab PMS. Primary audiences: **tenants** (rent, notices, tickets), **field staff** (inspections, move-in/out checklists, photos), and optionally **lightweight manager approvals** on the go. It aligns with the same org-scoped, lease-centric backend as the web app.

**Brand alignment** follows [`branding.md`](../branding.md) where it applies to mobile — same positioning and tokens as the web PMS; layout patterns are adapted for small screens in §1.

---

## 1. Brand alignment (from `branding.md`, mobile)

### Positioning

- **Core idea:** operational clarity with premium trust; **data-first**, not marketing-first.
- **Tone:** professional, premium (calm, understated), trustworthy (financial-grade clarity), **quiet luxury** — minimal chrome, no decorative fluff.

### Shared design tokens

Use the same **color system** as web: primary navy `#1E3A5F`, secondary `#2F5D8A`, accent gold `#C7A348` (sparingly for primary actions and focus), backgrounds `#F7F9FB` / cards `#FFFFFF`, text `#1A1A1A` / `#6B7280` / `#9CA3AF`, status colors for success / warning / error / info as in brand doc.

**Typography:** **Inter** for all UI chrome, lists, forms, buttons, and body. Use **serif accent** (Canela → Source Serif 4 → IBM Plex Serif) only for **screen titles** and **large numeric highlights** (e.g. amount due, balance) — same restraint as desktop; avoid serif in dense lists or small table-like rows.

**Components:** buttons primary navy / secondary outline; **gold** only for the single most important action on a screen when it matches brand. Inputs: clear borders and navy-focused focus; **40px** minimum touch targets (can exceed brand’s 40px web height on mobile). **Line icons, 1.5px stroke**; pair with labels for critical actions.

**UX:** favor **information density** and **speed** on staff flows; **clarity** over ornament; **subtle motion** only (no marketing animations). **No** lifestyle / hero imagery; **small thumbnails** and document previews are acceptable.

**Accessibility:** respect contrast ≥ **4.5:1**; support Dynamic Type / font scaling; VoiceOver/TalkBack on primary actions.

---

## 2. Goals and non-goals

**Goals**

- High-trust flows on small screens: authentication, viewing lease summary, paying rent (if payments API supports it), viewing invoices/receipts, submitting maintenance requests, push notifications for rent due and announcements.
- Offline-tolerant **read** where safe (cached lease summary, last statements); **writes** sync when online unless explicitly designed offline-first.
- Biometric app lock where platform allows (Face ID / fingerprint) as a second layer after session login.

**Non-goals (initial phases)**

- Full parity with `frontend-app` (no bulk billing configuration, no complex allocation UIs).
- Replacing email; mobile complements notifications.

---

## 3. Recommended technical stack (decision point)

| Approach | When to choose |
|----------|----------------|
| **React Native (Expo)** | Team already on React; shared logic with web possible; OTA updates via Expo |
| **Flutter** | Strong single codebase for iOS/Android; custom UI consistency |
| **Native Swift/Kotlin** | Maximum platform integration; higher maintenance |

**Shared requirements**

- Secure storage for refresh tokens / secrets (Keychain / Keystore).
- Deep linking (`rentslab://` or universal links) for payment return URLs and magic links.
- Crash reporting and analytics (privacy-preserving; opt-in where required).

---

## 4. Personas and feature sets

### 3.1 Tenant app

| Feature | Description | Backend needs |
|---------|-------------|----------------|
| Home | Next due date, amount, property/unit summary | Lease + billing endpoints |
| Pay | Initiate payment (M-Pesa, card, bank per region) | Payment APIs + redirect/webview |
| Documents | Lease PDF, notices | File URLs with auth |
| Maintenance | Create ticket, photos, status | Ticketing or generic “request” API |
| Messages | In-app inbox optional | Notification + message endpoints |
| Profile | Contact info, notification prefs | User/tenant profile APIs |

### 3.2 Field / staff app (optional second flavor or role-gated)

| Feature | Description |
|---------|-------------|
| Today | Assigned units/buildings, route list |
| Inspections | Checklists, photos, signatures |
| Quick lease lookup | Read-only tenant/lease for on-site verification |

---

## 5. Information architecture

**Navigation model** (tenant): bottom tabs — Home, Pay, Activity (payments/history), Account.

**Navigation model** (staff): Jobs, Properties, Profile — or merge into one app with **role-based tab sets** after login.

Avoid deep hierarchies; favor **task completion** over CRUD exploration.

---

## 6. Security model

- Short-lived access tokens + refresh; rotate refresh tokens if backend supports.
- **Certificate pinning** considered for production (tradeoffs with CI and corporate networks).
- No sensitive data in logs; redact account numbers in UI copy.
- App transport security (ATS) / cleartext off by default.

---

## 7. Push notifications

- Register device tokens per user + org; server sends events: rent reminder, invoice issued, payment confirmed, maintenance update.
- User settings: categories on/off; quiet hours optional.
- Handle notification tap → deep link to relevant screen (invoice id, thread id).

---

## 8. Phased delivery

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **M0** | Shell app, theme tokens (§1), env config, login, token storage, logout | TestFlight/Internal testing |
| **M1** | Tenant home + lease summary + payment history read-only | Demo on device |
| **M2** | Pay flow integrated with sandbox PSP | Successful test payment |
| **M3** | Maintenance request + photo upload | End-to-end ticket |
| **M4** | Push notifications + deep links | Staging verification |
| **M5** | Field staff features (if in scope) | Pilot with 1 org |

---

## 9. API and data considerations

- **Pagination** on activity feeds; infinite scroll with cursor.
- **Optimistic UI** for non-financial actions only (e.g. “message sent”).
- **Idempotency** for payment initiation (client-generated idempotency keys if API supports).
- **Locale and currency** — display formatting from server-provided currency code and minor units rules.

---

## 10. Testing strategy

- Unit tests for reducers/view models.
- Integration tests against staging API (sandbox payments).
- Device farm or manual matrix: last two OS versions, small/large phones.
- Accessibility: Dynamic Type / font scaling, VoiceOver/TalkBack labels on primary actions.

---

## 11. Store and compliance

- Privacy policy URL and data deletion flow linked in app settings.
- App Store / Play data safety and financial features questionnaires completed accurately.
- Regional payment regulations (PCI scope minimized by using hosted fields or app-to-server with PSP SDK).

---

## 12. Open decisions

- [ ] Single app with roles vs separate tenant vs staff apps.
- [ ] Expo vs bare React Native / Flutter.
- [ ] Offline-first scope for documents (cache PDFs with TTL).

---

## 13. Milestone checklist (rolling)

- [ ] Project scaffold + CI (lint, typecheck, build) + shared color/type tokens with web
- [ ] Auth + secure storage + session refresh
- [ ] Tenant dashboard + read APIs
- [ ] Payment integration (sandbox)
- [ ] Maintenance + media upload
- [ ] Push + deep links
- [ ] Store listings (screenshots, descriptions, review cycles)

Update this plan when payment providers or notification services are finalized.
