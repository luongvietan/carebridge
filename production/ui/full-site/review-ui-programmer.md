# CareBridge Connect — Full UI/UX implementation review

Scope: `apps/web/src/app/**`, `apps/web/src/components/**`, and global styling. This is a code-level review; no browser/device run was available.

## Findings

### P0/P1 — accessibility and interaction blockers

1. **Modal semantics and keyboard handling are incomplete (P1).** [`components/ui/modal.tsx`](../../apps/web/src/components/ui/modal.tsx) renders an always-open `<dialog>` without `aria-modal="true"`, an explicit accessible title when `title` is omitted, a backdrop, or a focus trap. Focus is moved into the panel but never restored to the trigger; Tab can escape into the page. Confirm/prompt dialogs therefore fail common WCAG dialog expectations and can leave keyboard users behind the overlay.
2. **Mobile menus have no controlled region or focus management (P1).** [`site-nav-client.tsx`](../../apps/web/src/components/site-nav-client.tsx) and [`role-nav.tsx`](../../apps/web/src/components/role-nav.tsx) expose `aria-expanded` but no `aria-controls`; opening does not move focus into the menu, closing does not restore it, and Escape is unsupported. The menu is conditionally mounted, so screen-reader context and keyboard continuity are fragile.
3. **Error/status announcements are inconsistent (P1).** Forms commonly render errors as plain `<p>` (for example [`contact-form.tsx`](../../apps/web/src/components/contact-form.tsx), `account-register-form.tsx`, rate/status forms) without `role="alert"`/`aria-live`. Server-action failures and pending/success changes may not be announced to assistive technology. Reset login uses `role="alert"`, showing an inconsistent pattern.

### P1 — responsive/layout risks

4. **Header actions can overflow at narrow widths (P1).** The marketing header keeps the CTA visible at all breakpoints while the logo is absolutely centered and the hamburger occupies a fixed 40px slot. Long localized labels (pt-PT) plus the CTA can collide with the centered logo around 320–390px. The role header similarly keeps email/sign-out controls while navigation collapses. Add a tested narrow-width layout or hide/stack secondary actions below the smallest breakpoint.
5. **Tables rely on horizontal scrolling without an accessible cue (P1).** Portal/admin pages use `overflow-x-auto` wrappers, but no visible “scroll horizontally” affordance, responsive card alternative, or caption describing the table. At mobile widths important booking/compliance fields are effectively undiscoverable.
6. **Onboarding layout has no responsive navigation/progress context (P2).** [`professional/onboarding/layout.tsx`](../../apps/web/src/app/professional/onboarding/layout.tsx) is a single `max-w-2xl` column with a page title only; there is no persistent step indicator/back affordance at the layout level. Users entering deep links can lose orientation.

### P1/P2 — localization and design-system consistency

7. **Player-facing strings bypass localization (P1).** [`contact-form.tsx`](../../apps/web/src/components/contact-form.tsx) hardcodes acknowledgement copy in both languages; several admin pages contain English literals (“No professionals match these filters”, “Employment status”, etc.), and the register loading fallback contains Portuguese `Contactar a CareBridge Connect`. This creates mixed-language screens when locale is switched and blocks translation QA.
8. **Design tokens are declared but not consumed consistently (P2).** `globals.css` defines `--color-*`/`--brand-*`, yet most components repeat raw hex values (`#2e7d32`, `#1e5a33`, `#4a4a4a`, borders) and duplicate long utility strings. Small palette changes will drift across marketing, portal, and admin surfaces; extract shared Button/Input/Card/Surface primitives or tokenized class constants.
9. **Focus-visible styling is underspecified (P2).** Interactive elements mostly use `focus:outline-none` with a subtle green ring, but links/buttons without that class rely on browser defaults; there is no global `:focus-visible` rule. The result is inconsistent or low-contrast keyboard focus, especially on pale backgrounds.
10. **Color-only status treatment remains possible (P2).** Admin status/attestation views use green/red text and dots extensively. Some rows include text, but compact badges and icon-only indicators should always include a text/state label or shape plus accessible name; verify contrast for muted `#7a8a81` metadata against white.

### P2 — visual hierarchy and polish

11. **Repeated card language without a shared component makes hierarchy uneven.** Marketing, portal, and admin pages independently define rounded corners, borders, shadows, and spacing. Similar “surface” cards vary between `rounded-xl`, `rounded-2xl`, and `rounded-3xl`, making the product feel like separate apps.
12. **Motion fallback is only partial.** Global CSS gates reveal transforms on `prefers-reduced-motion`, but motion components should also disable transition durations/auto-scroll and ensure no delayed content is inaccessible when reduced motion is enabled.
13. **Native control overrides are global and brittle.** Global `select { appearance:none }` and date-picker filters affect every route and can reduce platform affordances/contrast. Scope these styles to a branded field class and provide an explicit visible label/help text for unusual native controls.
14. **Brand logo asset is a JPEG with intrinsic 1402:769 ratio.** [`site-nav-client.tsx`](../../apps/web/src/components/site-nav-client.tsx) renders it at variable fixed height; on small headers this can produce a visually soft image and inconsistent baseline. Prefer an SVG/optimized transparent asset with a constrained max width and a meaningful compact alt treatment.

## Strengths observed

- Shared `SiteNav`, `SiteFooter`, `RoleShell`, `RoleNav`, `Modal`, and UI primitives provide a useful reuse base.
- Root `html lang` follows selected market and most marketing copy is dictionary-backed.
- Active navigation exposes `aria-current`; menu buttons expose expanded state and localized labels.
- Global reduced-motion media query exists and brand palette comments document contrast intent.

## Recommended sequence

1. Fix modal focus trap/restore, backdrop, title semantics, and mobile menu Escape/focus behavior.
2. Standardize `role="alert"`/`aria-live` for action status and error regions; audit all server-action forms.
3. Add 320/375/414px and tablet visual checks for both locales, especially header and tables.
4. Move all remaining UI literals into locale dictionaries and replace repeated hex/classes with tokens/primitives.
5. Add a global `:focus-visible` treatment and run axe/Lighthouse against marketing, each portal home, onboarding, and an admin table route.
