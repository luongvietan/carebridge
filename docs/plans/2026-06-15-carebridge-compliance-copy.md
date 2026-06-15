# Compliance & Marketplace Copy Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reflect CareBridge Connect's non-CQC, non-regulated marketplace nature clearly throughout the marketing site via centralized copy, a footer disclaimer, inline callouts, a dedicated `/disclaimer` page, a non-regulated services section, and corrected role/audience wording.

**Architecture:** All compliance copy is centralized in `marketing-copy.ts` as the single source of truth. A reusable `ImportantInfoCallout` component renders inline summaries on Home and Services. A new `(legal)/disclaimer` route renders the full statement. The global footer carries a one-line disclaimer + link on every page. Existing role/audience strings are reworded in place.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS v4. Verification via `eslint` + `next build` (no unit tests — this is presentational copy; the repo's vitest suite covers logic only).

**Spec:** `docs/specs/2026-06-15-carebridge-compliance-copy-design.md`

**Conventions for this plan:**
- All commands run from `apps/web/` unless noted: `cd "apps/web"` first (PowerShell: `cd "apps/web"`).
- Per project memory, commit directly to `master` — do not create a branch.
- Each task ends by running `npm run lint` (fast) for the touched files; a single full `npm run build` runs in the final task.

---

### Task 1: Add centralized compliance copy

**Files:**
- Modify: `apps/web/src/data/marketing-copy.ts`

- [ ] **Step 1: Add the disclaimer, supported-services, and important-information exports**

Append to the end of `apps/web/src/data/marketing-copy.ts`:

```ts
/** Short disclaimer line shown in the global footer on every page. */
export const regulatoryDisclaimer =
  "CareBridge Connect is a healthcare marketplace and is not a CQC-registered provider. It does not provide regulated personal care services.";

/** Non-regulated services available through the platform. */
export const supportedServices = [
  "Companionship",
  "Wellbeing support",
  "Sitting services",
  "Hospital discharge support",
  "Community support",
  "Chaperoning",
  "Appointment support",
  "Respite support",
] as const;

/** Full "Important information" disclaimer used on the /disclaimer page and inline callouts. */
export const importantInformation = {
  heading: "Important information",
  intro:
    "CareBridge Connect is a healthcare marketplace connecting clients and organisations with independent healthcare professionals.",
  paragraphs: [
    "CareBridge Connect is not currently a CQC-registered provider and does not provide regulated personal care services.",
    "Healthcare Assistants (HCAs) and Support Workers engaged through the platform must not provide regulated personal care services through CareBridge Connect. Their services are limited to companionship, wellbeing support, sitting services, hospital discharge support, community support, chaperoning, appointment support, respite support and other non-regulated activities.",
    "Registered Nurses and other appropriately qualified healthcare professionals may provide services that fall within their professional scope of practice, subject to verification and compliance requirements.",
  ],
  audienceLabel:
    "The platform is intended for private clients, healthcare organisations, supported living services, care providers and healthcare facilities seeking access to verified healthcare professionals.",
} as const;
```

- [ ] **Step 2: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS, no errors for `src/data/marketing-copy.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/data/marketing-copy.ts
git commit -m "feat(web): add centralized compliance disclaimer copy"
```

---

### Task 2: Correct role and audience wording

**Files:**
- Modify: `apps/web/src/data/marketing-copy.ts:8-29` (`professionalRoles`)
- Modify: `apps/web/src/app/(marketing)/about/page.tsx:43-56` (`audiences`)

- [ ] **Step 1: Reword HCA, Support Worker, and Registered Nurse descriptions**

In `apps/web/src/data/marketing-copy.ts`, replace the `professionalRoles` array entries with:

```ts
export const professionalRoles = [
  {
    title: "Registered Nurses",
    description:
      "NMC-registered nurses providing clinical care, medication management and assessments within their professional scope of practice, subject to verification and compliance requirements.",
  },
  {
    title: "Healthcare Assistants",
    description:
      "Experienced HCAs providing companionship, wellbeing support, sitting services and appointment or community support — non-regulated activities only.",
  },
  {
    title: "Support Workers",
    description:
      "Trained support workers providing companionship, community support, chaperoning and respite support — non-regulated activities only.",
  },
  {
    title: "Physiotherapists",
    description:
      "HCPC-registered physiotherapists for rehabilitation and mobility programmes within their professional scope of practice.",
  },
] as const;
```

- [ ] **Step 2: Reword the About-page audiences**

In `apps/web/src/app/(marketing)/about/page.tsx`, replace the `audiences` array with:

```ts
const audiences = [
  [
    "Private clients",
    "Individuals and families creating booking requests for verified, non-regulated support.",
  ],
  [
    "Organisations",
    "Healthcare organisations, supported living services, care providers and healthcare facilities needing access to verified professionals.",
  ],
  [
    "Professionals",
    "Registered nurses, HCAs, support workers and physiotherapists seeking verified work.",
  ],
] as const;
```

- [ ] **Step 3: Verify no remaining "personal care" wording for HCAs/Support Workers**

Run (from repo root): `git grep -n "personal care" apps/web/src`
Expected: the only matches are in the `importantInformation` / `regulatoryDisclaimer` disclaimer text (which intentionally says "regulated personal care services"). No HCA/Support-Worker role descriptions should mention providing personal care.

- [ ] **Step 4: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/data/marketing-copy.ts "apps/web/src/app/(marketing)/about/page.tsx"
git commit -m "fix(web): reword roles and audiences to non-regulated framing"
```

---

### Task 3: Add footer disclaimer line and link

**Files:**
- Modify: `apps/web/src/components/site-footer.tsx`

- [ ] **Step 1: Import the disclaimer copy**

In `apps/web/src/components/site-footer.tsx`, add to the existing import from marketing data (after the `marketingImages` import on line 5):

```tsx
import { regulatoryDisclaimer } from "@/data/marketing-copy";
```

- [ ] **Step 2: Add an "Important information" link to the legal links row**

In the legal links block (currently `Terms & conditions | Sitemap | Privacy Policy`, around lines 89-101), add a disclaimer link. Replace that `<div className="flex flex-wrap items-center gap-x-3 gap-y-1 ...">` block's contents so it reads:

```tsx
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
            <Link href="/terms" className="transition hover:text-white">
              Terms &amp; conditions
            </Link>
            <span aria-hidden>|</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              Important information
            </Link>
            <span aria-hidden>|</span>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
          </div>
```

(The "Sitemap" link is replaced by "Important information".)

- [ ] **Step 3: Add the disclaimer line above the copyright**

Replace the existing copyright paragraph (around line 124-126) with the disclaimer line followed by the copyright:

```tsx
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/45">
          {regulatoryDisclaimer}
        </p>
        <p className="mt-3 text-xs text-white/40">
          © {new Date().getFullYear()} CareBridge Connect Ltd. All rights reserved.
        </p>
```

- [ ] **Step 4: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/site-footer.tsx
git commit -m "feat(web): add regulatory disclaimer line and link to footer"
```

---

### Task 4: Create the reusable ImportantInfoCallout component

**Files:**
- Create: `apps/web/src/components/important-info-callout.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/important-info-callout.tsx`:

```tsx
import Link from "next/link";
import { importantInformation } from "@/data/marketing-copy";
import { marketingSection, marketingSurface } from "@/lib/marketing-ui";

/** Compact non-CQC / non-regulated notice, linking to the full /disclaimer page. */
export function ImportantInfoCallout() {
  return (
    <section className={`${marketingSection} pt-0`}>
      <div
        data-reveal
        className={`rounded-[28px] ${marketingSurface} p-6 sm:rounded-[32px] sm:p-8`}
      >
        <h2 className="text-lg font-bold text-[#0c4a35] sm:text-xl">
          {importantInformation.heading}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#5b6a62]">
          {importantInformation.intro} {importantInformation.paragraphs[0]}
        </p>
        <Link
          href="/disclaimer"
          className="mt-4 inline-block text-sm font-semibold text-[#0c6e4f] hover:underline"
        >
          Read the full important information &amp; disclaimer →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/important-info-callout.tsx
git commit -m "feat(web): add reusable ImportantInfoCallout component"
```

---

### Task 5: Create the /disclaimer legal page

**Files:**
- Create: `apps/web/src/app/(legal)/disclaimer/page.tsx`

- [ ] **Step 1: Create the page**

Create `apps/web/src/app/(legal)/disclaimer/page.tsx` (mirrors the `terms`/`privacy` legal-page layout):

```tsx
import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { importantInformation, supportedServices } from "@/data/marketing-copy";

export const metadata: Metadata = {
  title: "Important information & disclaimer — CareBridge Connect",
};

export default function DisclaimerPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0f261c]">
          {importantInformation.heading}
        </h1>
        <p className="mt-5 leading-relaxed text-[#5b6a62]">{importantInformation.intro}</p>
        {importantInformation.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-4 leading-relaxed text-[#5b6a62]">
            {paragraph}
          </p>
        ))}

        <h2 className="mt-10 text-xl font-semibold text-[#0f261c]">Services we support</h2>
        <p className="mt-3 leading-relaxed text-[#5b6a62]">
          Services available through the platform are limited to the following non-regulated
          activities:
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {supportedServices.map((service) => (
            <li key={service} className="flex items-start gap-2 text-[#5b6a62]">
              <span aria-hidden className="mt-1 text-[#0c6e4f]">•</span>
              <span>{service}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 leading-relaxed text-[#5b6a62]">…and other non-regulated activities.</p>

        <h2 className="mt-10 text-xl font-semibold text-[#0f261c]">Who the platform is for</h2>
        <p className="mt-3 leading-relaxed text-[#5b6a62]">{importantInformation.audienceLabel}</p>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(legal)/disclaimer/page.tsx"
git commit -m "feat(web): add /disclaimer important-information page"
```

---

### Task 6: Add "Services we support" section and callout to the Services page

**Files:**
- Modify: `apps/web/src/app/(marketing)/services/page.tsx`

- [ ] **Step 1: Add imports**

In `apps/web/src/app/(marketing)/services/page.tsx`, add to the imports:

```tsx
import { ImportantInfoCallout } from "@/components/important-info-callout";
```

and extend the existing `marketing-copy` import (line 9) to include `supportedServices`:

```tsx
import { onboardingSteps, professionalRoles, supportedServices } from "@/data/marketing-copy";
```

- [ ] **Step 2: Insert the "Services we support" section**

Immediately after the "Four verified role types" `<section>` closes (after line 58, before the "How it works" section), insert:

```tsx
        <section className={`${marketingSection} pt-0`}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>Services we support</h2>
            <p className={`${marketingSubheading} max-w-2xl`}>
              Engagements are limited to companionship and other non-regulated activities.
              CareBridge Connect does not provide regulated personal care services.
            </p>
          </div>

          <div data-reveal-stagger className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {supportedServices.map((service) => (
              <div
                key={service}
                data-reveal-child
                className={`rounded-2xl bg-white p-5 text-sm font-medium text-[#0c4a35] ${marketingCardShadow}`}
              >
                {service}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[#5b6a62]">
            …and other non-regulated activities.
          </p>
        </section>
```

- [ ] **Step 3: Add the callout before the CtaBanner**

Immediately before `<CtaBanner />` (around line 108), insert:

```tsx
        <ImportantInfoCallout />
```

- [ ] **Step 4: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(marketing)/services/page.tsx"
git commit -m "feat(web): add supported-services section and disclaimer callout to services page"
```

---

### Task 7: Add callout to the Home page

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Import the callout**

In `apps/web/src/app/page.tsx`, add to the imports:

```tsx
import { ImportantInfoCallout } from "@/components/important-info-callout";
```

- [ ] **Step 2: Render it after the "How it works" section**

Insert `<ImportantInfoCallout />` between the closing `</section>` of "How it works" and `<TestimonialsSection />` (around line 55-56):

```tsx
        <ImportantInfoCallout />

        <TestimonialsSection />
```

- [ ] **Step 3: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(web): add disclaimer callout to home page"
```

---

### Task 8: Add CQC FAQ entry

**Files:**
- Modify: `apps/web/src/data/faqs.ts`

- [ ] **Step 1: Add the FAQ entry**

In `apps/web/src/data/faqs.ts`, add as the first entry in the `faqs` array (before "How are professionals verified?"):

```ts
  {
    question: "Is CareBridge Connect a CQC-registered care provider?",
    answer:
      "No. CareBridge Connect is a healthcare marketplace connecting clients and organisations with independent healthcare professionals. It is not currently a CQC-registered provider and does not provide regulated personal care services. Services are limited to companionship, wellbeing support, sitting services, hospital discharge support, community support, chaperoning, appointment support, respite support and other non-regulated activities.",
  },
```

- [ ] **Step 2: Verify lint passes**

Run (from `apps/web`): `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/data/faqs.ts
git commit -m "feat(web): add CQC/non-regulated FAQ entry"
```

---

### Task 9: Full build verification

**Files:** none (verification only)

- [ ] **Step 1: Run the production build**

Run (from `apps/web`): `npm run build`
Expected: PASS — compiles with no type errors; the route list includes `/disclaimer`.

- [ ] **Step 2: If the build fails**, read the error, fix the offending file, re-run `npm run build` until it passes, then commit the fix:

```bash
git add -A
git commit -m "fix(web): resolve build issues in compliance copy update"
```

- [ ] **Step 3: Manual smoke check (optional but recommended)**

Run (from `apps/web`): `npm run dev`, then confirm:
- Footer disclaimer line + "Important information" link appear on every page.
- `/disclaimer` renders the full statement, services list, and audience text.
- Home and Services show the callout; Services shows the "Services we support" grid.
- No HCA/Support-Worker copy mentions providing personal care.

---

## Self-Review notes

- **Spec coverage:** points 1–7 from the spec map to Tasks 1 (copy), 2 (role/audience wording), 3 (footer), 4–5 (callout + /disclaimer page), 6 (services section), 7 (home callout), 8 (FAQ). All covered.
- **No unit tests:** intentional — changes are presentational copy; the repo's vitest suite covers logic (scoring, rbac, validation) only. Verification is lint + build + manual smoke, consistent with the nature of the change.
- **Type consistency:** `importantInformation` shape (`heading`, `intro`, `paragraphs[]`, `audienceLabel`) and `supportedServices` (string array) defined in Task 1 are consumed consistently in Tasks 4, 5, 6.
