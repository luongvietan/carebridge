# S3b — Admin Dashboard & Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin governance surface — account suspension/deactivation for any role (enforced at login + route guard), the professional status/suspension workflow with reason codes and audit trail, an admin user-management hub with rich search, and central effective-dated rate-card management.

**Architecture:** Pure unit-tested logic modules (`account-status`, `status-machine`, `search`, `rates`) + thin admin server actions (service client + `audit_log`) + edge enforcement (login + `proxy.ts`). Two orthogonal status axes: new `users.account_status` (platform access, all roles) and existing `professional_status` (booking governance; non-active auto-blocks via the generated `can_accept_bookings`). Mirrors the S2/S3a pattern.

**Tech Stack:** Next.js 16 App Router (server actions + client components), Supabase service client, pgcrypto/pgTAP, Zod-free plain validation in pure modules, Vitest, Playwright.

**Spec:** [docs/superpowers/specs/2026-06-16-s3b-admin-governance-design.md](../specs/2026-06-16-s3b-admin-governance-design.md)

**Naming note:** the spec's `planRateAmendment` is implemented as `validateRateAmendment` (validation + payload only) because the atomic close+open is done by the `amend_rate_card` SQL function — the app never computes the close itself.

---

## Conventions

- Run loops: `cd apps/web && npm run test` (vitest), `npm run lint`, `npm run build` (full type-check — run before declaring a UI/action task done), `npm run e2e` (Playwright, targets local Supabase by default). DB (repo root): `npx supabase db reset && npx supabase test db`.
- Migrations continue from `0027`: next is **0028**. pgTAP tests continue from `0028_payment_templates_test`: next is **0029**.
- Supabase: `@/lib/supabase/server` (`createClient`), `@/lib/supabase/service` (`createServiceClient`). Admin gate: `@/lib/auth/admin` (`requireAdmin` → admin user id or null).
- After a migration that changes DB shape used by typed `.from()/.rpc()` calls, REGENERATE types: `SUPABASE_ACCESS_TOKEN=dummy npx supabase gen types typescript --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" > apps/web/src/lib/supabase/types.ts` (else `next build` fails — this bit S3a). Commit the regenerated types with the migration's task.
- `audit_log.actor_type` ∈ 'user'|'admin'|'system'.
- Commit after every task. End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Task order:** Tasks 1–14 sequential; then **Task 16** (nav — pages must exist); then **Task 15** (E2E).

## File structure

```
src/lib/admin/account-status.ts      # canSetAccountStatus (pure)            (+test)
src/lib/admin/status-machine.ts      # applyStatusAction, allowedActions (pure) (+test)
src/lib/admin/search.ts              # buildProfessionalFilters (pure)       (+test)
src/lib/admin/rates.ts               # validateRateAmendment (pure)          (+test)
src/lib/admin/account-actions.ts     # setAccountStatus (admin action)
src/lib/admin/status-actions.ts      # applyProfessionalStatusAction (admin action)
src/lib/admin/rate-actions.ts        # amendRateCard (admin action)
src/app/(auth)/login/page.tsx        # + account_status gate (modify)
src/proxy.ts                         # + account_status guard (modify)
src/app/suspended/page.tsx           # public "account suspended" page
src/app/admin/page.tsx               # + Users, Accounts, Rates, Finance cards (modify)
src/app/admin/users/page.tsx         src/app/admin/users/[id]/page.tsx
src/app/admin/accounts/page.tsx      src/app/admin/rates/page.tsx
src/lib/auth/role-nav.ts             # + Users, Accounts, Rates, Finance nav items (modify)
src/components/user-filters.tsx  status-action-form.tsx  account-status-control.tsx  amend-rate-form.tsx
supabase/migrations/0028_account_status.sql
supabase/migrations/0029_amend_rate_card_fn.sql
supabase/tests/0029_account_status_test.sql
supabase/tests/0030_amend_rate_card_test.sql
apps/web/e2e/admin-governance.spec.ts
```

---

## Task 1: `account_status` migration + types

**Files:** Create `supabase/migrations/0028_account_status.sql`, `supabase/tests/0029_account_status_test.sql`; regenerate `apps/web/src/lib/supabase/types.ts`.

- [ ] **Step 1: Failing pgTAP** (`0029_account_status_test.sql`)
```sql
begin;
select plan(2);
select has_column('users', 'account_status');
select is(
  (select column_default from information_schema.columns where table_name='users' and column_name='account_status'),
  '''active''::account_status', 'account_status defaults to active');
select * from finish();
rollback;
```
- [ ] **Step 2: Run** (repo root) `npx supabase db reset && npx supabase test db` → FAIL (column missing).
- [ ] **Step 3: Migration** (`0028_account_status.sql`)
```sql
create type account_status as enum ('active','suspended','deactivated');
alter table users add column account_status account_status not null default 'active';
```
- [ ] **Step 4: Run** `npx supabase db reset && npx supabase test db` → PASS.
- [ ] **Step 5: Regenerate types**
```
SUPABASE_ACCESS_TOKEN=dummy npx supabase gen types typescript --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" > apps/web/src/lib/supabase/types.ts
```
- [ ] **Step 6:** `cd apps/web && npm run test` → still green.
- [ ] **Step 7: Commit** `git add supabase/migrations/0028_account_status.sql supabase/tests/0029_account_status_test.sql apps/web/src/lib/supabase/types.ts && git commit -m "feat(db): account_status on users for all-role suspension"`

