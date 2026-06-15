# S3b — Admin Dashboard & Governance — Design

> Date: 2026-06-16. Second half of the original S3 (split into S3a Payments & Payouts —
> shipped — and **S3b Admin Dashboard & Governance**, this spec). Builds on S0–S3a + the DB
> layer. Supersedes the admin/governance portions of the stale 2026-06-14 S3 plan.

## Goal

Give admins/founder the governance surface: account suspension/deactivation for any role (enforced
at login + route guard), the professional status/suspension workflow with reason codes and an audit
trail, an admin user-management hub with rich search/filter, and central effective-dated rate-card
management.

## Locked decisions

- **Two orthogonal status axes**, both exposed in the admin UI:
  - `account_status` (NEW, on `users`, all roles) — platform access. Non-active ⇒ blocked at login + guard.
  - `professional_status` (existing, professionals only) — booking governance. Non-active ⇒ `can_accept_bookings` auto-false (generated column).
- **All account types** are governable (professionals, clients, organisations) via `account_status`.
- **Suspension enforcement is hard:** login sign-out + `proxy.ts` redirect for non-active accounts.
- **Professional status workflow:** a proposed default transition matrix (below) in one testable module, flagged for Ana's sign-off.
- **Rate-card amendment is atomic** via a SQL function (preserves the `uq_rate_card_active` invariant).
- Architecture mirrors S2/S3a: pure unit-tested logic modules + thin admin server actions (service client + `audit_log`) + edge enforcement.

## Section 1 — Account status (all roles)

- **Migration `0028_account_status.sql`:** enum `account_status` (`active`,`suspended`,`deactivated`) + `users.account_status not null default 'active'`.
- **Pure module `src/lib/admin/account-status.ts`:** `canSetAccountStatus(current, next)` — legal: `active⇄suspended`, `active→deactivated`, `suspended→deactivated`, `deactivated→active`; same-state is an error. Unit-tested.
- **Admin action `setAccountStatus(userId, next, reason)`** (service client, `requireAdmin`): updates `users.account_status`, writes `audit_log`. Works for any account type. **Refuses** to suspend/deactivate an `admin`/founder account (no self-lockout).
- **Enforcement (hard):**
  - Login (`app/(auth)/login`): after auth, if `account_status !== 'active'`, sign out + show "Your account is suspended — contact CareBridge Connect."
  - Route guard (`src/proxy.ts`): for guarded areas, if signed-in user's `account_status !== 'active'`, redirect to `/suspended`. The proxy already loads the user row for role checks — one extra field.
  - New static page `app/suspended/page.tsx`.

## Section 2 — Professional status workflow

Pure module `src/lib/admin/status-machine.ts`: legal-transition matrix keyed by `(from_status, action_type)` → `resulting_status`, using the exact schema vocabulary. `applyStatusAction(from, action)` returns the resulting status or a typed error. Unit-tested.

**Action → resulting status:**

| action_type | resulting_status |
|---|---|
| `suspend` / `full_suspension` | `temporarily_suspended` |
| `compliance_hold` | `compliance_hold` |
| `booking_restriction` | `booking_restricted` |
| `under_investigation` | `under_investigation` |
| `reinstate` | `active` |
| `reject` | `rejected` |
| `remove` | `removed` |

**Proposed legal FROM-states (Ana to confirm):**

| From | Allowed actions |
|---|---|
| `pending_verification` | reject, under_investigation, compliance_hold |
| `active` | suspend, full_suspension, booking_restriction, compliance_hold, under_investigation, remove |
| `compliance_hold` | reinstate, suspend, under_investigation, remove |
| `booking_restricted` | reinstate, suspend, remove |
| `temporarily_suspended` | reinstate, under_investigation, remove |
| `under_investigation` | reinstate, suspend, reject, remove |
| `rejected` / `removed` | *(terminal)* |

**Admin action `applyProfessionalStatusAction(professionalId, action, { reasonCode, reasonText, internalNotes, reviewDate })`** (service client, `requireAdmin`): validate via matrix → update `professionals.professional_status` → insert `professional_status_actions` (`resulting_status`, `applied_by`, `applied_at`) → `audit_log`. `reasonCode` must be from the schema's allowed set.

