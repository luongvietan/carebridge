# Ana requirements — implementation, 20 October 2026

## Completed in source

1. Portugal pilot assessment: exactly 20 common PT questions, pass mark 80%, maximum three attempts per existing reapplication cycle. Specialist banks no longer block PT roles. Readiness UI and operational checks follow the same policy. Resumed and submitted attempts are checked against the PT common bank. All 20 existing questions and options have an English presentation; identifiers and scoring keys stay unchanged.
2. Payouts copy the booking snapshot currency. Migration 0097 also enforces this for new ledger writes at the database boundary. Existing paid ledger entries are not rewritten.
3. Booking review uses service-only RPC `review_booking`. It checks an active admin/founder and clinical reviewer where required, locks booking and assessment, and writes decision, safety brief, status, history, cancellation and audit in one transaction. Missing audit/brief or an invalid date aborts the transaction. Notifications follow successful commit. Viewing assessment data also requires a successful access audit.
4. Stripe Checkout completion settles only when `payment_status` is `paid`. An unpaid completion stays pending; delayed success/failure events are handled separately.
5. PT | EN is available in marketing and account navigation. Portuguese is the default. Choice persists in a secure server cookie and account auth metadata; migration 0098 synchronises the public account preference used by notifications. Login carries an explicit guest language into the account. Country remains separate: English in Portugal retains NIF/NISS, Ordens/ISS, EUR, Portugal phone and 112. Public pages, auth, onboarding, assessment, risk forms, booking forms, dashboard, legal pages and notification rendering use the preference.
6. Removed homepage/about stats band; completion record explicitly states it is not accredited and replaces no required qualification. Portugal support content now includes washing, dressing, toileting, mobility, meals and companionship within competence and assessed needs. The disclaimer uses matching PT/EN wording and limits clinical care to appropriately qualified and authorised professionals. Email body/sender display use CareBridge Connect Portugal, phone/WhatsApp and normally one working day. Sender email address still comes from existing configuration. Supabase confirmation/recovery templates use the independent preference and updated public contact domain.

## Verification

- 548 unit tests across 81 files, plus 9 script checks passed in an identical isolated source copy on D (C ran out of space).
- TypeScript and ESLint passed.
- React Doctor changed scope: no issues found, score 91/100.
- PostgreSQL PGlite executed the actual 0096–0098 migrations against a minimal schema fixture. Confirmed rollback on final audit failure; valid approval, decline, more-information; invalid date, stale/double decision, missing brief, clinical and suspended-admin rejection; service-only function access; EUR inheritance; independent saved-language synchronisation.
- This SQL fixture is not a full Supabase RLS/auth/concurrent-session E2E test. Hosted Supabase was not mutated. Real Stripe and outbound delivery were not exercised.
- Production Next.js 16.3.8 webpack build passed against local fixture credentials. Browser: 12 page/viewport combinations (1440px and 375px), default PT, PT → EN → PT, persistence on homepage/login/services/FAQ/contact/legal, no horizontal overflow and no UK regulator content. All database requests went to a read-only local fixture; no hosted database connection. The final disclaimer-only wording adjustment was subsequently checked with TypeScript and ESLint.
- After recovering disk space, both auth templates were restored and checked as non-empty. All web source files match the verification copy; no zero-length source files remain. Final TypeScript, ESLint, 15 language/content/email regression tests, PostgreSQL checks and `git diff --check` passed. Browser checks were repeated with reduced motion to expose content normally hidden until scrolling. Screenshots and JSON evidence are in `ana-2026-10-20/` alongside this report; the verification workspace remains at D:/CareBridgeVerification-20261020/.

## Release steps (not performed)

Apply migrations 0096, 0097, 0098 in order in the target environment, then deploy the matching application version. Update Supabase confirmation/recovery email templates from source. Confirm configured sender domain/address, public app origin and auth redirects separately before production activation. The existing environment may still override the new public-domain defaults.

No production deploy, live rates/configuration changes, Live-in, MFA or email-change workflow was included. Existing incorrect historical payout currencies require separate reconciliation, rather than silent rewriting of paid records.

Reproducible SQL regression: `supabase/tests/review-currency-locale.mjs`; set `PGLITE_MODULE` to an installed PGlite module when it is not in the project dependencies. It creates an in-memory database and has no network calls.