---

## Task 2: `canSetAccountStatus` (pure)

**Files:** Create `apps/web/src/lib/admin/account-status.ts`, `apps/web/src/lib/admin/account-status.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { canSetAccountStatus } from "./account-status";

describe("canSetAccountStatus", () => {
  it("allows active → suspended and back", () => {
    expect(canSetAccountStatus("active", "suspended").ok).toBe(true);
    expect(canSetAccountStatus("suspended", "active").ok).toBe(true);
  });
  it("allows deactivate from active/suspended and reactivate", () => {
    expect(canSetAccountStatus("active", "deactivated").ok).toBe(true);
    expect(canSetAccountStatus("deactivated", "active").ok).toBe(true);
  });
  it("rejects a no-op and unknown transitions", () => {
    expect(canSetAccountStatus("active", "active").ok).toBe(false);
    expect(canSetAccountStatus("deactivated", "suspended").ok).toBe(false);
  });
});
```
- [ ] **Step 2: Run** `cd apps/web && npx vitest run src/lib/admin/account-status.test.ts` → FAIL.
- [ ] **Step 3: Implement** (`account-status.ts`)
```ts
export type AccountStatus = "active" | "suspended" | "deactivated";

const LEGAL: Record<AccountStatus, AccountStatus[]> = {
  active: ["suspended", "deactivated"],
  suspended: ["active", "deactivated"],
  deactivated: ["active"],
};

export function canSetAccountStatus(
  current: AccountStatus,
  next: AccountStatus,
): { ok: true } | { ok: false; error: string } {
  if (current === next) return { ok: false, error: `Account is already ${current}.` };
  if (!LEGAL[current].includes(next)) return { ok: false, error: `Cannot change account from ${current} to ${next}.` };
  return { ok: true };
}
```
- [ ] **Step 4: Run** `npm run test` → PASS.
- [ ] **Step 5: Commit** `git add apps/web/src/lib/admin/account-status.ts apps/web/src/lib/admin/account-status.test.ts && git commit -m "feat(app): account status transition rules"`

---

## Task 3: `status-machine` (pure professional status workflow)

**Files:** Create `apps/web/src/lib/admin/status-machine.ts`, `apps/web/src/lib/admin/status-machine.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { applyStatusAction, allowedActions } from "./status-machine";

describe("applyStatusAction", () => {
  it("suspends an active professional", () => {
    expect(applyStatusAction("active", "suspend")).toEqual({ ok: true, to: "temporarily_suspended" });
  });
  it("reinstates a suspended professional to active", () => {
    expect(applyStatusAction("temporarily_suspended", "reinstate")).toEqual({ ok: true, to: "active" });
  });
  it("rejects an illegal action for the state", () => {
    expect(applyStatusAction("active", "reinstate").ok).toBe(false);
    expect(applyStatusAction("removed", "reinstate").ok).toBe(false);
  });
  it("maps booking_restriction and remove", () => {
    expect(applyStatusAction("active", "booking_restriction")).toEqual({ ok: true, to: "booking_restricted" });
    expect(applyStatusAction("active", "remove")).toEqual({ ok: true, to: "removed" });
  });
});

describe("allowedActions", () => {
  it("returns the legal actions for a state", () => {
    expect(allowedActions("temporarily_suspended")).toContain("reinstate");
    expect(allowedActions("removed")).toEqual([]);
  });
});
```
- [ ] **Step 2: Run** `cd apps/web && npx vitest run src/lib/admin/status-machine.test.ts` → FAIL.
- [ ] **Step 3: Implement** (`status-machine.ts`)
```ts
export type ProfessionalStatus =
  | "pending_verification" | "active" | "compliance_hold" | "booking_restricted"
  | "temporarily_suspended" | "under_investigation" | "rejected" | "removed";

export type StatusActionType =
  | "suspend" | "full_suspension" | "booking_restriction" | "compliance_hold"
  | "under_investigation" | "reinstate" | "reject" | "remove";

const RESULT: Record<StatusActionType, ProfessionalStatus> = {
  suspend: "temporarily_suspended",
  full_suspension: "temporarily_suspended",
  booking_restriction: "booking_restricted",
  compliance_hold: "compliance_hold",
  under_investigation: "under_investigation",
  reinstate: "active",
  reject: "rejected",
  remove: "removed",
};

// PROPOSED default matrix — flagged for Ana's sign-off. One-file change to adjust.
const ALLOWED: Record<ProfessionalStatus, StatusActionType[]> = {
  pending_verification: ["reject", "under_investigation", "compliance_hold"],
  active: ["suspend", "full_suspension", "booking_restriction", "compliance_hold", "under_investigation", "remove"],
  compliance_hold: ["reinstate", "suspend", "under_investigation", "remove"],
  booking_restricted: ["reinstate", "suspend", "remove"],
  temporarily_suspended: ["reinstate", "under_investigation", "remove"],
  under_investigation: ["reinstate", "suspend", "reject", "remove"],
  rejected: [],
  removed: [],
};

export function allowedActions(from: ProfessionalStatus): StatusActionType[] {
  return ALLOWED[from];
}

export function applyStatusAction(
  from: ProfessionalStatus,
  action: StatusActionType,
): { ok: true; to: ProfessionalStatus } | { ok: false; error: string } {
  if (!ALLOWED[from].includes(action)) return { ok: false, error: `Cannot ${action} a "${from}" professional.` };
  return { ok: true, to: RESULT[action] };
}
```
- [ ] **Step 4: Run** `npm run test` → PASS.
- [ ] **Step 5: Commit** `git add apps/web/src/lib/admin/status-machine.ts apps/web/src/lib/admin/status-machine.test.ts && git commit -m "feat(app): professional status transition matrix (proposed default)"`

