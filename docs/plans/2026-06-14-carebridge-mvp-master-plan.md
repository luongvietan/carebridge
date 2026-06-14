# CareBridge Connect — MVP Master Implementation Plan

> **For agentic workers:** This is a PROGRAM-level plan covering the full agreed MVP. It is intentionally decomposed into six subsystems mapped to the client's 5-phase / 8-week schedule. Each subsystem is built from its **own** bite-sized, TDD task-level plan generated at phase start (REQUIRED SUB-SKILL: superpowers:writing-plans → superpowers:subagent-driven-development). The database subsystem is already complete and its plan — [docs/plans/2026-06-14-carebridge-db-schema-implementation.md](2026-06-14-carebridge-db-schema-implementation.md) — is the template for the rest.

**Goal:** Deliver a secure, compliant, fully-owned healthcare staffing marketplace MVP for CareBridge Connect Ltd, covering professional onboarding/verification, competency assessment, client/organisation registration, combination bookings, Stripe payments, an admin/founder dashboard, full audit, and CSV/XLSX data export.

**Architecture:** Single Next.js (App Router) application — public marketing pages + four role-based authenticated areas — backed by Supabase (PostgreSQL + Auth + Storage). Server-side data access runs through a typed Supabase client honouring Row-Level Security; privileged admin operations use the service role behind server actions/route handlers. Stripe collects client payments; payouts are recorded in-platform. Every state change writes to the append-only `audit_log`. Hosted on Vercel; all accounts registered under CareBridge Connect Ltd.

**Tech Stack:** Next.js (App Router, TypeScript), Supabase (Postgres/Auth/Storage, RLS), Stripe, Vercel. Testing: pgTAP (DB), Vitest + React Testing Library (units/components), Playwright (E2E across Chrome/Edge/Safari/mobile viewports). Tooling: `npx supabase` local stack, ESLint/Prettier, GitHub Actions CI.

**Source of truth:** [docs/specs/2026-06-14-carebridge-db-schema-design.md](../specs/2026-06-14-carebridge-db-schema-design.md) and `CareBridge Connect MVP Overview.pdf`.

---

## 1. How to read & execute this plan

- The work is divided into **6 subsystems (S0–S5)**, sequenced to the client's **Phases 1–5 / Weeks 1–8**.
- Each subsystem section defines: **scope**, **module/file structure**, **work breakdown** (the tasks that become a detailed plan), **test strategy**, **acceptance criteria**, and **dependencies**.
- **Before building a subsystem**, generate its detailed TDD plan (one task = write failing test → run → implement → pass → commit), exactly as was done for the database. Do not hand-build screens without that plan.
- **Review gate:** per the client agreement, no subsystem/milestone is "done" until Ana has reviewed and approved it at the weekly meeting.

## 2. Repository & module layout (target)

```
carebridge-connect/
├─ docs/                         # specs + per-subsystem plans (existing)
├─ supabase/                     # migrations, tests, seed (S? DB layer — DONE)
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/            # public: home, about, services, faq, contact
│  │  ├─ (legal)/                # privacy, terms
│  │  ├─ (auth)/                 # login, register, verify, reset
│  │  ├─ professional/           # professional area (onboarding, profile, docs, bookings)
│  │  ├─ client/                 # private client area
│  │  ├─ organisation/           # organisation area
│  │  ├─ admin/                  # admin/founder dashboard
│  │  └─ api/                    # route handlers (stripe webhooks, exports)
│  ├─ lib/
│  │  ├─ supabase/               # server/browser clients, typed schema
│  │  ├─ auth/                   # session, role guards, RBAC middleware
│  │  ├─ audit/                  # audit_log writer helper
│  │  ├─ compliance/             # status/eligibility helpers
│  │  ├─ rates/                  # rate-card lookup + booking snapshot builder
│  │  ├─ stripe/                 # stripe client + payment intent helpers
│  │  └─ export/                 # CSV/XLSX generators over v_export_* views
│  ├─ components/                # shared UI (forms, tables, status badges)
│  └─ types/                     # generated DB types, domain types
├─ e2e/                          # Playwright specs
└─ .github/workflows/ci.yml      # lint + unit + pgTAP + build
```

**Boundary principle:** each role area owns its routes; shared domain logic lives in `src/lib/*` as small, single-responsibility modules (rates, compliance, audit, export) so it is unit-testable independently of React.

## 3. Cross-cutting conventions (apply to every subsystem)

