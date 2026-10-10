# CareBridge Connect — Full UI/UX Review

**Scope.** Static product audit of all routes and shared UI under `apps/web/src/app` and `apps/web/src/components`, with emphasis on public marketing, authentication, client/organisation/professional portals, admin surfaces, forms, navigation, responsive behavior, keyboard accessibility, copy, and loading/error/empty states. No source files were changed.

## Executive assessment

The product has a coherent green visual language, reusable navigation shells, localized English/Portuguese copy, and several thoughtful interaction details (custom keyboard-operable select, date picker, reduced-motion CSS, semantic fieldsets, `aria-current`, and inline pending/error states). The main UX risk is cross-surface consistency: public pages are polished, while role portals and complex forms expose uneven information hierarchy, status feedback, focus management, localization, and responsive density. The highest priority is to establish a consistent portal shell/state pattern and fix accessibility semantics in custom overlays before adding more features.

## Information architecture and user flows

- Public IA is clear: Home → About/Services/FAQ/Contact, with prominent paths to sign-in, professional registration, and booking request. The sticky marketing nav keeps the primary actions visible.
- Auth and role routing are understandable in code (`/(auth)`, `/client`, `/organisation`, `/professional`, `/admin`), but the user-facing hierarchy is role-specific rather than task-specific. A first-time user must choose between “join professional”, “create booking request”, sign-in, and organisation registration without a single progressive entry point or explicit “who are you?” decision aid.
- Portal navigation is a horizontal pill bar on desktop and a hamburger on mobile. There is no persistent breadcrumb or page title pattern in the shared shell, so deep pages (reports, finance, compliance, onboarding) can feel disconnected after navigation.
- Professional onboarding is a multi-step sequence (eligibility → assessment → documents/profile) and displays `OnboardingSteps`; good orientation, but completion requirements and “what happens next” should remain visible on every step, including error and pending outcomes.
- Booking flow is logically ordered (role → care type → date/time → duration → location → notes), with dependent care-type filtering and an end-time preview. Add a visible summary/review step before creation for high-consequence bookings, including timezone, address, duration, and cancellation expectations.
- Messaging, bookings, finance, compliance, and admin review areas are separate destinations. Shared task-level cross-links (“view booking”, “resolve incident”, “complete profile”) should reduce backtracking.

## Navigation and shell findings

**P1 — Mobile menu lacks focus management.** `site-nav-client.tsx` and `role-nav.tsx` toggle menus but do not move focus into the menu, trap focus, close on Escape, or close on outside click. Keyboard users can tab into obscured page content while the menu is open. Add a disclosure pattern with a labelled nav region, Escape/outside close, focus return to the trigger, and a visible focus style.

**P1 — Modal/dialog focus behavior is incomplete.** `ui/modal.tsx` focuses the panel and closes on Escape, but does not trap focus, restore focus to the invoker, or provide an explicit close button. `assistant-widget.tsx` uses an open `<dialog>` without focus return/trapping. This creates keyboard escape and screen-reader context problems.

**P2 — Active navigation is visually subtle on marketing pages.** The active dot plus color change is low salience and no `aria-current` is set in `site-nav-client.tsx`. Add `aria-current="page"` and a stronger non-color indicator (underline or inset border).

**P2 — Account access is hidden at small widths.** The marketing nav hides sign-in/dashboard below `sm`; it is duplicated inside the mobile menu, but users may not discover it. Keep an account action visible next to the menu or label the mobile menu with “Menu and account”.

**P2 — No skip link.** Add a global “Skip to main content” link and matching `id="main-content"` on primary page content in marketing and portal shells.

## Forms and interaction quality

**P1 — Custom Select semantics need refinement.** `ui/select.tsx` uses `role="combobox"` on a button and portals options, but does not expose `aria-activedescendant`, does not mark the popup as a listbox (`role="listbox"` is missing on the menu container), and uses nested `button[role=option]`. Screen-reader announcements of active options will be inconsistent. Prefer a native `<select>` where styling allows, or implement the full ARIA combobox/listbox pattern with option IDs and active descendant.

**P1 — Form errors are not associated with fields.** Booking, eligibility, contact, and similar forms render a general error paragraph, but do not set `role="alert"`, `aria-live`, `aria-describedby`, or move focus to the error. On server/action failure, users may not know which field needs correction. Use field-level errors where possible and an assertive summary that receives focus.

**P1 — Pending state is visually weak.** Buttons only change text and opacity (`Creating…`, `Sending…`, `Saving…`); there is no `aria-busy`, live status, or protection against context loss. Add `aria-busy`, a status announcement, and preserve entered data when actions fail.

**P2 — Date/time picker is powerful but not fully discoverable.** The calendar has labelled buttons and keyboard-focused cells, but the dialog has no explicit close control and focus restoration is not apparent. The hour/minute selects use literal English labels (`Hour`, `Minute`) even in Portuguese. Localize these labels and announce selected date/time changes.

**P2 — Booking date/time copy should state timezone before input.** The implementation converts London wall-clock time (`londonWallClockToUtc`) and previews the end in `APP_TIME_ZONE`, but the form does not visibly tell users that times are London time. Add “UK/London time” beside the field and in the confirmation summary.

**P2 — Required-field affordances are inconsistent.** Required is enforced programmatically, but labels do not consistently show “required” or an asterisk and custom controls rely on hidden required inputs. Add a consistent required convention and make optional fields explicit where helpful.