---

## Task 4: `buildProfessionalFilters` (pure)

**Files:** Create `apps/web/src/lib/admin/search.ts`, `apps/web/src/lib/admin/search.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { buildProfessionalFilters } from "./search";

describe("buildProfessionalFilters", () => {
  it("drops empty/blank criteria", () => {
    expect(buildProfessionalFilters({ text: "  ", professionalStatus: "", maxTravelKm: "" })).toEqual({});
  });
  it("trims text and coerces maxTravelKm", () => {
    expect(buildProfessionalFilters({ text: " jane ", maxTravelKm: "25" })).toEqual({ text: "jane", maxTravelKm: 25 });
  });
  it("passes through enums, role, postcode, availability, docs", () => {
    expect(
      buildProfessionalFilters({
        professionalStatus: "active", complianceStatus: "approved", roleId: "r1",
        postcode: "E1 6AN ", availability: "weekends", requireValidDocs: true,
      }),
    ).toEqual({
      professionalStatus: "active", complianceStatus: "approved", roleId: "r1",
      postcode: "E1 6AN", availability: "weekends", requireValidDocs: true,
    });
  });
  it("ignores non-positive or NaN travel distance", () => {
    expect(buildProfessionalFilters({ maxTravelKm: "0" })).toEqual({});
    expect(buildProfessionalFilters({ maxTravelKm: "abc" })).toEqual({});
  });
});
```
- [ ] **Step 2: Run** `cd apps/web && npx vitest run src/lib/admin/search.test.ts` → FAIL.
- [ ] **Step 3: Implement** (`search.ts`)
```ts
export type ProfessionalFilterCriteria = {
  text?: string;
  professionalStatus?: string;
  complianceStatus?: string;
  roleId?: string;
  postcode?: string;
  maxTravelKm?: string | number;
  availability?: string;
  requireValidDocs?: boolean;
};

export type ProfessionalFilters = {
  text?: string;
  professionalStatus?: string;
  complianceStatus?: string;
  roleId?: string;
  postcode?: string;
  maxTravelKm?: number;
  availability?: string;
  requireValidDocs?: boolean;
};

export function buildProfessionalFilters(c: ProfessionalFilterCriteria): ProfessionalFilters {
  const f: ProfessionalFilters = {};
  const txt = c.text?.trim();
  if (txt) f.text = txt;
  if (c.professionalStatus) f.professionalStatus = c.professionalStatus;
  if (c.complianceStatus) f.complianceStatus = c.complianceStatus;
  if (c.roleId) f.roleId = c.roleId;
  const pc = c.postcode?.trim();
  if (pc) f.postcode = pc;
  const kmRaw = c.maxTravelKm;
  const km = kmRaw === undefined || kmRaw === "" ? NaN : Number(kmRaw);
  if (!Number.isNaN(km) && km > 0) f.maxTravelKm = km;
  if (c.availability) f.availability = c.availability;
  if (c.requireValidDocs) f.requireValidDocs = true;
  return f;
}
```
- [ ] **Step 4: Run** `npm run test` → PASS.
- [ ] **Step 5: Commit** `git add apps/web/src/lib/admin/search.ts apps/web/src/lib/admin/search.test.ts && git commit -m "feat(app): professional search filter normalization"`

---

## Task 5: `validateRateAmendment` (pure)

