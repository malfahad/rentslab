# PMS Marketing & Landing Site — Implementation Plan

This document plans the **public marketing and acquisition surface** for RentSlab: positioning, SEO, lead capture, and entry points into the product (signup, demo request, docs links). It does **not** implement org-scoped PMS operations; those live in `frontend-app` and `frontend-mobile`.

**Brand alignment** is taken from [`branding.md`](../branding.md): use messaging and **visual restraint** consistent with the product (quiet luxury, operational clarity). Omit in-app-only rules (e.g. sidebar specs) unless they help coherence.

---

## 1. Brand alignment (from `branding.md`, marketing site)

### Positioning and voice

- **Core idea:** operational clarity with premium trust — the product is **data-first**, not marketing-first; landing copy should sound like that (concrete outcomes, finance-grade clarity), not hype.
- **Audiences to speak to:** property managers, landlords, finance/admin teams (same as product).
- **Personality:** professional, premium (calm, understated), trustworthy, **quiet luxury** — minimal, intentional; avoid noisy or gimmicky campaigns.

### Relation to product (`branding.md` transformation summary)

Brand doc contrasts an older **image-heavy, low–data-density** landing style with the **current PMS direction** (structured UI, fast workflows, quiet luxury). This site should **not** replay the old pattern: prefer **restrained** layouts, strong typography, and optional **small** property thumbnails or **document/product** motifs over large lifestyle hero photography.

### Typography and color (match product)

- **Inter** for body, UI, navigation, buttons, forms.
- **Serif accent** (Canela → Source Serif 4 → IBM Plex Serif) for **page/section headlines** and key stats — same family as app marketing-adjacent surfaces.
- **Palette:** primary navy `#1E3A5F`, secondary `#2F5D8A`, accent gold `#C7A348` (CTAs and key highlights only), backgrounds `#F7F9FB` / `#FFFFFF`, text `#1A1A1A` / `#6B7280`. Status semantic colors if needed for badges.
- **Layout:** align with product **max width ~1280px** and **8pt spacing** rhythm where practical so handoff to the app feels continuous.

### Imagery and motion

- **Avoid** default reliance on full-bleed lifestyle hero stock. Prefer product truth (screens, diagrams, small building thumbnails, document previews).
- **Motion:** subtle only (no flashy marketing animation loops).

### Benchmark-informed homepage structure (v1)

High-converting SaaS landings often stack **hero → proof → features → closing CTA → footer**. RentSlab adopts that **flow** with **brand colors only** (see [`branding.md`](../branding.md) §16 — no competitor palettes).

| Block | Purpose |
| ----- | ------- |
| **Sticky header** | Logo, anchors (`#features`, `#proof`, `#pricing`), optional **Demo**, **Log in**, **Sign up** (§3) |
| **Hero** | Operator-grade headline (rent / cash clarity), subhead, **Sign up** + optional **View demo dashboard** + **Log in**; gradient + **faint chart overlay** (data signal, not lifestyle stock) |
| **Integrations** | **Named** partners (e.g. MTN MoMo, Stripe) — replace with real marks when available |
| **Product preview** | Abstract dashboard / rent-roll / tenant panel — or real screenshots when assets exist; label illustrative if mock |
| **Feature grid** | **Four** cards: portfolio & leases, billing & arrears, teams & access, **financial reporting** |
| **Proof strip** | “Built for real portfolios” — capability metrics (avoid unverified numeric claims; optional CMS later) |
| **Use-case tabs** | Landlords / property managers / finance teams |
| **Pricing band** | Time-to-value copy + CTAs |
| **Closing CTA** | Urgency + reassurance line + CTAs |
| **Footer** | Multi-column links, copyright; dark navy |

Inner pages (`/product`, `/pricing`, …) can follow simpler templates later.

### Accessibility

- Contrast **≥ 4.5:1** for text; keyboard and focus visible on forms and CTAs. Verify gold-on-navy and white-on-navy pairs.

---

## 2. Goals and non-goals

**Goals**

- Clear value proposition for property managers, landlords, and owner groups: multi-tenant portfolio, lease-centric billing, payments and allocations, role-based access — framed in **brand voice** (§1).
- **Trust**: compliance-oriented copy (high level), customer logos or quotes if available, security posture summary (no sensitive internals).
- **Conversion**: **Register**, **Log in**, and optional **View demo dashboard** (URLs from env — §3); proof and product-preview sections reduce hesitation for operators. Use **accent gold** for the strongest transactional action (usually **Register**).
- **SEO**: indexable product and solution pages, structured data, fast Core Web Vitals, sitemap and `robots.txt`.
- **Visual consistency** with `frontend-app` tokens (colors, type, restraint) so sign-in → product does not feel like a different brand.

**Non-goals**

- Logged-in product UI, tenant portals, or payment processing on this site (except marketing iframes or PSP marketing pages).
- Full documentation wiki (can link to separate docs subdomain).

---

## 3. Registration, login, and demo links (env)

The landing app does not host auth. **CTAs** read URLs from the environment at build time (static) or runtime, depending on the framework.