**P2 — Destructive/irreversible actions need confirmation context.** Booking cancellation, account anonymisation, payout actions, and admin status changes should state impact, affected record, and recovery path in the confirmation UI; ensure focus returns after cancel/complete.

## Loading, empty, success, and error states

- Good: most action forms expose pending text and inline errors; contact and eligibility have explicit success panels; assistant has 429 and generic error copy; `not-found.tsx` offers recovery links.
- Missing/uneven: there is no clearly shared skeleton/loading pattern across portal pages, so server navigation can feel blank or abrupt. Add route-level loading UIs for dashboard, bookings, messages, admin tables, and finance.
- Empty states should be task-oriented. For empty bookings/messages/review queues, provide explanation, next action, and a safe CTA rather than only an empty table/card. Include role-specific examples (“No upcoming bookings” → “Create a booking request”).
- Error boundaries and retry affordances are not evident at the shared shell level. Add a consistent route error pattern with plain-language cause, retry, support/contact link, and preserved navigation.
- Success states should state the durable result and next step. Contact form does this reasonably well; booking creation currently redirects to list without a visible confirmation context in the form flow.

## Responsive behavior

- Marketing layout uses sensible Tailwind breakpoints, a centered logo, and mobile menu. The hero and card-heavy sections should still be checked at 320px width: long translated labels, CTA pills, and the logo can compete for horizontal space.
- Portal desktop nav can contain many role-specific links in one pill row; at medium widths just below `lg`, it switches to hamburger abruptly. Validate 768–1100px widths for wrapping, menu discoverability, and page-title spacing.
- Booking form uses a two-column date/duration grid at all widths (`grid-cols-2`); on narrow screens, native/custom controls may become cramped. Add a breakpoint to stack below ~400px and test Portuguese labels.
- Portaled select menus use fixed viewport coordinates. They reposition on scroll/resize, but need clipping tests on mobile keyboards, zoom, and near-bottom fields; ensure the menu never becomes inaccessible behind the virtual keyboard.
- Assistant widget is fixed bottom-right and can cover form submit buttons or content at small viewport heights. Add safe-area padding and avoid covering primary actions; consider minimizing automatically when an input receives focus.
- Tables/admin views require explicit horizontal-scroll affordance or responsive card transformation. Audit every table at 320px and 200% zoom.

## Copy, localization, and content design

- Copy is generally calm, plain, and safety-aware. The assistant explicitly asks users not to share personal/health details, and legal/compliance sections are prominent.
- Portuguese support is implemented across market/content layers, but several UI strings remain hardcoded in English: `DateTimePicker` aria labels (`Hour`, `Minute`), 404 page copy/helpful links, and likely some admin/action labels. Run a string extraction pass for all user-facing literals.
- Avoid jargon without explanation (“regulated roles”, “compliance”, “eligibility”) at first decision points; add one-sentence definitions or progressive disclosure.
- CTA labels should describe outcomes consistently: “Create booking request”, “Join as a professional”, “Contact us”. Keep verb + object structure across all role surfaces.
- Error messages should say what happened, how to fix it, and whether data was saved. Generic “Could not complete the operation” is safe but insufficient for recovery.
- Legal/disclaimer pages are important but need a visible “last updated” date and a concise summary before dense copy; ensure draft notices are visually distinct from final policy content.

## Accessibility audit

Strengths: semantic labels/fieldsets, native inputs where possible, `aria-expanded` on menus, `aria-current` in role nav, visible focus rings on calendar cells, color palette comments acknowledging contrast, reduced-motion media query, and localized document `lang`.

Priority gaps: missing skip link; incomplete focus trap/return in dialogs and mobile menus; custom Select ARIA model; generic errors without live region/focus; icon-only/close controls need reliable accessible names in every instance; no evidence of a global heading outline check; no evidence of 200% zoom/reflow or screen-reader testing. Verify contrast for muted text (`#9aa8a0`, `#7a8a81`) at small sizes and hover/focus states, not only primary buttons.

## Recommended test matrix

1. Keyboard-only: open/close every menu, dialog, select, date picker; verify focus order and return; submit each form with invalid and valid data.
2. Screen reader smoke: headings/landmarks, current page, combobox option announcements, error summary, async pending/success announcements.
3. Viewports: 320×800, 375×667, 768×1024, 1024×768, 1440×900; test 200% browser zoom and long Portuguese strings.
4. State coverage: loading, empty, permission denied, validation error, network error, server rejection, success redirect, suspended account, 404.
5. Input and data safety: timezone disclosure, duplicate submission, back/forward during pending actions, preserved form input, confirmation for destructive actions.

## Prioritized backlog

- **P0:** Implement shared accessible dialog/menu focus management and repair custom Select listbox semantics.
- **P1:** Add global skip link, error summaries with focus/live regions, shared loading/empty/error patterns, and explicit timezone/booking confirmation.
- **P2:** Complete localization extraction, strengthen active navigation/account discoverability, responsive audit at 320px–1100px, and improve destructive-action confirmations.

## Evidence reviewed

Shared shell and public flow: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/components/site-nav.tsx`, `site-nav-client.tsx`, `role-nav.tsx`, `role-shell.tsx`, `auth-shell.tsx`, `assistant-widget.tsx`, `not-found.tsx`, `suspended/page.tsx`.

Forms and controls: `booking-request-form.tsx`, `contact-form.tsx`, `eligibility-form.tsx`, `ui/select.tsx`, `ui/date-picker.tsx`, `ui/modal.tsx`, plus route inventory under `apps/web/src/app` for client, organisation, professional, admin, legal, marketing, and auth surfaces.