**Files:** Create `apps/web/src/lib/admin/rates.ts`, `apps/web/src/lib/admin/rates.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { validateRateAmendment } from "./rates";

const base = { clientChargeRate: 40, professionalPayoutRate: 28, platformFeeType: "derived" as const, platformFeeValue: null, currency: "GBP" };

describe("validateRateAmendment", () => {
  it("accepts a valid derived rate", () => {
    expect(validateRateAmendment(base).ok).toBe(true);
  });
  it("rejects charge below payout (margin)", () => {
    expect(validateRateAmendment({ ...base, clientChargeRate: 20 }).ok).toBe(false);
  });
  it("requires a fee value for fixed/percentage", () => {
    expect(validateRateAmendment({ ...base, platformFeeType: "fixed", platformFeeValue: null }).ok).toBe(false);
    expect(validateRateAmendment({ ...base, platformFeeType: "percentage", platformFeeValue: 30 }).ok).toBe(true);
  });
  it("rejects negative rates", () => {
    expect(validateRateAmendment({ ...base, professionalPayoutRate: -1, clientChargeRate: -1 }).ok).toBe(false);
  });
});
```
- [ ] **Step 2: Run** `cd apps/web && npx vitest run src/lib/admin/rates.test.ts` → FAIL.
- [ ] **Step 3: Implement** (`rates.ts`)
```ts
export type PlatformFeeType = "derived" | "percentage" | "fixed";

export type NewRate = {
  clientChargeRate: number;
  professionalPayoutRate: number;
  platformFeeType: PlatformFeeType;
  platformFeeValue: number | null;
  currency: string;
};

export function validateRateAmendment(r: NewRate): { ok: true; rate: NewRate } | { ok: false; error: string } {
  if (r.clientChargeRate < 0 || r.professionalPayoutRate < 0) return { ok: false, error: "Rates cannot be negative." };
  if (r.clientChargeRate < r.professionalPayoutRate) return { ok: false, error: "Client charge must be at least the professional payout." };
  if (r.platformFeeType !== "derived" && (r.platformFeeValue == null || r.platformFeeValue < 0)) {
    return { ok: false, error: "A non-negative fee value is required for fixed or percentage fees." };
  }
  return { ok: true, rate: r };
}
```
- [ ] **Step 4: Run** `npm run test` → PASS.
- [ ] **Step 5: Commit** `git add apps/web/src/lib/admin/rates.ts apps/web/src/lib/admin/rates.test.ts && git commit -m "feat(app): rate amendment validation"`

---

## Task 6: `amend_rate_card` SQL function + types

**Files:** Create `supabase/migrations/0029_amend_rate_card_fn.sql`, `supabase/tests/0030_amend_rate_card_test.sql`; regenerate types.

- [ ] **Step 1: Failing pgTAP** (`0030_amend_rate_card_test.sql`)
```sql
begin;
select plan(3);

insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000d0001','rn_rate','RN Rate', true) on conflict do nothing;
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, platform_fee_type, currency)
  values ('00000000-0000-0000-0000-0000000d0001', 40, 28, 'derived', 'GBP') on conflict do nothing;

select lives_ok($$ select amend_rate_card('00000000-0000-0000-0000-0000000d0001', 45, 30, 'derived', null, 'GBP', null) $$);

select is(
  (select count(*)::int from rate_cards where professional_role_id='00000000-0000-0000-0000-0000000d0001' and effective_to is null),
  1, 'exactly one active card after amend');

select throws_ok(
  $$ select amend_rate_card('00000000-0000-0000-0000-0000000d0001', 20, 30, 'derived', null, 'GBP', null) $$,
  '23514', null, 'margin constraint rejects charge below payout');

select * from finish();
rollback;
```
- [ ] **Step 2: Run** `npx supabase db reset && npx supabase test db` → FAIL (function missing).
- [ ] **Step 3: Migration** (`0029_amend_rate_card_fn.sql`)
```sql
-- Atomically close the current active card and open a new one, preserving uq_rate_card_active.
create or replace function public.amend_rate_card(
  p_role_id uuid, p_charge numeric, p_payout numeric,
  p_fee_type text, p_fee_value numeric, p_currency text, p_admin_id uuid
) returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  update rate_cards set effective_to = now()
    where professional_role_id = p_role_id and effective_to is null;
  insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate,
    platform_fee_type, platform_fee_value, currency, effective_from, created_by)
  values (p_role_id, p_charge, p_payout, p_fee_type, p_fee_value, p_currency, now(), p_admin_id)
  returning id into new_id;
  return new_id;
end; $$;

revoke all on function public.amend_rate_card(uuid,numeric,numeric,text,numeric,text,uuid) from public, anon, authenticated;
```
- [ ] **Step 4: Run** `npx supabase db reset && npx supabase test db` → PASS (the `rate_margin_ok` check raises SQLSTATE 23514 on the bad-margin call; the close+insert run in one function call so a failed insert rolls back the close).
- [ ] **Step 5: Regenerate types** (same command as Task 1 Step 5) and `cd apps/web && npm run test` → green.
- [ ] **Step 6: Commit** `git add supabase/migrations/0029_amend_rate_card_fn.sql supabase/tests/0030_amend_rate_card_test.sql apps/web/src/lib/supabase/types.ts && git commit -m "feat(db): atomic amend_rate_card function"`

---

## Task 7: `setAccountStatus` admin action

**Files:** Create `apps/web/src/lib/admin/account-actions.ts`