- **Data access:** all reads/writes go through `src/lib/supabase`. User-scoped operations use the RLS-bound client (the user's JWT); admin-only operations use a server-only service-role client inside server actions/route handlers — never exposed to the browser.
- **Audit:** every create/approve/reject/assign/suspend/payment action calls the `src/lib/audit` writer (actor, action, entity, before/after). DB triggers cover the rest.
- **Validation:** shared Zod schemas per entity, reused by forms (client) and server actions (server). One schema module per entity.
- **Testing pyramid:** pgTAP (DB rules — done), Vitest for `src/lib/*` domain logic and components, Playwright for the critical journeys listed in the PDF testing section. CI runs all three on every PR.
- **Definition of Done per task:** code + tests written/passing, lint clean, committed; per subsystem: Playwright happy-path green + Ana review.

---

## 4. Subsystem S0 — App foundation, auth & public site  *(Phase 1 · Week 1 · NEXT)*

**Scope:** Scaffold the Next.js app onto the existing Supabase DB; wire auth (email verification, password reset), role-based access for the 4 account types + Founder, the public marketing pages, and legal/consent capture.

**Module/file structure:**
- `src/lib/supabase/{server,browser,service,types}.ts` — clients + generated types (`supabase gen types typescript`).
- `src/lib/auth/{session,guards,rbac}.ts` — current-user/session, `requireRole()`, middleware redirect rules.
- `middleware.ts` — route protection by area.
- `src/app/(marketing)/**` — Home, About, Services, Contact, FAQ.
- `src/app/(legal)/**` — Privacy Policy, Terms; consent recorded to `consents` on registration.
- `src/app/(auth)/**` — login, register (role selection), email verify callback, password reset.
- `components/` — layout shell, nav per role, form primitives.

**Work breakdown (→ detailed plan tasks):**
1. Scaffold Next.js + TS + ESLint/Prettier; commit baseline; CI workflow (lint + build + pgTAP).
2. Generate typed DB schema into `src/lib/supabase/types.ts`; create server/browser/service clients.
3. Auth: registration with `account_type` selection → creates `auth.users` + `public.users` row (trigger or server action) + `consents` row; email verification; password reset.
4. RBAC: `requireRole()` guard + `middleware.ts` redirects; Founder bypass.
5. Public marketing pages (5) + legal pages (2), responsive, SEO metadata.
6. Smoke E2E: register each role → verify → land on correct area.

**Test strategy:** Vitest for `auth/guards` + `rbac`; Playwright for register/verify/login per role and public-page rendering.

**Acceptance:** A user can register as each role, verify email, reset password, and is routed to the correct area; non-permitted areas redirect; public + legal pages live and responsive; consent stored.

**Dependencies:** DB layer (done).

---

## 5. Subsystem S1 — Professional onboarding, assessment & compliance  *(Phase 2 · Weeks 2–4)*

**Scope:** The 4-gate professional journey + admin verification, plus compliance tracking UI on top of the existing engine.

**Module/file structure:**
- `src/app/professional/onboarding/**` — eligibility screening → assessment → profile → document upload, as a resumable wizard.
- `src/lib/compliance/{eligibility,status}.ts` — screening outcome, derived status helpers.
- `src/lib/assessment/{bank,scoring,attempts}.ts` — randomised selection, auto-scoring (80% pass), attempt limit (3) + lock window.
- `src/app/admin/compliance/**` — document review queue, approve/reject/request-info, expiry dashboard.
- Storage: private bucket wiring for document uploads.

**Work breakdown (→ detailed plan tasks):**
1. Eligibility screening form (employment status + mandatory-training confirmation) → `eligibility_screenings`; "pending" path if training not current.
2. Competency assessment: serve N randomised questions per role from `assessment_question_bank`, capture answers, auto-score, enforce 80%/3-attempts, set `assessment_locked_until` on 3rd fail.
3. Professional profile form (all PDF fields) + photo upload.
4. Document upload to private Supabase Storage → `documents` rows with expiry/reference metadata.
5. Admin review queue: approve/reject/further-info; on approval recompute `compliance_status`/`professional_status`.
6. Compliance dashboard: expiry tracking, `compliance_alerts`, highlight non-compliant professionals.

**Test strategy:** Vitest for scoring/attempt/eligibility logic (pure functions); pgTAP already covers auto-block; Playwright for the full onboarding journey and an admin approval flow.

**Acceptance:** A professional completes all 4 gates; failing assessment 3× locks reapplication; uploaded docs are private; admin approval flips status and unlocks `can_accept_bookings`; expiring/expired criticals surface and auto-restrict.

**Dependencies:** S0. **Requires from Ana:** competency question bank per role; confirmed status/suspension workflow.

---

## 6. Subsystem S2 — Clients, organisations, bookings & matching  *(Phase 3 · Weeks 4–5)*

**Scope:** Client/organisation registration and the combination booking model with notifications.

**Module/file structure:**
- `src/app/client/**`, `src/app/organisation/**` — registration + booking request forms + booking history.
- `src/lib/rates/snapshot.ts` — resolve active `rate_cards` row and build the booking rate snapshot.
- `src/lib/bookings/{create,accept,assign,eligibility}.ts` — open-market accept + admin-assign; compliance check at accept/assign.
- `src/app/professional/bookings/**` — view open bookings, accept/decline, history.
- `src/lib/notifications/*` — email sender + templated notifications.

**Work breakdown (→ detailed plan tasks):**
1. Client + organisation registration (incl. CQC number, billing) → `private_clients`/`organisations` + Stripe customer creation.
2. Booking request form (role, date/time, duration, location, notes) → `bookings` with rate snapshot from `src/lib/rates/snapshot.ts`.
3. Open-market: professional views matching open bookings (role + `can_accept_bookings`), accepts/declines; eligibility enforced at accept.
4. Admin-assign: admin assigns a compliant professional directly; status transitions logged to `booking_status_history`.
5. Cancellation flow → `booking_cancellations` (last-minute flag feeds suspension reasons).
6. Email notifications for booking request/confirmation/assessment/compliance events.

**Test strategy:** Vitest for snapshot + eligibility gating; Playwright for request → accept and request → admin-assign journeys; verify a non-compliant professional cannot accept.

**Acceptance:** Both booking paths work; rate snapshot is frozen on the booking; ineligible professionals are blocked at accept/assign; notifications fire.

**Dependencies:** S0, S1.

---

## 7. Subsystem S3 — Payments, payouts & admin dashboard  *(Phase 4 · Weeks 6–7)*

**Scope:** Stripe payment collection, in-platform payout recording, transaction history, and the full admin/founder dashboard including the suspension/status workflow and search/filter.

**Module/file structure:**
- `src/lib/stripe/*` + `src/app/api/stripe/webhook/route.ts` — payment intents on booking confirmation; webhook → `payments`.
- `src/app/admin/**` — user mgmt, compliance mgmt (from S1), booking mgmt, financial mgmt (payments/payouts/revenue), rate-card management, suspension/status actions, search & filter.
- `src/lib/payouts/*` — record/mark-paid payouts; `professional_payout_details` (pgcrypto) capture.

**Work breakdown (→ detailed plan tasks):**
1. Stripe payment collection on booking confirmation; webhook reconciles `payments`.
2. Payout recording UI (record amount/method/reference, mark paid) over `payouts`; encrypted bank details capture.
3. Financial views: transaction history + platform revenue (`v_platform_revenue`).
4. Admin user/booking management: approve/reject/suspend; assign bookings; monitor statuses.
5. Suspension/status workflow UI over `professional_status_actions` (reason codes, internal notes, review date, reinstate).
6. Rate-card management (insert new effective-dated rate, close prior) + central amend.
7. Search & filter professionals (role, location, availability, DBS/registration/compliance/assessment status).

**Test strategy:** Vitest for payout/revenue calc and rate-card transition; Stripe in test mode with mocked webhooks; Playwright for an end-to-end booking → payment → payout-record → revenue-report flow and a suspend → reinstate flow.

**Acceptance:** Client payment collected via Stripe; payout recorded; revenue report correct; admin can suspend/reinstate with full audit; rate amendments don't alter past bookings; search/filter works.

**Dependencies:** S0–S2.

---

## 8. Subsystem S4 — Reporting, export, testing, deployment & handover  *(Phase 5 · Week 8)*

**Scope:** CSV/XLSX export (priority #1), audit reports, full cross-browser/mobile testing, backups, SSL, deployment, admin handover + user guide.

**Module/file structure:**
- `src/lib/export/*` + `src/app/api/export/[entity]/route.ts` — stream CSV/XLSX from `v_export_*` views (admin-only).
- `src/app/admin/reports/**` — audit reports, export buttons per dataset.
- `e2e/**` — Playwright suites for the PDF testing checklist; CI matrix for Chrome/Edge/WebKit + mobile viewports.
- Ops: Vercel project, custom domain + SSL, Supabase daily backups, env/secrets under CareBridge Connect Ltd.

**Work breakdown (→ detailed plan tasks):**
1. Export endpoints: every `v_export_*` dataset → CSV and XLSX, admin-gated.
2. Audit reports view + filters.
3. Playwright coverage for registration, login, uploads, assessment, booking, payment, admin — across required browsers + mobile viewports.
4. Deploy to Vercel under CareBridge Connect Ltd; domain + SSL; enable Supabase daily backups + restore drill.
5. Admin handover: access transfer, source-code handover, basic user guide.

**Test strategy:** Vitest for export serialisation; Playwright cross-browser/mobile matrix in CI; manual restore-from-backup drill.

**Acceptance:** All key datasets export to CSV/XLSX at any time; required browsers/mobile pass; daily backups verified; live on owned domain with SSL; ownership/handover complete.

**Dependencies:** S0–S3.

---

## 9. 8-week schedule & review gates

| Week | Phase | Subsystem | Milestone (Ana-reviewed) |
|------|-------|-----------|--------------------------|
| 1 | 1 | DB (done) + S0 | App foundation, auth, RBAC, public + legal pages |
| 2–4 | 2 | S1 | Onboarding, assessment, document upload, compliance tracking |
| 4–5 | 3 | S2 | Client/org registration, combination bookings, notifications |
| 6–7 | 4 | S3 | Stripe, payouts, admin dashboard, suspension/status, search |
| 8 | 5 | S4 | Export (CSV/XLSX), reports, testing, deploy, handover |

Weekly review meeting; no milestone complete until reviewed and approved.

## 10. Inputs required from Ana (blocking — needed by start of Week 2)

1. **Agreed compliance status/suspension workflow** (sign-off of the state model in the DB design §B/§8.2).
2. **Competency assessment question bank per role** (Registered Nurse, Healthcare Assistant, Support Worker, Physiotherapist) — loads into `assessment_question_bank`.
3. Branding/content for public + legal pages (or approval to use placeholders pending copy).
4. Stripe account + domain under CareBridge Connect Ltd (for Phase 4–5).

## 11. Definition of Done / handover checklist (from PDF §13–14, §17)

- Fully functioning live site; domain + SSL; Vercel hosting under CareBridge Connect Ltd.
- Founder has full admin + database access; source code handed over; repo owned by CareBridge Connect Ltd.
- Automatic daily backups + verified restore.
- Tested: registration, login, uploads, assessment, booking, payment, admin, mobile responsiveness, on Chrome/Edge/Safari + Android/iPhone.
- CSV/XLSX export of all key datasets at any time.
- Basic user guide delivered.

## 12. Risks & mitigations

- **Assessment questions / workflow sign-off slip** → blocks S1; mitigate by starting S0 now and front-loading the request to Ana.
- **Stripe payout automation scope creep** → MVP is *recorded* payouts only; automation is Phase 2 (post-MVP), already de-scoped.
- **RLS gaps for client/org/payout tables** → S0/S3 must extend the representative RLS policy set (DB plan T17 note) per-table; add RLS-focused Playwright/SQL checks.
- **Email deliverability on Vercel** → use a transactional provider (e.g. Resend) wired in S2, configured under the client's domain.

---

## 13. Self-review

- **Spec coverage:** PDF sections map to subsystems — eligibility/assessment/profile/verification (§1–4) → S1; client/org (§5) → S2; bookings/matching (§6–7) → S2; pricing/payments (§8) → S3; admin dashboard + suspension/auto-block (§9) → S3 (engine in DB); notifications (§10) → S2; security/GDPR (§11) → S0 + cross-cutting; website pages (§12) → S0; deployment/ownership (§13–14) → S4; future phase (§15) → explicitly out of scope; export/audit/search/alerts/founder access (§16) → S1/S3/S4; communication/IP/backup/testing (§17) → §9/§11. No agreed requirement is unassigned.
- **Decomposition check:** six subsystems, each independently buildable/testable, each with its own detailed plan to follow — consistent with the multi-subsystem guidance. The DB subsystem is complete and its plan is the proven template.
- **No fake placeholders:** higher-altitude items are deliberate program-level breakdown, not deferred detail; the code-level "no placeholder" rule applies to the per-subsystem plans, which carry full TDD code (see the DB plan).
