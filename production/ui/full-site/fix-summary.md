# CareBridge Connect — UI/UX fixes

10 October 2026. Scope: the P0–P2 findings in `review-ux-designer.md` and `review-ui-programmer.md`, including marketing, auth, requester/professional portals and admin interfaces.

**Source implementation complete.** Automated checks support the implemented behavior below. Browser visual, device and assistive-technology validation remains **NOT ASSESSED**; this report does not claim the complete visual/device pipeline passed or certify WCAG compliance.

## Resolution mapping

| Priority / finding | Implemented resolution | Evidence / principal source |
| --- | --- | --- |
| P0/P1 dialog containment, semantics and focus | Shared modal uses the native dialog lifecycle, accessible naming, close/backdrop/Escape dismissal and trigger focus restoration. Confirmation/prompt dialogs share it. | `apps/web/src/components/ui/modal.tsx`, `ui/app-dialog.tsx`; control regression tests |
| P0/P1 custom select keyboard/screen-reader behavior | Combobox/listbox semantics, active option announcements, keyboard selection, disabled-option navigation and native required validation proxy. Lists opened inside modal dialogs stay inside the dialog. | `apps/web/src/components/ui/select.tsx`; controls tests |
| P1 mobile navigation and narrow header | Marketing and role menus expose controlled regions, expanded state, Escape dismissal and focus return; responsive layouts reduce header collisions. Menus remain disclosure navigation. | `site-nav-client.tsx`, `role-nav.tsx`; navigation tests |
| P1 date and assistant interactions | Date controls use nonmodal popover semantics, localized controls and dismissal/focus return. Assistant controls expose meaningful labels, focus behavior and conversation log semantics. | `ui/date-picker.tsx`, `assistant-widget.tsx`; regression tests |
| P1 landmarks and missing bypass navigation | Shared skip link targets focusable main content. Auth, marketing and portal routes expose the target consistently. | Shared shells, root layout and route main landmarks |
| P1 loading/error/empty recovery | Localized route loading/status and error/retry/contact patterns across portal areas. Booking empty states provide relevant next actions. | Root/admin/client/organisation/professional `loading.tsx` and `error.tsx`, shared recovery components |
| P1 table discoverability at mobile widths | Shared focusable table scroll regions give a localized horizontal-scroll instruction while preserving native table structure. | `table-scroll.tsx`, portal/admin table routes; table-region tests |
| P1/P2 orientation and locale continuity | Portal breadcrumbs identify the current area and provide return navigation. Portal locale comes from the persisted account rather than the independently selected marketing locale. | `portal-breadcrumbs.tsx`, `role-shell.tsx`; account-locale isolation test |
| P1 form field/async feedback | Required markers accompany required semantics. Pending forms expose busy state; errors and successes use alert/status feedback. Relevant action controls recover after rejected or thrown server actions. | Form components, `required-mark.tsx`; action-recovery tests |
| P1 booking review and next steps | First submit displays a summary without creating a booking. Editing invalidates the review. Confirmation creates the request; success presents the result and a bookings link. Review receives keyboard focus; narrow date/duration fields stack. | `booking-request-form.tsx`; booking-review test |
| P2 timezone disclosure | Inputs and review explicitly disclose Europe/London including daylight saving; summary shows start/end and location. UTC payload conversion is retained. | Booking form and existing datetime utilities; test verifies London DST conversion |
| P1/P2 destructive/financial confirmations | Booking cancellation/completion/no-show, personal-data anonymisation, professional/account status transitions and paid payout changes use contextual confirmation. Feedback remains localized. | Admin booking/status/account controls, payout and anonymisation controls |
| P1 mixed language | Admin literal text, tile/card hints, accessible names, option labels, placeholders, dynamic counts and confirmations use portal localization. Contact feedback follows visitor locale; 404 is localized. Onboarding uses its existing four real steps with responsive presentation and current-step semantics. | `portal-pt.ts`, admin pages/components, contact/404/onboarding; translation coverage tests |
| P2 design tokens and keyboard visibility | Shared theme colors replace repeated raw palette classes; darker metadata and global focus-visible treatment improve consistency. Border/surface/brand/danger tokens are used throughout changed UI. | `globals.css`, shared and route components |
| P2 motion and native affordances | Reduced-motion treatment disables decorative delays/transitions. Marketing opacity reveals preserve the accessibility tree; keyboard focus immediately reveals sections. Global native control overrides are scoped to preserve platform affordances. | `globals.css`, `motion/marketing-page-motion.tsx` |
| P2 logo treatment | Brand mark uses the existing square PNG with a legible companion wordmark, replacing incorrect JPEG dimensions. | Brand mark and shared navigation |
| P2 legal navigation and revision context | Legal documents include section-linked contents and actual Git-backed legal-text revision dates. The content date of 5 October 2026 is a text revision, not an invented legal approval date; draft notices remain. | `legal-document.tsx`, legal routes and source legal content |