- [ ] **Step 1: Implement**
```ts
"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { canSetAccountStatus, type AccountStatus } from "./account-status";

export type AdminActionResult = { ok: true } | { error: string };

export async function setAccountStatus(userId: string, next: AccountStatus, reason?: string): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();

  const { data: target } = await admin
    .from("users").select("account_type, is_founder, account_status").eq("id", userId).maybeSingle();
  if (!target) return { error: "User not found." };
  if (target.account_type === "admin" || target.is_founder) return { error: "Admin accounts cannot be suspended." };

  const t = canSetAccountStatus(target.account_status as AccountStatus, next);
  if (!t.ok) return { error: t.error };

  const { error } = await admin.from("users").update({ account_status: next }).eq("id", userId);
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: `account.${next}`, entity_type: "user", entity_id: userId, summary: reason ?? null,
  });
  return { ok: true };
}
```
- [ ] **Step 2:** `cd apps/web && npm run lint` (clean) and `npm run build` (full type-check passes).
- [ ] **Step 3: Commit** `git add apps/web/src/lib/admin/account-actions.ts && git commit -m "feat(app): admin set account status (all roles, audited)"`

---

## Task 8: `applyProfessionalStatusAction` admin action

**Files:** Create `apps/web/src/lib/admin/status-actions.ts`

- [ ] **Step 1: Implement**
```ts
"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { applyStatusAction, type ProfessionalStatus, type StatusActionType } from "./status-machine";

const REASON_CODES = [
  "last_minute_cancellation","repeated_cancellations","no_show","expired_dbs","expired_training",
  "expired_registration","expired_insurance","right_to_work_concern","safeguarding_concern",
  "client_complaint","conduct_concern","missing_documents","other",
] as const;
type ReasonCode = (typeof REASON_CODES)[number];

/** Actions that change status away from active/reinstate — require a reason for audit. */
const PUNITIVE: StatusActionType[] = [
  "suspend", "full_suspension", "booking_restriction", "compliance_hold",
  "under_investigation", "reject", "remove",
];

export type StatusActionResult = { ok: true } | { error: string };

export async function applyProfessionalStatusAction(
  professionalId: string,
  action: StatusActionType,
  details: { reasonCode?: string; reasonText?: string; internalNotes?: string; reviewDate?: string },
): Promise<StatusActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  if (PUNITIVE.includes(action)) {
    if (!details.reasonCode) return { error: "A reason code is required for this action." };
    if (details.reasonCode === "other" && !details.reasonText?.trim()) {
      return { error: "Please describe the reason when selecting 'other'." };
    }
  }
  if (details.reasonCode && !REASON_CODES.includes(details.reasonCode as ReasonCode)) {
    return { error: "Invalid reason code." };
  }
  const admin = createServiceClient();

  const { data: prof } = await admin.from("professionals").select("professional_status").eq("id", professionalId).single();
  if (!prof) return { error: "Professional not found." };

  const t = applyStatusAction(prof.professional_status as ProfessionalStatus, action);
  if (!t.ok) return { error: t.error };

  const { error } = await admin.from("professionals").update({ professional_status: t.to }).eq("id", professionalId);
  if (error) return { error: error.message };

  await admin.from("professional_status_actions").insert({
    professional_id: professionalId, action_type: action,
    reason_code: (details.reasonCode as ReasonCode) ?? null,
    reason_text: details.reasonText ?? null, internal_notes: details.internalNotes ?? null,
    review_date: details.reviewDate ?? null, resulting_status: t.to, applied_by: adminId,
  });
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: `professional.${action}`,
    entity_type: "professional", entity_id: professionalId, summary: details.reasonText ?? null,
  });
  return { ok: true };
}
```
- [ ] **Step 2:** `cd apps/web && npm run lint` (clean) and `npm run build` (passes).
- [ ] **Step 3: Commit** `git add apps/web/src/lib/admin/status-actions.ts && git commit -m "feat(app): apply professional status action with reason + audit"`

---

## Task 9: `amendRateCard` admin action

**Files:** Create `apps/web/src/lib/admin/rate-actions.ts`

- [ ] **Step 1: Implement**
```ts
"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { validateRateAmendment, type NewRate } from "./rates";

export type RateActionResult = { ok: true } | { error: string };

export async function amendRateCard(roleId: string, newRates: NewRate): Promise<RateActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const v = validateRateAmendment(newRates);
  if (!v.ok) return { error: v.error };

  const admin = createServiceClient();
  const { error } = await admin.rpc("amend_rate_card", {
    p_role_id: roleId,
    p_charge: v.rate.clientChargeRate,
    p_payout: v.rate.professionalPayoutRate,
    p_fee_type: v.rate.platformFeeType,
    p_fee_value: v.rate.platformFeeValue,
    p_currency: v.rate.currency,
    p_admin_id: adminId,
  });
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({
    actor_user_id: adminId, actor_type: "admin", action: "rate_card.amended", entity_type: "professional_role", entity_id: roleId,
  });
  return { ok: true };
}
```
- [ ] **Step 2:** `cd apps/web && npm run lint` (clean) and `npm run build` (passes — confirms the regenerated types include `amend_rate_card`).
- [ ] **Step 3: Commit** `git add apps/web/src/lib/admin/rate-actions.ts && git commit -m "feat(app): admin amend rate card action"`