**Variables (full URLs, no trailing slash required):**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_LOGIN_URL` | Sign in — `frontend-app` login route |
| `NEXT_PUBLIC_REGISTER_URL` | Create account — `frontend-app` registration route |
| `NEXT_PUBLIC_DEMO_URL` | Optional — Loom, recorded tour, or in-app demo; powers **View demo dashboard** and header **Demo** |

If the stack is not Next.js, use the same names with your bundler’s public prefix or inject at build.

**UI:**

- **Header:** optional **Demo**; **Log in**; **Sign up** (hide each link if its env is unset).
- **Hero / closing / pricing bands:** **Sign up** (primary), **View demo dashboard** (when `DEMO_URL` set), **Log in** (secondary outline).
- Do not hardcode hostnames in components.

Document keys in `.env.example` with placeholder URLs.

---

## 4. Recommended technical stack (decision point)

| Option | Notes |
|--------|--------|
| **Next.js (App Router)** | SSG/ISR for performance; easy MDX for blog/legal |
| **Astro** | Excellent static-first performance; add islands for interactive forms |
| **Framer / Webflow** | Faster for design-led teams; export or embed if lock-in is acceptable |

**Common**

- Styling: Tailwind or CSS modules; **design tokens** shared or duplicated from [`branding.md`](../branding.md) / `frontend-app` (colors, radius, spacing, font stacks) for consistency.
- Forms: server actions or small serverless handlers posting to CRM (HubSpot, Salesforce) or internal API.
- Analytics: privacy-friendly (Plausible, Fathom) or GA4 with consent banner per jurisdiction.

---

## 5. Site map (initial)

| Path | Purpose |
|------|---------|
| `/` | Full benchmark flow (§1): hero + integrations + product preview + 4-card features + proof + use-case tabs + pricing + closing CTA + footer; **Login / Register / Demo** via §3 |
| `/product` | Deeper feature breakdown aligned with PMS modules (portfolio, leases, billing, payments) |
| `/pricing` | Tiers or “contact sales”; FAQ |
| `/solutions` | Optional vertical pages (residential, commercial, student) |
| `/customers` | Case studies / quotes |
| `/blog` | SEO content, changelog cross-links |
| `/security` | High-level security practices (no internal architecture diagrams) |
| `/contact` | Form + support email |
| `/legal/privacy`, `/legal/terms` | Jurisdiction-reviewed pages |

---

## 6. Content pillars

1. **Lease as the pivot** — Explain how tenancy, billing, and services connect (aligned with domain docs, in customer language).
2. **Payments and allocations** — Partial payments, multi-invoice application, reconciliation story.
3. **Org and roles** — Multi-user teams without cross-org leakage.
4. **Integrations** — Placeholder roadmap: accounting export, payment gateways, identity.

Maintain a **single glossary** (tenant vs Tenant record, lease, unit) to avoid confusion with everyday words.

---

## 7. Lead capture and CRM

- Form fields: name, email, company, role, approximate unit count, region, message.
- Honeypot + rate limiting on server; optional reCAPTCHA if abuse appears.
- Webhook or direct CRM integration; confirmation email to user (double opt-in if marketing lists).
- UTM parameters preserved on navigation and stored with submissions.

---

## 8. Performance and quality

- **Lighthouse** targets: performance ≥ 90 on mobile for key URLs; LCP under 2.5s on 4G.
- Image optimization (Next/Image or Astro assets), responsive `srcset`, modern formats (AVIF/WebP).
- **Accessibility**: landmarks, focus order, form labels, contrast for WCAG 2.1 AA on marketing pages.

---

## 9. Internationalization (optional)

- If multi-region from day one: locale-prefixed routes (`/en`, `/fr`), `hreflang`, translated legal only after review.
- Otherwise ship English first; structure copy in CMS or MDX for later extraction.

---

## 10. Phased delivery

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **L0** | Design system tokens (brand colors/type from §1), layout shell, header/footer with **Login / Register** from §3 | Staging URL |
| **L1** | Home + Product + Contact + Legal stubs (voice and restraint per §1); hero CTAs wired to §3 | Content review |
| **L2** | Pricing, SEO meta, sitemap, analytics with consent | Search Console property |
| **L3** | Blog/MDX, RSS, social cards (OG images) | First publish |
| **L4** | A/B test hooks or alternate hero (optional) | Tooling in place |

---

## 11. Dependencies on other work

- Brand assets: logo, **colors and type stacks** locked to [`branding.md`](../branding.md); photography/illustration **direction** = minimal, product-truth-first (§1), not lifestyle-heavy.
- Legal review for privacy/terms and regional claims (especially financial features).
- Deploy-time values for `NEXT_PUBLIC_LOGIN_URL`, `NEXT_PUBLIC_REGISTER_URL`, and optional `NEXT_PUBLIC_DEMO_URL` (see §3) matching `frontend-app` or demo host routes.

---

## 12. Open decisions

- [ ] CMS vs git-based MDX for blog.
- [ ] Hosting (Vercel, Netlify, CloudFront+S3).
- [ ] Cookie consent vendor vs lightweight custom banner.

---

## 13. Milestone checklist (rolling)

- [ ] Repo scaffold + CI + preview deployments + `.env.example` (§3)
- [ ] Core pages and responsive layouts; header/hero CTAs use env URLs only
- [ ] Forms + CRM + spam protection
- [ ] SEO baseline + analytics + consent
- [ ] Legal pages linked from footer
- [ ] Performance pass + accessibility audit

Revise quarterly or when product positioning shifts.