The original onboarding “missing steps” observation was checked against source: the application already had four actual stages. The change improves responsive/current-step presentation and shared portal orientation rather than inventing a new onboarding stage.

## Validation

Final follow-up validation on 11 October 2026: full lint passed; **71 files / 468 Vitest tests** and **3 readiness policy tests** passed; production build passed. Two translation-scan tests initially timed out at 5000ms while heavy checks ran concurrently; both passed when the full suite was rerun in isolation without changing timeout settings. React Doctor remains **82/100**, **7 warnings**, no errors. These results supersede the earlier suite counts below, which record the original UI/UX implementation pass.

- Full lint passed.
- Full Vitest run passed: **69 files, 456 tests**. Readiness policy tests passed: **3 tests**.
- Production build passed.
- Targeted checks after the final admin localization/recovery edits passed: ESLint, TypeScript and 7 tests across booking review, admin recovery and translation coverage.
- Final small cleanup runs the independent account-translation lookup and Supabase client creation concurrently in `AdminHome`; targeted ESLint and TypeScript passed afterward.
- React Doctor score: **82/100**, **7 warnings**, no errors. The warnings cover three component-complexity findings, two nonmodal date-popover findings, the client-only timestamp used when Today opens and an intentional native modal backdrop. These are not evidence that visual/accessibility QA passed.

Control regressions cover modal focus restoration, combobox semantics/validation, controls inside dialogs, date localization/focus, navigation Escape handling and assistant log/focus behavior. Booking tests verify mutation-free review, invalidation after edits, final payload timing and success. Recovery tests verify preserved inputs and restored controls after thrown actions. Translation checks cover `t()` calls, static `<Tr>` labels and their conditional literal branches.

## Assessment limits

Follow-up on 11 October 2026: localhost was briefly accessible to the parent agent, which identified missing hero/main landmark coverage, Portuguese FAQ/compliance-label leaks and an account-country schema mismatch. Follow-up source fixes are documented in `rendered-fixes.md` and `country-compatibility-fix.md`. Browser access was subsequently blocked again by the URL security policy, so final rendered/admin rechecks remain pending. An accessibility-tree inspection is not a full screen-reader or device test.

- Browser viewport, axe, screen-reader and physical-device QA: **NOT ASSESSED**. Browser access to localhost was blocked by the browser URL security policy during this run. No successful rendered viewport, screen-reader or device checks are implied by source/build tests.
- Accessibility tier gate: **NOT ASSESSED** because `design/accessibility-requirements.md` does not define a committed tier for this project. No WCAG certification is claimed.
- Engine validation: **NOT ASSESSED** because no engine is configured; this is a web application.
- The workspace already contained substantial uncommitted work. Changes preserve that baseline. React Doctor's comparison against `origin/master` includes all dirty changes, so its score and warnings cannot be attributed solely to this UI/UX pass.

The implemented interaction conventions are recorded in `design/ux/interaction-patterns.md`. A later browser/device QA pass should verify keyboard-only flows, screen-reader announcements, 320/375/768/1440px layouts, Portuguese text wrapping, 200% zoom, tables and reduced-motion/focus reveals.