---

## Task 10: Enforce `account_status` at login + route guard

**Files:** Modify `apps/web/src/app/(auth)/login/page.tsx`, `apps/web/src/proxy.ts`; create `apps/web/src/app/suspended/page.tsx`

- [ ] **Step 1: Login gate** — in `login/page.tsx`, change the post-sign-in users select to `"account_type, account_status"` and, before routing, block non-active accounts:
```ts
    const { data: row } = await supabase
      .from("users")
      .select("account_type, account_status")
      .eq("id", data.user.id)
      .single();
    if (row && row.account_status !== "active") {
      await supabase.auth.signOut();
      setError("Your account is suspended. Please contact CareBridge Connect.");
      setPending(false);
      return;
    }
    router.push(roleHome((row?.account_type ?? "private_client") as AccountType));
    router.refresh();
```
- [ ] **Step 2: Route guard** — in `proxy.ts`, add `account_status` to the select and redirect non-active users to `/suspended`:
```ts
  const { data: row } = await supabase
    .from("users")
    .select("account_type, is_founder, account_status")
    .eq("id", user.id)
    .single();
  if (!row) return NextResponse.redirect(new URL("/login", request.url));
  if (row.account_status !== "active") return NextResponse.redirect(new URL("/suspended", request.url));
```
(Insert the `account_status` check immediately after the `if (!row)` line, before the role/area check. `/suspended` is not under a GUARDED prefix, so it stays reachable.)
- [ ] **Step 3: Suspended page** (`app/suspended/page.tsx`)
```tsx
export default function SuspendedPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-light">Account suspended</h1>
      <p className="mt-4 text-sm text-[#525252]">
        Your CareBridge Connect account is currently suspended or deactivated. If you believe this is
        a mistake, please contact us.
      </p>
    </main>
  );
}
```
- [ ] **Step 4: Verify** `cd apps/web && npm run lint` (clean), `npm run build` (passes). (Behavioural check in Task 15 E2E.)
- [ ] **Step 5: Commit** `git add "apps/web/src/app/(auth)/login/page.tsx" apps/web/src/proxy.ts apps/web/src/app/suspended/page.tsx && git commit -m "feat(app): enforce account suspension at login and route guard"`

---

## Task 11: Admin user list + search

**Files:** Create `apps/web/src/app/admin/users/page.tsx`, `apps/web/src/components/user-filters.tsx`

- [ ] **Step 1: Filter component** (`user-filters.tsx`, `"use client"`)
A form whose fields map to `ProfessionalFilterCriteria` (text; professionalStatus select; complianceStatus select; role select; postcode; maxTravelKm; availability; requireValidDocs checkbox). On submit, push the criteria to the URL as query params via `useRouter().push("/admin/users?...")` (so the server page re-reads `searchParams`). Reuse input/select classes from `admin-bookings.tsx`.

- [ ] **Step 2: List page** (`admin/users/page.tsx`, server component, service client)
Read `searchParams`, pass them through `buildProfessionalFilters` (from `@/lib/admin/search`), and build the query:
- base: `admin.from("professionals").select("id, full_name, professional_status, compliance_status, professional_role_id, postcode, travel_distance_km, professional_roles(name), users:user_id(email, account_status)")`.
- `text` → match **name or email** on one query: `.or(\`full_name.ilike.%${txt}%,users.email.ilike.%${txt}%\`)` (PostgREST filter on the embedded `users` join). If the builder rejects nested `or`, fallback: collect user ids with `users.email ilike`, then `.or(\`full_name.ilike.%${txt}%,user_id.in.(${ids})\`)`.
- `professionalStatus`/`complianceStatus`/`roleId` → `.eq(...)`.
- `postcode` → `.ilike("postcode", "PC%")`; `maxTravelKm` → `.gte("travel_distance_km", km)`.
- `availability` → join filter on `professional_availability` (fetch professional ids matching, then `.in`).
- `requireValidDocs` → **required in this task** (not deferred): for each role's critical `compliance_requirements`, find professionals where every required doc type has an `approved` row with `expiry_date` null or ≥ today (mirror the doc-fetch pattern in `compliance-actions.ts` / `isCompliant`). Pre-query matching professional ids, then `.in("id", ids)`.
Render a table: name, email, role, professional_status, compliance_status, account_status, with a link to `/admin/users/[id]`. Put `<UserFilters />` above it.

**Search scope (MVP):** all filter fields in `ProfessionalFilterCriteria` must work server-side in this task — no in-memory-only filters. E2E (Task 15) covers status filter; email + doc-validity behaviour is covered by unit tests + manual smoke if PostgREST nesting is awkward.

- [ ] **Step 3: Verify** `npm run lint`, `npm run build` pass.
- [ ] **Step 4: Commit** `git add apps/web/src/app/admin/users/page.tsx apps/web/src/components/user-filters.tsx && git commit -m "feat(app): admin professional list with search filters"`