- Non-active result auto-blocks bookings (generated `can_accept_bookings`); no extra enforcement.
- `reinstate → active` still leaves booking eligibility gated on `compliance_status='approved'`.

## Section 3 — Admin user management & search

- **Pure module `src/lib/admin/search.ts`:** `buildProfessionalFilters(criteria)` → normalized query descriptor. Criteria: `text` (name/email), `professionalStatus`, `complianceStatus`, `roleId`, `postcode`/`maxTravelKm`, `availability`, `docValidity` (DBS/registration/insurance current). Unit-tested (empty → no filters; text → ilike; doc validity → join condition).
- **Pages:**
  - `admin/users/page.tsx` (service client) — filter bar + professionals table (name, role, professional_status, compliance_status, account_status, last action). Text/role/status via WHERE/ilike; location/availability/doc-validity via joins to `professional_availability`, `professional_skills`, `documents`/compliance expiry.
  - `admin/users/[id]/page.tsx` — professional detail: profile + documents/compliance summary, **status-action panel** (`StatusActionForm`, action select filtered to legal actions for current state, reason code/notes/review date), **account-status control** (`AccountStatusControl`), and the `professional_status_actions` history. Links to the existing `admin/compliance` queue.
  - `admin/accounts/page.tsx` — all-accounts list (professional/client/organisation) with `account_status` + suspend/deactivate/reactivate control.
- **Client components** (follow `admin-bookings.tsx`/`payout-actions.tsx`): `StatusActionForm`, `AccountStatusControl`, `UserFilters` — call their action, `router.refresh()` on success, inline errors.
- No restructuring of existing admin pages; add cross-links from `admin/page.tsx`.

## Section 4 — Central rate-card management

Effective-dated amend preserving `uq_rate_card_active` (one active card per role).

- **Pure module `src/lib/admin/rates.ts`:** `planRateAmendment(current, newRates, now)` → the close (`effective_to=now`) + new-card payload (`effective_from=now`). Validates `client_charge_rate >= professional_payout_rate` and fee-type fields. Unit-tested (derived/percentage/fixed; margin rejection).
- **Migration `0029_amend_rate_card_fn.sql`:** `amend_rate_card(role_id, charge, payout, fee_type, fee_value, currency, admin_id)` — atomically sets the current active card's `effective_to=now()` and inserts the new active card in one block (so the partial unique index is never violated under concurrency).
- **Admin action `amendRateCard(roleId, newRates)`** (service client, `requireAdmin`): calls the RPC, writes `audit_log`.
- **Page `admin/rates/page.tsx`** — per role: current active rate + effective-dated history + an `AmendRateForm`.
- **Safety property (tested):** amending rates does not alter past bookings (frozen `snap_*`).

## Section 5 — Migrations, testing & scope

**Migrations:** `0028_account_status.sql`, `0029_amend_rate_card_fn.sql`.
**pgTAP tests:** `0029_account_status_test.sql` (column + default), `0030_amend_rate_card_test.sql` (close+open atomic, unique-active preserved, margin).

**Test strategy:**
- Vitest: `account-status`, `status-machine`, `search` (`buildProfessionalFilters`), `rates` (`planRateAmendment`).
- pgTAP: account_status column/default; `amend_rate_card` atomicity + invariant + margin.
- Playwright `e2e/admin-governance.spec.ts`: (1) admin suspends a professional → `can_accept_bookings` false → reinstate → true; (2) admin suspends a **client account** → blocked at login / guard redirect; (3) admin amends a role's rate card → new active card + an existing booking's `snap_*` totals unchanged; (4) search filters (status/role/text) return the expected professional.

**In scope:** `account_status` model + hard enforcement; account actions for all roles; professional status workflow (proposed matrix); admin user hub + detail + rich search; central rate-card management.

**Out of scope:** client/org rich profiles beyond status; analytics beyond the finance report; CSV/XLSX export (S4).

**Acceptance:** admins suspend/reinstate/deactivate any account (enforced at login + guard); apply the full professional status workflow with reason codes + audit trail (non-active auto-blocks bookings); search/filter professionals across all criteria; amend effective-dated rate cards atomically without altering past bookings — all audited.

**Scope note:** sizable but cohesive. The implementation plan may run ~16–18 tasks; if unwieldy it can be split (governance vs rate-management) at the writing-plans stage. The spec stays unified.
