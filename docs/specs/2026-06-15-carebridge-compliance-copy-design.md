# CareBridge Connect — Compliance & Marketplace Copy Update

**Date:** 2026-06-15
**Status:** Approved design
**Driver:** Client (Ana) feedback on website content/wording

## Problem

The client reviewed the marketing site and requires the non-CQC, non-regulated
nature of the marketplace to be reflected clearly throughout. Current copy
conflicts with this in places (e.g. Healthcare Assistants described as providing
"personal care") and is missing disclaimers entirely.

## Client requirements (verbatim intent)

1. CareBridge Connect is a healthcare marketplace connecting clients and
   organisations with independent healthcare professionals.
2. It is **not** currently a CQC-registered provider and does **not** provide
   regulated personal care services.
3. Healthcare Assistants (HCAs) and Support Workers engaged through the platform
   must **not** provide regulated personal care services through CareBridge Connect.
4. Services are limited to companionship, wellbeing support, sitting services,
   hospital discharge support, community support, chaperoning, appointment
   support, respite support and other non-regulated activities.
5. Registered Nurses and other appropriately qualified professionals may provide
   services within their professional scope of practice, subject to verification
   and compliance requirements.
6. Intended for private clients, healthcare organisations, supported living
   services, care providers and healthcare facilities seeking access to verified
   healthcare professionals.
7. Appropriate disclaimers must make the non-CQC and non-regulated nature clear.

## Approved decisions

- **Disclaimer prominence:** footer line (every page) + inline callouts (Home,
  Services) + a dedicated legal page at route **`/disclaimer`**.
- **Services presentation:** add a new dedicated "Services we support" section
  listing the non-regulated activities, in addition to rewording role copy.
- **Disclaimer wording:** use the client's wording verbatim (no paraphrasing) for
  compliance-sensitive statements.

## Design

### 1. Centralized copy — `apps/web/src/data/marketing-copy.ts`

Single source of truth for all new compliance copy:

- `regulatoryDisclaimer` (string) — short footer line:
  > "CareBridge Connect is a healthcare marketplace and is not a CQC-registered
  > provider. It does not provide regulated personal care services."
- `supportedServices` (string[]) — companionship, wellbeing support, sitting
  services, hospital discharge support, community support, chaperoning,
  appointment support, respite support. (Rendered with an "and other
  non-regulated activities" trailing note.)
- `importantInformation` — structured object with the full disclaimer paragraphs:
  - marketplace nature (point 1)
  - non-CQC / non-regulated status (point 2)
  - HCA & Support Worker scope limit (point 3)
  - supported services scope (point 4, references `supportedServices`)
  - Registered Nurse scope-of-practice clause (point 5)
  - intended audiences (point 6)

### 2. Global footer — `apps/web/src/components/site-footer.tsx`

- Add `regulatoryDisclaimer` as a small line above the copyright row.
- Add an "Important information" link to the legal links row (→ `/disclaimer`).

### 3. Dedicated legal page — `apps/web/src/app/(legal)/disclaimer/page.tsx`

- New route in the `(legal)` route group (alongside `terms`, `privacy`).
- Renders the full `importantInformation` content + `supportedServices` list +
  audience statement. Matches the existing legal page layout/styling.
- `metadata.title`: "Important information & disclaimer — CareBridge Connect".

### 4. Reusable inline callout — `apps/web/src/components/important-info-callout.tsx`

- A compact "Important information" card summarizing the non-CQC / non-regulated
  status with a link to `/disclaimer` for the full statement.
- Used on both Home and Services for consistency.

### 5. Home page — `apps/web/src/app/page.tsx`

- Insert `<ImportantInfoCallout />` after the compliance/how-it-works section,
  before the testimonials.

### 6. Services page — `apps/web/src/app/(marketing)/services/page.tsx`

- Add a new "Services we support" section rendering `supportedServices` with the
  non-regulated framing.
- Add `<ImportantInfoCallout />`.

### 7. Copy corrections — `apps/web/src/data/marketing-copy.ts` + about page

- **HCAs** (`professionalRoles`): remove "personal care, mobility, daily living";
  reframe to non-regulated companionship/wellbeing/sitting/appointment & community
  support.
- **Support Workers:** reframe to non-regulated community & companionship support.
- **Registered Nurses:** keep clinical description, append "within their
  professional scope of practice, subject to verification and compliance
  requirements."
- **About audiences** (`apps/web/src/app/(marketing)/about/page.tsx`): expand the
  "Organisations" audience to name healthcare organisations, supported living
  services, care providers and healthcare facilities; soften "care at home" /
  "home care" phrasing that implies regulated personal care.

### 8. FAQ — `apps/web/src/data/faqs.ts`

- Add entry: "Is CareBridge Connect a CQC-registered care provider?" with an
  answer stating the non-regulated, marketplace nature and the supported-services
  scope.

## Out of scope

- No backend, schema, or booking-flow changes — copy and presentation only.
- No restyling of existing components beyond adding the callout/section.
- App-internal (post-login) pages are not part of this marketing-copy pass.

## Verification

- `npm run lint` and `npm run build` (or typecheck) in `apps/web` pass.
- Manual: footer disclaimer visible on every page; `/disclaimer` renders;
  callouts visible on Home and Services; no remaining "personal care" wording for
  HCAs/Support Workers.