---

## Task 12: Admin user detail + status/account controls

**Files:** Create `apps/web/src/app/admin/users/[id]/page.tsx`, `apps/web/src/components/status-action-form.tsx`, `apps/web/src/components/account-status-control.tsx`

- [ ] **Step 1: Status action form** (`status-action-form.tsx`, `"use client"`)
Props: `{ professionalId: string; currentStatus: ProfessionalStatus }`. Use `allowedActions(currentStatus)` (from `@/lib/admin/status-machine`) to populate the action `<select>` (only legal actions). Fields: action, reason code `<select>` (the 13 reason codes), reason text, internal notes, review date. For punitive actions (`suspend`, `full_suspension`, `booking_restriction`, `compliance_hold`, `under_investigation`, `reject`, `remove`), mark reason code **required** in the UI; when reason is `other`, require reason text — mirrors Task 8 server validation. On submit call `applyProfessionalStatusAction(professionalId, action, {...})`; show error or `router.refresh()`.

- [ ] **Step 2: Account status control** (`account-status-control.tsx`, `"use client"`)
Props: `{ userId: string; current: AccountStatus }`. Buttons/select to set `suspended`/`deactivated`/`active` per `canSetAccountStatus` legality; calls `setAccountStatus(userId, next, reason)`; error or refresh.

- [ ] **Step 3: Detail page** (`admin/users/[id]/page.tsx`, server component, service client)
Load the professional (`id, full_name, professional_status, compliance_status, professional_role_id, user_id, professional_roles(name)`), the user (`email, account_status`), and the `professional_status_actions` history (ordered `applied_at desc`). Render: profile summary; `<StatusActionForm professionalId currentStatus />`; `<AccountStatusControl userId={user_id} current={account_status} />`; the action history table (action_type, reason_code, resulting_status, applied_at); and a link to `/admin/compliance` for documents.

- [ ] **Step 4: Verify** `npm run lint`, `npm run build` pass.
- [ ] **Step 5: Commit** `git add "apps/web/src/app/admin/users/[id]/page.tsx" apps/web/src/components/status-action-form.tsx apps/web/src/components/account-status-control.tsx && git commit -m "feat(app): admin professional detail with status and account controls"`

---

## Task 13: Admin all-accounts page

**Files:** Create `apps/web/src/app/admin/accounts/page.tsx`

- [ ] **Step 1: Page** (server component, service client)
List all `users` (`id, email, account_type, account_status, is_founder`) excluding admin/founder rows from action eligibility. For each, show email, account_type, account_status, and an `<AccountStatusControl userId current />` (reused from Task 12) — except admin/founder rows show "—" (no control). Order by account_type then email. Optional `account_type` filter via `searchParams`.
- [ ] **Step 2: Verify** `npm run lint`, `npm run build` pass.
- [ ] **Step 3: Commit** `git add apps/web/src/app/admin/accounts/page.tsx && git commit -m "feat(app): admin all-accounts management page"`

---

## Task 14: Admin rate-card management page

**Files:** Create `apps/web/src/app/admin/rates/page.tsx`, `apps/web/src/components/amend-rate-form.tsx`

- [ ] **Step 1: Amend form** (`amend-rate-form.tsx`, `"use client"`)
Props: `{ roleId: string; roleName: string }`. Fields: clientChargeRate, professionalPayoutRate, platformFeeType select (derived/percentage/fixed), platformFeeValue (shown when type ≠ derived), currency (default GBP). On submit call `amendRateCard(roleId, { clientChargeRate: Number(...), professionalPayoutRate: Number(...), platformFeeType, platformFeeValue: type==='derived'?null:Number(...), currency })`; error or `router.refresh()`.
- [ ] **Step 2: Page** (`admin/rates/page.tsx`, server component, service client)
For each active role: load the current active card (`effective_to is null`) and the full history (ordered `effective_from desc`). Show current rate + history table + `<AmendRateForm roleId roleName />`.
- [ ] **Step 3: Verify** `npm run lint`, `npm run build` pass.
- [ ] **Step 4: Commit** `git add apps/web/src/app/admin/rates/page.tsx apps/web/src/components/amend-rate-form.tsx && git commit -m "feat(app): central effective-dated rate-card management"`

---

## Task 15: End-to-end admin governance

**Files:** Create `apps/web/e2e/admin-governance.spec.ts`

> Run **after Task 16** so nav links and all pages exist.

