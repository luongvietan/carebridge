# Platform Readiness Fixes Implementation Plan

**Goal:** Correct every actionable defect from `docs/PROJECT_REVIEW_2026-10-10.md` and prepare a verifiable Portugal-first private trial.

**Execution note (10 October 2026):** Implementation and local verification are complete for the code-owned items. The unchecked items below that require Ana's business approvals or hosted credentials remain intentionally pending; see `docs/verification/FINAL_CHECK_2026-10-10.md`.

**Architecture:** Keep the existing Next.js/Supabase design. Separate public launch policy from database regulatory approval. Use immutable signup market for account records and persisted market for authenticated journeys. Reuse a single escaped HTML email renderer for notifications and enquiry acknowledgements.

**Tech Stack:** Next.js, React, TypeScript, Supabase, Resend, Stripe, Vitest, Playwright, pgTAP.

**Spec:** `docs/PROJECT_REVIEW_2026-10-10.md`, Ana's Portugal-first / UK launching soon / branded email requirements, user instruction to fix and improve all.

## Global constraints

- Preserve the user's existing `.gitignore`, `.ignore`, demo-kit and other changes.
- No fabricated legal identity, approved rates, specialist assessment bank or live credentials.
- Keep the production preview gate and PT regulatory launch approval intact.
- Do not mutate hosted database or send real email/payment during tests.
- No production publish until implementation and evidence are reviewable.
- Add meaningful failing regression tests before behavior changes, then prove they pass.
- Work on `codex/portugal-readiness-fixes`; no commits are needed for this reviewable local delivery.

## Task 1 — Account market and payment journey

Files: onboarding/professional-session.ts, onboarding/actions.ts, accounts/actions.ts, i18n/portal-server.ts, payments/actions.ts and targeted tests.

- [ ] Reproduce signup PT → cookie GB → first onboarding with a fake external Supabase boundary; expect persisted PT.
- [ ] Reproduce an organisation checkout success/cancel; expect `/organisation/bookings` rather than `/client/bookings`.
- [ ] Make signup metadata authoritative for newly created profiles, stored profile country authoritative for existing authenticated accounts; use a deliberate fallback for legacy metadata.
- [ ] Fix checkout redirect based on the requester account type; reject unsupported account types before financial side effects.
- [ ] Run targeted tests, report red/green evidence and inspect the full call graph before changing shared helpers.

## Task 2 — Branded, honest email delivery

Files: notifications/send.ts and tests, new email renderer/sender modules, contact/actions.ts and tests, enquiry email templates, reusable signature artifacts.

- [ ] Reproduce record-only sender and missing recipient producing a false sent status; assert persisted delivery outcomes.
- [ ] Test rendered HTML escapes user text, preserves readable plain text, includes logo/brand/locale and cannot inject header/content HTML.
- [ ] Implement one HTML shell and reusable transactional transport; notification email includes HTML and text.
- [ ] Add PT/EN acknowledgement to successful contact persistence with deduplication/failure handling and truthful UI language; don't fail the saved enquiry merely because email failed.
- [ ] Provide editable HTML signatures and enquiry templates with truthful company details and links.
- [ ] Run targeted tests and verify no real external sending in tests.

## Task 3 — Portugal-first launch and readiness

Files: marketing/market.ts, market-server.ts, market-actions.ts, country switch, auth signup, booking country guard, assessment bank coverage, ops readiness CLI, env example, seed/migration and tests.

- [ ] Test unknown market selects PT, retired GB cookies fallback PT and UK remains a nonselectable launching-soon chip, including private preview.
- [ ] Honor PT preview only with gate enabled, otherwise honor regulatory `is_live`; never open PT simply from the launch policy.
- [ ] Reject closed-market new signup/booking requests server-side while preserving existing UK account access.
- [ ] Test readiness detects incomplete role-specific assessment pools, missing payout/cron/email/Stripe settings and placeholder company settings without exposing secrets.
- [ ] Add a secret-safe read-only readiness command; document draft question/rate approval rather than inventing passed launch status.
- [ ] Run targeted tests.

## Task 4 — Isolated verification and operational handover

Files: e2e configuration/tests, CI workflow, environment templates/scripts, USER_GUIDE.md, PORTUGAL_LAUNCH.md and verification report.

- [ ] Check Docker availability and attempt to start the existing official Docker Desktop if possible; isolate database before mutations.
- [ ] Add PT regression E2E for signup market persistence / onboarding and launch selection; ensure E2E explicitly refuses hosted database targets.
- [ ] Expand CI matrix browser coverage for existing matrix smoke cases without running shared-data mutations concurrently.
- [ ] Add local environment validation and clear diagnostics, preserving secrets and stable payout encryption.
- [ ] Update user guide to actual onboarding order, 13 exports and current trial requirements.
- [ ] Run full tests, lint, build, React Doctor, database tests and available E2E; inspect desktop/mobile UI through browser.
- [ ] Review all changes independently, fix material findings and record exact remaining inputs from Ana.

## Decisions

The already-authorized report defines scope. Use parallel agents for disjoint email and account/payment domains; the controller owns market policy and ops verification. These domains share no edited files except integration is reviewed at completion. Never overwrite user files or attach unapproved legal/business claims to generated artifacts.