- [ ] **Step 1: Write the E2E spec** (model on `e2e/bookings.spec.ts` for admin login + service-client fixtures)
Cover:
1. **Suspend/reinstate professional:** seed an `active`+`approved` professional (so `can_accept_bookings` is true). Admin logs in, visits `/admin/users/[id]`, applies `suspend` with a reason code → assert DB `professional_status='temporarily_suspended'` and `can_accept_bookings=false` and a `professional_status_actions` row exists with non-null `reason_code`. Then `reinstate` → `active`, `can_accept_bookings=true`.
2. **Suspend a client account (login block):** seed a confirmed client user. Admin sets that user's `account_status='suspended'` (via `/admin/accounts`). In a **fresh** browser context, attempt to log in as that client → assert the login shows the suspended message and does NOT reach `/client`.
3. **Suspend a client account (guard redirect):** using the **same client session** from a prior login (before suspend), admin suspends the account. Client context (still authenticated) navigates to `/client` → assert URL is `/suspended` (proxy guard, Task 10). Confirms enforcement for existing sessions, not just new logins.
4. **Amend rate card:** seed a role with an active rate card and an existing booking carrying frozen `snap_*`. Admin amends the role's rate via `/admin/rates` → assert a new active card exists with the new values AND the existing booking's `total_client_charge`/`snap_client_charge_rate` are unchanged.
5. **Search:** seed two professionals with different statuses; visit `/admin/users?professionalStatus=temporarily_suspended` → assert only the suspended one is listed.
Clean up created auth users/rows at the end.
- [ ] **Step 2: Run** repo root `npx supabase db reset`; kill stale port 3000; `cd apps/web && npm run e2e` → all pass.
- [ ] **Step 3: Commit** `git add apps/web/e2e/admin-governance.spec.ts && git commit -m "test(app): admin governance E2E (suspension, account status, rate amend, search)"`

---

## Task 16: Admin navigation (dashboard + nav)

**Files:** Modify `apps/web/src/app/admin/page.tsx`, `apps/web/src/lib/auth/role-nav.ts`

> Run **after Task 14**, **before Task 15** (E2E).

Spec §3 requires cross-links so new governance pages are discoverable. S3a added Finance pages but neither the dashboard nor `ROLE_NAV` lists them yet — wire everything in one pass.

- [ ] **Step 1: Dashboard cards** — extend `DashboardGrid` on `admin/page.tsx` with cards for:
  - **Users** → `/admin/users` — search and manage professionals.
  - **All accounts** → `/admin/accounts` — suspend/deactivate any role.
  - **Rate cards** → `/admin/rates` — effective-dated rate amendments.
  - **Finance** → `/admin/finance` — transactions and revenue (shipped in S3a).
  Keep existing Compliance and Bookings cards.

- [ ] **Step 2: Role nav** — add matching entries to `ROLE_NAV.admin` in `role-nav.ts`: Users, Accounts, Rates, Finance (after Bookings or grouped logically). Keep existing Dashboard, Compliance, Bookings.

- [ ] **Step 3: Verify** `npm run lint`, `npm run build` pass.
- [ ] **Step 4: Commit** `git add apps/web/src/app/admin/page.tsx apps/web/src/lib/auth/role-nav.ts && git commit -m "feat(app): admin nav links for governance and finance pages"`

---

## Final verification

- [ ] `cd apps/web && npm run test` → all Vitest pass (new: account-status, status-machine, search, rates).
- [ ] repo root `npx supabase db reset && npx supabase test db` → all pgTAP pass (incl. 0029/0030).
- [ ] `cd apps/web && npm run e2e` → all Playwright pass.
- [ ] `cd apps/web && npm run lint && npm run build` → clean.

## Acceptance (from spec)

Admins suspend/reinstate/deactivate any account (enforced at **login and route guard**, including active sessions); apply the full professional status workflow with **mandatory reason codes on punitive actions** + audit trail (non-active auto-blocks bookings); search/filter professionals across all criteria (name, email, status, role, location, availability, doc validity); amend effective-dated rate cards atomically without altering past bookings — all audited. Governance pages reachable from admin dashboard and nav (Task 16).

## Notes / open checks for the implementer

- The professional status FROM-matrix in `status-machine.ts` is a PROPOSED default — flagged for Ana; keep it isolated in that one module. Do not ship to production until Ana signs off (logic can ship behind admin-only UI in dev/staging).
- **Punitive actions** (`suspend`, `full_suspension`, `booking_restriction`, `compliance_hold`, `under_investigation`, `reject`, `remove`) require `reasonCode`; `other` also requires `reasonText` (Task 8 + form validation in Task 12).
- Run `npm run build` (full type-check) before declaring each action/page task done — `npm run lint` alone did NOT catch type errors in S3a.
- Regenerate `types.ts` after the 0028 and 0029 migrations (Tasks 1 and 6) or typed `.from("users")`/`.rpc("amend_rate_card")` calls will fail the build.
- `requireAdmin` reads `users.account_type`/`is_founder`; an admin whose own `account_status` were ever non-active would be guard-redirected — but `setAccountStatus` refuses to suspend admin/founder accounts, so this can't happen via the UI.
- Login (Task 10) shows one message for both `suspended` and `deactivated`; `/suspended` page copy covers both — intentional for MVP.
- `amend_rate_card` concurrent calls: a losing transaction fails on `uq_rate_card_active` or `rate_margin_ok` — no retry needed; surface the error to the admin.
- Confirm `professional_status_actions` accepts the columns used (`action_type, reason_code, reason_text, internal_notes, review_date, resulting_status, applied_by`) — verified against migration 0007.
