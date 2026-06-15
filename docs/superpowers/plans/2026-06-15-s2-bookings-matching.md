# S2 — Bookings & Combination Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build client/organisation registration and the combination booking model (open-market self-accept + admin direct-assign) for single-shift bookings, with DB-enforced eligibility and single-accept concurrency, persisted declines, cancellations with a last-minute flag, templated notifications, and a Stripe-customer stub.

**Architecture:** Pure domain logic in `src/lib/*` (unit-tested without React/Supabase): rate snapshot, booking-insert builder, a formal booking **state machine** (`transitions.ts`), eligibility check, account schemas, and a notification renderer. Server actions orchestrate privileged writes via the **service client** (clients/orgs/rate_cards and booking child tables are admin-only under RLS — same pattern as S1). Booking **reads** use the RLS-backed regular client; booking **mutations** must go through server actions — migration `0025` tightens `bookings_requester` from `FOR ALL` to `SELECT` only so requesters cannot bypass actions by writing directly with the anon client. The DB is the backstop for two invariants: an **eligibility trigger** and a **conditional update** for accept concurrency.

**Tech Stack:** Next.js 16 server actions + client components (`useActionState`), Supabase (ssr + service clients), Zod, Vitest, pgTAP, Playwright. Notifications: Resend (prod, via `fetch`) + a record-only dev sender. Stripe customer creation is stubbed (real SDK in S3).

**Spec:** [docs/superpowers/specs/2026-06-15-s2-bookings-matching-design.md](../specs/2026-06-15-s2-bookings-matching-design.md)

**Deviation from spec:** the dev notification channel is record-only (no local SMTP→Mailpit) to avoid a nodemailer dependency and `config.toml` changes; the `notifications` table is the durable record that tests assert on. Prod (Resend) is unchanged.

---

## Conventions

- Run loops: `cd apps/web && npm run test` (Vitest); from repo root `npx supabase db reset && npx supabase test db` (pgTAP); `cd apps/web && npm run e2e` (Playwright).
- E2E needs local Supabase + local creds; pass them inline (process env overrides `.env.local` which points to hosted). Kill any stale listener on port 3000 first. See [the engagement memory] for the exact command.
- New DB migrations continue from `0021`: next are `0022`–`0025`. New pgTAP test files continue from `0022_service_role_grants_test.sql`: next are `0023`–`0026`.
- Supabase clients: `import { createClient } from "@/lib/supabase/server"` (RLS reads), `import { createServiceClient } from "@/lib/supabase/service"` (privileged writes).
- Commit after every task.

## File structure

```
src/lib/payments/stripe.ts                      # createCustomer stub (+ test)
src/lib/auth/admin.ts                           # requireAdmin (shared with compliance-actions)
src/lib/validation/accounts.ts                  # clientSchema, organisationSchema (+ test)
src/lib/validation/bookings.ts                  # createBookingSchema (+ test)
src/lib/rates/snapshot.ts                        # buildSnapshot (+ test)
src/lib/bookings/create.ts                       # buildBookingInsert, hoursBetween (+ test)
src/lib/bookings/transitions.ts                  # state machine: applyTransition (+ test)
src/lib/bookings/eligibility.ts                  # canAccept (+ test)
src/lib/notifications/send.ts                     # renderTemplate (+ test), sendNotification, senders
src/lib/accounts/actions.ts                      # saveClientProfile, saveOrganisationProfile
src/lib/bookings/actions.ts                      # create/accept/decline/assign/cancel booking
src/app/client/register/page.tsx                 src/app/organisation/register/page.tsx
src/app/client/bookings/{page,new/page}.tsx      src/app/organisation/bookings/{page,new/page}.tsx
src/app/professional/bookings/page.tsx
src/app/admin/bookings/page.tsx
src/components/booking-request-form.tsx          # shared client form (client + org)
src/components/account-register-form.tsx         # shared-ish register forms
src/components/professional-bookings.tsx         # open/assigned/history + accept/decline
src/components/admin-bookings.tsx                # list + assign + cancel
supabase/migrations/0022_booking_eligibility_trigger.sql
supabase/migrations/0023_booking_declines.sql
supabase/migrations/0024_booking_cancellation_template.sql
supabase/migrations/0025_bookings_requester_select_only.sql
supabase/tests/0023_booking_eligibility_test.sql
supabase/tests/0024_booking_declines_test.sql
supabase/tests/0025_booking_seed_test.sql
supabase/tests/0026_booking_accept_concurrency_test.sql
e2e/bookings.spec.ts
```

---

## Task 1: Stripe customer stub

**Files:**
- Create: `apps/web/src/lib/payments/stripe.ts`
- Test: `apps/web/src/lib/payments/stripe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createCustomer } from "./stripe";

describe("createCustomer (S2 stub)", () => {
  it("returns a stub customer id", async () => {
    const c = await createCustomer({ email: "a@b.co", name: "Acme" });
    expect(c.id).toMatch(/^cus_stub_/);
  });
  it("returns unique ids", async () => {
    const a = await createCustomer({ name: "A" });
    const b = await createCustomer({ name: "B" });
    expect(a.id).not.toBe(b.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/payments/stripe.test.ts`
Expected: FAIL — cannot find module `./stripe`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { randomUUID } from "crypto";

export type StripeCustomer = { id: string };

/**
 * S2 stub: returns a placeholder customer id with no network call.
 * S3 replaces the body with the real Stripe SDK call behind this same signature.
 */
export async function createCustomer(_params: {
  email?: string | null;
  name: string;
}): Promise<StripeCustomer> {
  return { id: `cus_stub_${randomUUID()}` };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/payments/stripe.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/payments/stripe.ts apps/web/src/lib/payments/stripe.test.ts
git commit -m "feat(app): Stripe customer stub for S2 (real SDK in S3)"
```

---

## Task 2: Account validation schemas

**Files:**
- Create: `apps/web/src/lib/validation/accounts.ts`
- Test: `apps/web/src/lib/validation/accounts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { clientSchema, organisationSchema } from "./accounts";

describe("clientSchema", () => {
  it("requires a full name", () => {
    expect(clientSchema.safeParse({}).success).toBe(false);
  });
  it("accepts a minimal client", () => {
    expect(clientSchema.safeParse({ fullName: "Jane Doe" }).success).toBe(true);
  });
  it("rejects a malformed contact email", () => {
    expect(clientSchema.safeParse({ fullName: "Jane", emailContact: "nope" }).success).toBe(false);
  });
});

describe("organisationSchema", () => {
  it("requires name and contact person", () => {
    expect(organisationSchema.safeParse({ organisationName: "Acme" }).success).toBe(false);
    expect(organisationSchema.safeParse({ contactPerson: "Jo" }).success).toBe(false);
  });
  it("accepts name + contact, CQC optional", () => {
    expect(organisationSchema.safeParse({ organisationName: "Acme", contactPerson: "Jo" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/validation/accounts.test.ts`
Expected: FAIL — cannot find module `./accounts`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { z } from "zod";

export const clientSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  emailContact: z.string().email().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const organisationSchema = z.object({
  organisationName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().optional(),
  emailContact: z.string().email().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  cqcRegistrationNumber: z.string().optional(),
  billingEmail: z.string().email().optional(),
  billingAddress: z.string().optional(),
});
export type OrganisationInput = z.infer<typeof organisationSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/validation/accounts.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/validation/accounts.ts apps/web/src/lib/validation/accounts.test.ts
git commit -m "feat(app): client and organisation profile validation schemas"
```

---

## Task 3: Rate-card snapshot builder

**Files:**
- Create: `apps/web/src/lib/rates/snapshot.ts`
- Test: `apps/web/src/lib/rates/snapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildSnapshot } from "./snapshot";

const base = {
  id: "rc1",
  client_charge_rate: 40,
  professional_payout_rate: 28,
  currency: "GBP",
} as const;

describe("buildSnapshot", () => {
  it("derives platform fee (charge - payout)", () => {
    const s = buildSnapshot({ ...base, platform_fee_type: "derived", platform_fee_value: null });
    expect(s).toMatchObject({
      rate_card_id: "rc1",
      snap_client_charge_rate: 40,
      snap_payout_rate: 28,
      snap_platform_fee: 12,
      snap_currency: "GBP",
    });
  });
  it("uses an explicit fixed fee", () => {
    const s = buildSnapshot({ ...base, platform_fee_type: "fixed", platform_fee_value: 5 });
    expect(s.snap_platform_fee).toBe(5);
  });
  it("computes a percentage fee", () => {
    const s = buildSnapshot({ ...base, platform_fee_type: "percentage", platform_fee_value: 30 });
    expect(s.snap_platform_fee).toBe(12); // 40 * 30 / 100
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/rates/snapshot.test.ts`
Expected: FAIL — cannot find module `./snapshot`.

- [ ] **Step 3: Write minimal implementation**

```ts
export type RateCard = {
  id: string;
  client_charge_rate: number;
  professional_payout_rate: number;
  platform_fee_type: "derived" | "percentage" | "fixed";
  platform_fee_value: number | null;
  currency: string;
};

export type RateSnapshot = {
  rate_card_id: string;
  snap_client_charge_rate: number;
  snap_payout_rate: number;
  snap_platform_fee: number;
  snap_currency: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildSnapshot(rc: RateCard): RateSnapshot {
  let fee: number;
  switch (rc.platform_fee_type) {
    case "fixed":
      fee = rc.platform_fee_value ?? 0;
      break;
    case "percentage":
      fee = round2((rc.client_charge_rate * (rc.platform_fee_value ?? 0)) / 100);
      break;
    case "derived":
    default:
      fee = round2(rc.client_charge_rate - rc.professional_payout_rate);
  }
  return {
    rate_card_id: rc.id,
    snap_client_charge_rate: rc.client_charge_rate,
    snap_payout_rate: rc.professional_payout_rate,
    snap_platform_fee: fee,
    snap_currency: rc.currency,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/rates/snapshot.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/rates/snapshot.ts apps/web/src/lib/rates/snapshot.test.ts
git commit -m "feat(app): rate-card snapshot builder"
```

---

## Task 4: Booking-insert builder

**Files:**
- Create: `apps/web/src/lib/bookings/create.ts`
- Test: `apps/web/src/lib/bookings/create.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildBookingInsert, hoursBetween } from "./create";
import type { RateCard } from "@/lib/rates/snapshot";

const rc: RateCard = {
  id: "rc1",
  client_charge_rate: 40,
  professional_payout_rate: 28,
  platform_fee_type: "derived",
  platform_fee_value: null,
  currency: "GBP",
};

const input = {
  requesterUserId: "u1",
  privateClientId: "c1",
  organisationId: null,
  professionalRoleId: "role1",
  scheduledStart: "2026-07-01T09:00:00.000Z",
  scheduledEnd: "2026-07-01T17:00:00.000Z",
  locationAddress: "1 Test St",
  locationPostcode: "E1 6AN",
  notes: null,
};

describe("hoursBetween", () => {
  it("computes fractional hours", () => {
    expect(hoursBetween("2026-07-01T09:00:00Z", "2026-07-01T12:30:00Z")).toBe(3.5);
  });
});

describe("buildBookingInsert", () => {
  it("builds an open open-market booking with snapshot and duration", () => {
    const b = buildBookingInsert(input, rc);
    expect(b).toMatchObject({
      requester_user_id: "u1",
      private_client_id: "c1",
      organisation_id: null,
      professional_role_id: "role1",
      rate_card_id: "rc1",
      duration_hours: 8,
      snap_client_charge_rate: 40,
      snap_payout_rate: 28,
      snap_platform_fee: 12,
      booking_type: "open_market",
      status: "open",
    });
  });
  it("requires exactly one of client/org", () => {
    expect(() => buildBookingInsert({ ...input, organisationId: "o1" }, rc)).toThrow();
    expect(() => buildBookingInsert({ ...input, privateClientId: null, organisationId: null }, rc)).toThrow();
  });
  it("rejects a non-positive window", () => {
    expect(() => buildBookingInsert({ ...input, scheduledEnd: input.scheduledStart }, rc)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/bookings/create.test.ts`
Expected: FAIL — cannot find module `./create`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { buildSnapshot, type RateCard, type RateSnapshot } from "@/lib/rates/snapshot";

export type CreateBookingInput = {
  requesterUserId: string;
  privateClientId?: string | null;
  organisationId?: string | null;
  professionalRoleId: string;
  scheduledStart: string;
  scheduledEnd: string;
  locationAddress: string;
  locationPostcode?: string | null;
  notes?: string | null;
};

export type BookingInsert = RateSnapshot & {
  requester_user_id: string;
  private_client_id: string | null;
  organisation_id: string | null;
  professional_role_id: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_hours: number;
  location_address: string;
  location_postcode: string | null;
  notes: string | null;
  booking_type: "open_market";
  status: "open";
};

export function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.round((ms / 3_600_000) * 100) / 100;
}

export function buildBookingInsert(input: CreateBookingInput, rateCard: RateCard): BookingInsert {
  const hasClient = !!input.privateClientId;
  const hasOrg = !!input.organisationId;
  if (hasClient === hasOrg) {
    throw new Error("Exactly one of privateClientId or organisationId is required.");
  }
  const duration = hoursBetween(input.scheduledStart, input.scheduledEnd);
  if (duration <= 0) throw new Error("scheduled_end must be after scheduled_start.");

  return {
    ...buildSnapshot(rateCard),
    requester_user_id: input.requesterUserId,
    private_client_id: input.privateClientId ?? null,
    organisation_id: input.organisationId ?? null,
    professional_role_id: input.professionalRoleId,
    scheduled_start: input.scheduledStart,
    scheduled_end: input.scheduledEnd,
    duration_hours: duration,
    location_address: input.locationAddress,
    location_postcode: input.locationPostcode ?? null,
    notes: input.notes ?? null,
    booking_type: "open_market",
    status: "open",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/bookings/create.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/bookings/create.ts apps/web/src/lib/bookings/create.test.ts
git commit -m "feat(app): booking-insert builder with rate snapshot"
```

---

## Task 5: Booking state machine

**Files:**
- Create: `apps/web/src/lib/bookings/transitions.ts`
- Test: `apps/web/src/lib/bookings/transitions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { applyTransition } from "./transitions";

describe("applyTransition", () => {
  it("professional accepts an open booking", () => {
    expect(applyTransition("open", "accept", "professional")).toEqual({ ok: true, to: "accepted" });
  });
  it("admin assigns an open booking", () => {
    expect(applyTransition("open", "assign", "admin")).toEqual({ ok: true, to: "assigned" });
  });
  it("client cancels an accepted booking", () => {
    expect(applyTransition("accepted", "cancel", "client")).toEqual({ ok: true, to: "cancelled" });
  });
  it("rejects a professional accepting an already-accepted booking", () => {
    const r = applyTransition("accepted", "accept", "professional");
    expect(r.ok).toBe(false);
  });
  it("rejects a client assigning", () => {
    expect(applyTransition("open", "assign", "client").ok).toBe(false);
  });
  it("rejects cancelling a cancelled booking", () => {
    expect(applyTransition("cancelled", "cancel", "admin").ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/bookings/transitions.test.ts`
Expected: FAIL — cannot find module `./transitions`.

- [ ] **Step 3: Write minimal implementation**

```ts
export type BookingStatus =
  | "open" | "assigned" | "accepted" | "confirmed"
  | "in_progress" | "completed" | "cancelled" | "no_show";

export type BookingAction =
  | "accept" | "decline" | "assign" | "cancel"
  | "confirm" | "start" | "complete" | "no_show";

export type Actor = "professional" | "client" | "organisation" | "admin";

type Rule = { from: BookingStatus; action: BookingAction; actors: Actor[]; to: BookingStatus };

// Single source of truth. S2 wires: accept, decline, assign, cancel.
// The confirm/start/complete/no_show edges are defined for S3 (not yet exposed in UI).
const RULES: Rule[] = [
  { from: "open", action: "accept", actors: ["professional"], to: "accepted" },
  { from: "open", action: "decline", actors: ["professional"], to: "open" },
  { from: "open", action: "assign", actors: ["admin"], to: "assigned" },
  { from: "open", action: "cancel", actors: ["client", "organisation", "admin"], to: "cancelled" },
  { from: "accepted", action: "cancel", actors: ["client", "organisation", "professional", "admin"], to: "cancelled" },
  { from: "assigned", action: "cancel", actors: ["client", "organisation", "professional", "admin"], to: "cancelled" },
  // --- S3 (defined, not wired in S2 UI) ---
  { from: "assigned", action: "confirm", actors: ["professional"], to: "confirmed" },
  { from: "accepted", action: "start", actors: ["admin", "professional"], to: "in_progress" },
  { from: "confirmed", action: "start", actors: ["admin", "professional"], to: "in_progress" },
  { from: "in_progress", action: "complete", actors: ["admin", "professional"], to: "completed" },
  { from: "accepted", action: "no_show", actors: ["admin"], to: "no_show" },
  { from: "assigned", action: "no_show", actors: ["admin"], to: "no_show" },
];

export type TransitionResult = { ok: true; to: BookingStatus } | { ok: false; error: string };

export function applyTransition(from: BookingStatus, action: BookingAction, actor: Actor): TransitionResult {
  const rule = RULES.find((r) => r.from === from && r.action === action && r.actors.includes(actor));
  if (!rule) return { ok: false, error: `Illegal transition: ${actor} cannot ${action} a "${from}" booking.` };
  return { ok: true, to: rule.to };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/bookings/transitions.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/bookings/transitions.ts apps/web/src/lib/bookings/transitions.test.ts
git commit -m "feat(app): booking state machine (legal-transition table)"
```

---

## Task 6: Booking eligibility check (UI-facing mirror of the trigger)

**Files:**
- Create: `apps/web/src/lib/bookings/eligibility.ts`
- Test: `apps/web/src/lib/bookings/eligibility.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { canAccept } from "./eligibility";

describe("canAccept", () => {
  it("allows an eligible, role-matched professional", () => {
    expect(canAccept({ canAcceptBookings: true, professionalRoleId: "r1" }, "r1")).toEqual({ ok: true });
  });
  it("blocks an ineligible professional", () => {
    expect(canAccept({ canAcceptBookings: false, professionalRoleId: "r1" }, "r1").ok).toBe(false);
  });
  it("blocks a role mismatch", () => {
    expect(canAccept({ canAcceptBookings: true, professionalRoleId: "r2" }, "r1").ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/bookings/eligibility.test.ts`
Expected: FAIL — cannot find module `./eligibility`.

- [ ] **Step 3: Write minimal implementation**

```ts
export type EligibilityCheck = { canAcceptBookings: boolean; professionalRoleId: string | null };

export function canAccept(
  prof: EligibilityCheck,
  bookingRoleId: string,
): { ok: true } | { ok: false; reason: string } {
  if (!prof.canAcceptBookings) {
    return { ok: false, reason: "You are not currently eligible to accept bookings." };
  }
  if (prof.professionalRoleId !== bookingRoleId) {
    return { ok: false, reason: "This booking is for a different professional role." };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/bookings/eligibility.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/bookings/eligibility.ts apps/web/src/lib/bookings/eligibility.test.ts
git commit -m "feat(app): booking eligibility check (UI mirror of DB trigger)"
```

---

## Task 7: Notification renderer + adapter

**Files:**
- Create: `apps/web/src/lib/notifications/send.ts`
- Test: `apps/web/src/lib/notifications/send.test.ts`

- [ ] **Step 1: Write the failing tests** (renderer + sendNotification with injected sender)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderTemplate, sendNotification, type ChannelSender } from "./send";

describe("renderTemplate", () => {
  it("substitutes {{vars}} in subject and body", () => {
    const out = renderTemplate(
      { subject: "Booking {{id}}", body: "Hi {{name}}, booking {{id}} is confirmed." },
      { id: "abc", name: "Jo" },
    );
    expect(out).toEqual({ subject: "Booking abc", body: "Hi Jo, booking abc is confirmed." });
  });
  it("replaces unknown vars with empty string", () => {
    expect(renderTemplate({ subject: "{{x}}", body: "" }, {})).toEqual({ subject: "", body: "" });
  });
});

const mockAdmin = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => mockAdmin,
}));

describe("sendNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin.from.mockImplementation((table: string) => {
      if (table === "notification_templates") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { subject: "Hi {{name}}", body: "Booking {{id}}" } }),
            }),
          }),
        };
      }
      if (table === "notifications") {
        let insertedId = "n1";
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: insertedId } }),
            }),
          }),
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { email: "a@b.co" } }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it("marks notification sent when sender succeeds", async () => {
    const sender: ChannelSender = vi.fn().mockResolvedValue(undefined);
    await sendNotification("booking_confirmation", "user1", { id: "b1", name: "Jo" }, sender);
    expect(sender).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.co", subject: "Hi Jo", body: "Booking b1" }),
    );
  });

  it("marks notification failed when sender throws", async () => {
    const sender: ChannelSender = vi.fn().mockRejectedValue(new Error("smtp down"));
    await expect(
      sendNotification("booking_confirmation", "user1", { id: "b1", name: "Jo" }, sender),
    ).resolves.toBeUndefined(); // best-effort: never throws to caller
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/notifications/send.test.ts`
Expected: FAIL — cannot find module `./send`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { createServiceClient } from "@/lib/supabase/service";

export type NotificationType =
  | "booking_request" | "booking_confirmation" | "booking_cancellation"
  | "assessment_result" | "compliance_approval";

export type ChannelSender = (msg: { to: string; subject: string; body: string }) => Promise<void>;

/** Pure: substitute {{var}} tokens. */
export function renderTemplate(
  tpl: { subject: string; body: string },
  payload: Record<string, string | number>,
): { subject: string; body: string } {
  const sub = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(payload[k] ?? ""));
  return { subject: sub(tpl.subject), body: sub(tpl.body) };
}

/** Prod sender via Resend HTTP API (no SDK dependency). */
export const resendSender: ChannelSender = async (msg) => {
  const key = process.env.RESEND_API_KEY!;
  const from = process.env.RESEND_FROM ?? "CareBridge Connect <noreply@carebridge.example>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.body }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
};

/** Dev/default: the notifications row is the durable record; no external email. */
export const recordOnlySender: ChannelSender = async () => {};

export function defaultSender(): ChannelSender {
  return process.env.RESEND_API_KEY ? resendSender : recordOnlySender;
}

/**
 * Render the template for `type`, insert a notifications row, attempt delivery,
 * and mark the row sent/failed. Best-effort: never throws to the caller.
 */
export async function sendNotification(
  type: NotificationType,
  recipientUserId: string,
  payload: Record<string, string | number>,
  sender: ChannelSender = defaultSender(),
): Promise<void> {
  const admin = createServiceClient();
  try {
    const { data: tpl } = await admin
      .from("notification_templates")
      .select("subject, body")
      .eq("type", type)
      .single();
    if (!tpl) return;

    const { subject, body } = renderTemplate(tpl, payload);
    const { data: row } = await admin
      .from("notifications")
      .insert({ recipient_user_id: recipientUserId, type, payload, status: "queued" })
      .select("id")
      .single();

    const { data: u } = await admin.from("users").select("email").eq("id", recipientUserId).maybeSingle();
    try {
      if (u?.email) await sender({ to: u.email, subject, body });
      if (row) await admin.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
    } catch {
      if (row) await admin.from("notifications").update({ status: "failed" }).eq("id", row.id);
    }
  } catch {
    // Notifications must never break a booking action.
  }
}
```

> Note: confirm `users` has an `email` column (it mirrors `auth.users`). If not, fetch via `admin.auth.admin.getUserById(recipientUserId)` instead.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/notifications/send.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/notifications/send.ts apps/web/src/lib/notifications/send.test.ts
git commit -m "feat(app): notification renderer + Resend/record-only adapter"
```

---

## Task 8: DB — booking eligibility trigger

**Files:**
- Create: `supabase/migrations/0022_booking_eligibility_trigger.sql`
- Create: `supabase/tests/0023_booking_eligibility_test.sql`

- [ ] **Step 1: Write the failing pgTAP test**

```sql
begin;
select plan(4);

-- Fixtures: a role, an active+approved professional (eligible), and a pending one (ineligible).
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000b0001','rn_test','RN Test', true) on conflict do nothing;

insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000b0002','hca_test','HCA Test', true) on conflict do nothing;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000b0010','elig@test.dev'),
  ('00000000-0000-0000-0000-0000000b0011','inelig@test.dev'),
  ('00000000-0000-0000-0000-0000000b0012','wrongrole@test.dev') on conflict do nothing;

insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values
  ('00000000-0000-0000-0000-0000000b0020','00000000-0000-0000-0000-0000000b0010','Elig Pro','00000000-0000-0000-0000-0000000b0001','active','approved'),
  ('00000000-0000-0000-0000-0000000b0021','00000000-0000-0000-0000-0000000b0011','Inelig Pro','00000000-0000-0000-0000-0000000b0001','pending_verification','pending_review'),
  ('00000000-0000-0000-0000-0000000b0022','00000000-0000-0000-0000-0000000b0012','Wrong Role Pro','00000000-0000-0000-0000-0000000b0002','active','approved')
  on conflict do nothing;

insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000b0030','00000000-0000-0000-0000-0000000b0010','Client') on conflict do nothing;

-- An open booking (no assignee → trigger is a no-op on insert).
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
  values ('00000000-0000-0000-0000-0000000b0040','00000000-0000-0000-0000-0000000b0010',
  '00000000-0000-0000-0000-0000000b0030','00000000-0000-0000-0000-0000000b0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12)
  on conflict do nothing;

-- Assigning an ineligible professional must raise.
select throws_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000b0021'
     where id='00000000-0000-0000-0000-0000000b0040' $$,
  'professional not eligible to accept bookings');

-- Assigning an eligible professional must succeed (can_accept_bookings is derived from active+approved).
select lives_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000b0020'
     where id='00000000-0000-0000-0000-0000000b0040' $$);

-- Role mismatch must raise even when the professional is otherwise eligible.
update bookings set assigned_professional_id = null where id = '00000000-0000-0000-0000-0000000b0040';
select throws_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000b0022'
     where id='00000000-0000-0000-0000-0000000b0040' $$,
  'professional role does not match booking');

select * from finish();
rollback;
```

> Check how `can_accept_bookings` is computed (generated column or trigger from `professional_status`/`compliance_status`) in the DB-layer migrations; the fixtures above assume `active` + `approved` ⇒ `true`. Adjust the fixture statuses if the rule differs.

- [ ] **Step 2: Run test to verify it fails**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: the new test FAILs (trigger does not exist yet, so the ineligible update does not raise).

- [ ] **Step 3: Write the migration**

```sql
-- Hard backstop: a professional may only be assigned to a booking if they can accept
-- bookings and their role matches. App logic mirrors this for friendly errors.
create or replace function public.enforce_booking_eligibility() returns trigger
language plpgsql as $$
declare ok boolean; rmatch boolean;
begin
  if new.assigned_professional_id is null then return new; end if;
  select can_accept_bookings, (professional_role_id = new.professional_role_id)
    into ok, rmatch
    from professionals where id = new.assigned_professional_id;
  if not coalesce(ok, false) then
    raise exception 'professional not eligible to accept bookings';
  end if;
  if not coalesce(rmatch, false) then
    raise exception 'professional role does not match booking';
  end if;
  return new;
end; $$;

create trigger trg_booking_eligibility
  before insert or update of assigned_professional_id on bookings
  for each row execute function public.enforce_booking_eligibility();
```

- [ ] **Step 4: Run test to verify it passes**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: all pgTAP files PASS, including `0023_booking_eligibility_test`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0022_booking_eligibility_trigger.sql supabase/tests/0023_booking_eligibility_test.sql
git commit -m "feat(db): enforce booking eligibility at assignment"
```

---

## Task 9: DB — booking_declines table

**Files:**
- Create: `supabase/migrations/0023_booking_declines.sql`
- Create: `supabase/tests/0024_booking_declines_test.sql`

- [ ] **Step 1: Write the failing pgTAP test**

```sql
begin;
select plan(4);

select has_table('booking_declines');
select ok(
  (select count(*) from pg_policies where schemaname='public' and tablename='booking_declines') >= 2,
  'booking_declines has RLS policies');
select col_is_unique('booking_declines', array['booking_id','professional_id']);

-- RLS isolation: pro A cannot read pro B's decline row.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000d0010','proa@test.dev'),
  ('00000000-0000-0000-0000-0000000d0011','prob@test.dev') on conflict do nothing;
insert into users (id, email, account_type) values
  ('00000000-0000-0000-0000-0000000d0010','proa@test.dev','professional'),
  ('00000000-0000-0000-0000-0000000d0011','prob@test.dev','professional') on conflict do nothing;
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000d0001','rn_d','RN D', true) on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values
  ('00000000-0000-0000-0000-0000000d0020','00000000-0000-0000-0000-0000000d0010','Pro A','00000000-0000-0000-0000-0000000d0001','active','approved'),
  ('00000000-0000-0000-0000-0000000d0021','00000000-0000-0000-0000-0000000d0011','Pro B','00000000-0000-0000-0000-0000000d0001','active','approved')
  on conflict do nothing;
insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000d0030','00000000-0000-0000-0000-0000000d0010','Client') on conflict do nothing;
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
  values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0010',
  '00000000-0000-0000-0000-0000000d0030','00000000-0000-0000-0000-0000000d0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12)
  on conflict do nothing;
insert into booking_declines (booking_id, professional_id)
  values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0020');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000d0011')::text, true);

select is(
  (select count(*)::int from booking_declines where professional_id = '00000000-0000-0000-0000-0000000d0020'),
  0,
  'professional B cannot see professional A decline row');

select * from finish();
rollback;
```

- [ ] **Step 2: Run test to verify it fails**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: FAIL — relation `booking_declines` does not exist.

- [ ] **Step 3: Write the migration**

```sql
create table booking_declines (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  reason          text,
  declined_at     timestamptz not null default now(),
  unique (booking_id, professional_id)
);
create index idx_booking_declines_prof on booking_declines(professional_id);

alter table booking_declines enable row level security;

create policy booking_declines_admin_all on booking_declines for all
  using (public.is_admin()) with check (public.is_admin());

create policy booking_declines_self on booking_declines for all
  using (professional_id in (select id from professionals where user_id = auth.uid()))
  with check (professional_id in (select id from professionals where user_id = auth.uid()));
```

- [ ] **Step 4: Run test to verify it passes**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0023_booking_declines.sql supabase/tests/0024_booking_declines_test.sql
git commit -m "feat(db): booking_declines table with owner/admin RLS"
```

---

## Task 10: DB — cancellation template + rate-card seed

**Files:**
- Create: `supabase/migrations/0024_booking_cancellation_template.sql`
- Modify: `supabase/seed.sql` (append rate cards)
- Create: `supabase/tests/0025_booking_seed_test.sql`

- [ ] **Step 1: Write the failing pgTAP test**

```sql
begin;
select plan(2);
select ok(
  (select count(*) from notification_templates where type='booking_cancellation') = 1,
  'booking_cancellation template seeded');
select ok(
  (select count(*) from rate_cards where effective_to is null) >=
  (select count(*) from professional_roles where is_active),
  'an active rate card exists for each active role');
select * from finish();
rollback;
```

- [ ] **Step 2: Run test to verify it fails**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: FAIL — template missing and no rate cards seeded.

- [ ] **Step 3a: Write the migration** (`0024_booking_cancellation_template.sql`)

```sql
-- Add the booking_cancellation template type, then seed the template row.
alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','password_reset'));

insert into notification_templates (type, subject, body) values
  ('booking_cancellation','Booking cancelled','A booking ({{booking_id}}) has been cancelled.')
on conflict (type) do nothing;
```

> If `drop constraint notification_templates_type_check` errors with "does not exist", find the real name via `select conname from pg_constraint where conrelid='notification_templates'::regclass and contype='c';` and substitute it.

- [ ] **Step 3b: Append the rate-card seed** to `supabase/seed.sql`

```sql
-- One active, effective-dated rate card per role so booking creation can resolve a snapshot.
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, platform_fee_type, currency)
select r.id, 40.00, 28.00, 'derived', 'GBP'
from professional_roles r
where not exists (
  select 1 from rate_cards rc where rc.professional_role_id = r.id and rc.effective_to is null
);

-- Fix booking_request copy: sent to the requester on create, not to professionals.
update notification_templates
   set body = 'Your booking request ({{booking_id}}) has been submitted.'
 where type = 'booking_request';
```

- [ ] **Step 4: Run test to verify it passes**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0024_booking_cancellation_template.sql supabase/seed.sql supabase/tests/0025_booking_seed_test.sql
git commit -m "feat(db): booking_cancellation template + per-role rate-card seed"
```

---

## Task 10b: DB — requester SELECT-only + accept concurrency pgTAP

**Files:**
- Create: `supabase/migrations/0025_bookings_requester_select_only.sql`
- Create: `supabase/tests/0026_booking_accept_concurrency_test.sql`

- [ ] **Step 1: Write the failing pgTAP test** (`0026_booking_accept_concurrency_test.sql`)

```sql
begin;
select plan(2);

-- Fixtures: open booking + two eligible professionals (same role).
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000c0001','rn_c','RN C', true) on conflict do nothing;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000c0010','req@test.dev'),
  ('00000000-0000-0000-0000-0000000c0011','pro1@test.dev'),
  ('00000000-0000-0000-0000-0000000c0012','pro2@test.dev') on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values
  ('00000000-0000-0000-0000-0000000c0020','00000000-0000-0000-0000-0000000c0011','Pro 1','00000000-0000-0000-0000-0000000c0001','active','approved'),
  ('00000000-0000-0000-0000-0000000c0021','00000000-0000-0000-0000-0000000c0012','Pro 2','00000000-0000-0000-0000-0000000c0001','active','approved')
  on conflict do nothing;
insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000c0030','00000000-0000-0000-0000-0000000c0010','Client') on conflict do nothing;
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee, status)
  values ('00000000-0000-0000-0000-0000000c0040','00000000-0000-0000-0000-0000000c0010',
  '00000000-0000-0000-0000-0000000c0030','00000000-0000-0000-0000-0000000c0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12, 'open')
  on conflict do nothing;

-- First accept wins.
update bookings
   set status = 'accepted', assigned_professional_id = '00000000-0000-0000-0000-0000000c0020', accepted_at = now()
 where id = '00000000-0000-0000-0000-0000000c0040'
   and status = 'open'
   and assigned_professional_id is null;
select is(
  (select status::text from bookings where id = '00000000-0000-0000-0000-0000000c0040'),
  'accepted',
  'first accept succeeds');

-- Second accept on non-open booking is a no-op (mirrors app conditional update).
update bookings
   set status = 'accepted', assigned_professional_id = '00000000-0000-0000-0000-0000000c0021', accepted_at = now()
 where id = '00000000-0000-0000-0000-0000000c0040'
   and status = 'open'
   and assigned_professional_id is null;
select is(
  (select assigned_professional_id from bookings where id = '00000000-0000-0000-0000-0000000c0040'),
  '00000000-0000-0000-0000-0000000c0020'::uuid,
  'second accept does not steal assignment');

select * from finish();
rollback;
```

- [ ] **Step 2: Run test to verify it fails**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: FAIL if the concurrency test file is missing (or PASS once added — the SQL above is self-contained logic proof).

- [ ] **Step 3: Write the migration** (`0025_bookings_requester_select_only.sql`)

The existing `bookings_requester` policy grants `FOR ALL`, letting requesters mutate bookings directly via the anon client and bypass server actions. Replace it with SELECT-only:

```sql
-- Requesters may read their own bookings; all mutations go through server actions (service role).
drop policy if exists bookings_requester on bookings;
create policy bookings_requester on bookings
  for select using (requester_user_id = auth.uid());
```

- [ ] **Step 4: Run test to verify it passes**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: all pgTAP files PASS, including `0026_booking_accept_concurrency_test`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0025_bookings_requester_select_only.sql supabase/tests/0026_booking_accept_concurrency_test.sql
git commit -m "feat(db): bookings requester SELECT-only + accept concurrency pgTAP"
```

---

## Task 11: Account registration actions + pages

**Files:**
- Create: `apps/web/src/lib/accounts/actions.ts`
- Create: `apps/web/src/components/account-register-form.tsx`
- Create: `apps/web/src/app/client/register/page.tsx`, `apps/web/src/app/organisation/register/page.tsx`

- [ ] **Step 1: Implement the server actions**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { clientSchema, organisationSchema } from "@/lib/validation/accounts";
import { createCustomer } from "@/lib/payments/stripe";

export type AccountResult = { ok: true } | { error: string } | null;

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function saveClientProfile(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const parsed = clientSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: (formData.get("phone") as string) || undefined,
    emailContact: (formData.get("emailContact") as string) || undefined,
    addressLine1: (formData.get("addressLine1") as string) || undefined,
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postcode: (formData.get("postcode") as string) || undefined,
  });
  if (!parsed.success) return { error: "Please complete the required fields." };
  const user = await currentUser();
  if (!user) return { error: "You must be signed in." };

  const customer = await createCustomer({ email: parsed.data.emailContact ?? user.email, name: parsed.data.fullName });
  const admin = createServiceClient();
  const { error } = await admin.from("private_clients").upsert(
    {
      user_id: user.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      email_contact: parsed.data.emailContact ?? null,
      address_line1: parsed.data.addressLine1 ?? null,
      address_line2: parsed.data.addressLine2 ?? null,
      city: parsed.data.city ?? null,
      postcode: parsed.data.postcode ?? null,
      stripe_customer_id: customer.id,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

export async function saveOrganisationProfile(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const parsed = organisationSchema.safeParse({
    organisationName: formData.get("organisationName"),
    contactPerson: formData.get("contactPerson"),
    phone: (formData.get("phone") as string) || undefined,
    emailContact: (formData.get("emailContact") as string) || undefined,
    addressLine1: (formData.get("addressLine1") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    postcode: (formData.get("postcode") as string) || undefined,
    cqcRegistrationNumber: (formData.get("cqcRegistrationNumber") as string) || undefined,
    billingEmail: (formData.get("billingEmail") as string) || undefined,
  });
  if (!parsed.success) return { error: "Please complete the required fields." };
  const user = await currentUser();
  if (!user) return { error: "You must be signed in." };

  const customer = await createCustomer({ email: parsed.data.billingEmail ?? user.email, name: parsed.data.organisationName });
  const admin = createServiceClient();
  const { error } = await admin.from("organisations").upsert(
    {
      user_id: user.id,
      organisation_name: parsed.data.organisationName,
      contact_person: parsed.data.contactPerson,
      phone: parsed.data.phone ?? null,
      email_contact: parsed.data.emailContact ?? null,
      address_line1: parsed.data.addressLine1 ?? null,
      city: parsed.data.city ?? null,
      postcode: parsed.data.postcode ?? null,
      cqc_registration_number: parsed.data.cqcRegistrationNumber ?? null,
      billing_email: parsed.data.billingEmail ?? null,
      stripe_customer_id: customer.id,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}
```

- [ ] **Step 2: Build the form component** (`account-register-form.tsx`, `"use client"`)

A `useActionState`-driven form taking a `variant: "client" | "organisation"` prop and the matching action; renders the relevant fields (client: fullName/phone/emailContact/address; org: organisationName/contactPerson/cqc/billingEmail/address). Follow the styling of `apps/web/src/components/profile-form.tsx` (reuse the same input/label classes). On `ok`, show a "Profile saved — you can now create bookings" panel linking to `/client/bookings` or `/organisation/bookings`.

- [ ] **Step 3: Build the pages**

`client/register/page.tsx` renders `<AccountRegisterForm variant="client" />`; `organisation/register/page.tsx` renders `variant="organisation"`. Wrap in the same `<main className="mx-auto max-w-2xl px-4 py-10">` shell used by onboarding.

- [ ] **Step 4: Verify**

Run: `cd apps/web && npm run lint` → clean. Manual: sign in as a client, submit the form, confirm a `private_clients` row with a `cus_stub_…` id.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/accounts apps/web/src/components/account-register-form.tsx apps/web/src/app/client/register apps/web/src/app/organisation/register
git commit -m "feat(app): client and organisation profile registration"
```

---

## Task 12: Booking server actions

**Files:**
- Create: `apps/web/src/lib/auth/admin.ts` (extract shared `requireAdmin`)
- Modify: `apps/web/src/lib/admin/compliance-actions.ts` (import `requireAdmin` from `@/lib/auth/admin`)
- Create: `apps/web/src/lib/validation/bookings.ts` (+ test)
- Create: `apps/web/src/lib/bookings/actions.ts`

- [ ] **Step 0: Shared admin helper + booking Zod schema**

`apps/web/src/lib/auth/admin.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

/** Returns the caller's user id if they are an admin/founder, else null. */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row } = await supabase
    .from("users")
    .select("account_type, is_founder")
    .eq("id", user.id)
    .maybeSingle();
  return row && (row.account_type === "admin" || row.is_founder) ? user.id : null;
}
```

Refactor `compliance-actions.ts` to `import { requireAdmin } from "@/lib/auth/admin"` and delete its local copy.

`apps/web/src/lib/validation/bookings.ts` (+ Vitest):

```ts
import { z } from "zod";

export const createBookingSchema = z.object({
  requesterType: z.enum(["client", "organisation"]),
  professionalRoleId: z.string().uuid(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  locationAddress: z.string().min(1),
  locationPostcode: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateBookingForm = z.infer<typeof createBookingSchema>;
```

- [ ] **Step 1: Implement `createBooking`**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { buildBookingInsert, type CreateBookingInput } from "./create";
import { applyTransition, type Actor } from "./transitions";
import { canAccept } from "./eligibility";
import { sendNotification } from "@/lib/notifications/send";
import { createBookingSchema } from "@/lib/validation/bookings";

export type BookingActionResult = { ok: true; id?: string } | { error: string };

async function authUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Derive cancel actor from the session — never trust a client-supplied role. */
async function resolveCancelActor(
  userId: string,
  booking: { requester_user_id: string; assigned_professional_id: string | null },
): Promise<Actor | null> {
  if (await requireAdmin()) return "admin";
  if (booking.requester_user_id === userId) {
    const admin = createServiceClient();
    const { data: client } = await admin.from("private_clients").select("id").eq("user_id", userId).maybeSingle();
    if (client) return "client";
    const { data: org } = await admin.from("organisations").select("id").eq("user_id", userId).maybeSingle();
    if (org) return "organisation";
    return null;
  }
  if (booking.assigned_professional_id) {
    const admin = createServiceClient();
    const { data: prof } = await admin
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (prof?.id === booking.assigned_professional_id) return "professional";
  }
  return null;
}

export async function createBooking(form: unknown): Promise<BookingActionResult> {
  const parsed = createBookingSchema.safeParse(form);
  if (!parsed.success) return { error: "Please check the booking details." };
  const formData = parsed.data;

  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();

  // Resolve the requester's client/org profile id.
  const table = formData.requesterType === "client" ? "private_clients" : "organisations";
  const { data: profile } = await admin.from(table).select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return { error: `Complete your ${formData.requesterType} profile first.` };

  // Resolve the active rate card for the role.
  const { data: rateCard } = await admin
    .from("rate_cards")
    .select("id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency")
    .eq("professional_role_id", formData.professionalRoleId)
    .is("effective_to", null)
    .maybeSingle();
  if (!rateCard) return { error: "No active rate card for this role yet." };

  let insert;
  try {
    insert = buildBookingInsert(
      {
        requesterUserId: user.id,
        privateClientId: formData.requesterType === "client" ? profile.id : null,
        organisationId: formData.requesterType === "organisation" ? profile.id : null,
        professionalRoleId: formData.professionalRoleId,
        scheduledStart: formData.scheduledStart,
        scheduledEnd: formData.scheduledEnd,
        locationAddress: formData.locationAddress,
        locationPostcode: formData.locationPostcode,
        notes: formData.notes,
      } satisfies CreateBookingInput,
      rateCard,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({ ...insert, created_by: user.id })
    .select("id")
    .single();
  if (error || !booking) return { error: error?.message ?? "Could not create booking." };

  await admin.from("booking_status_history").insert({ booking_id: booking.id, to_status: "open", changed_by: user.id });
  await sendNotification("booking_request", user.id, { booking_id: booking.id });
  return { ok: true, id: booking.id };
}
```

- [ ] **Step 2: Implement `acceptBooking` (concurrency-safe) and `declineBooking`**

```ts
export async function acceptBooking(bookingId: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();

  const { data: prof } = await admin
    .from("professionals")
    .select("id, can_accept_bookings, professional_role_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!prof) return { error: "Professional profile not found." };

  const { data: booking } = await admin.from("bookings").select("status, professional_role_id, requester_user_id").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };

  const t = applyTransition(booking.status, "accept", "professional");
  if (!t.ok) return { error: t.error };

  const eligible = canAccept(
    { canAcceptBookings: !!prof.can_accept_bookings, professionalRoleId: prof.professional_role_id },
    booking.professional_role_id,
  );
  if (!eligible.ok) return { error: eligible.reason };

  // Conditional update: only the first accept on a still-open booking wins.
  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "accepted", assigned_professional_id: prof.id, accepted_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "open")
    .is("assigned_professional_id", null)
    .select("id");
  if (error) return { error: error.message }; // includes the eligibility-trigger exception
  if (!updated || updated.length === 0) return { error: "This booking has already been taken." };

  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: "open", to_status: "accepted", changed_by: user.id });
  await sendNotification("booking_confirmation", booking.requester_user_id, { booking_id: bookingId });
  await sendNotification("booking_confirmation", user.id, { booking_id: bookingId });
  return { ok: true };
}

export async function declineBooking(bookingId: string, reason?: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();
  const { data: prof } = await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
  if (!prof) return { error: "Professional profile not found." };
  const { error } = await admin
    .from("booking_declines")
    .upsert({ booking_id: bookingId, professional_id: prof.id, reason: reason ?? null }, { onConflict: "booking_id,professional_id" });
  if (error) return { error: error.message };
  return { ok: true };
}
```

- [ ] **Step 3: Implement `assignBooking` (admin) and `cancelBooking`**

```ts
export async function assignBooking(bookingId: string, professionalId: string): Promise<BookingActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: booking } = await admin.from("bookings").select("status, requester_user_id, professional_role_id").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  const t = applyTransition(booking.status, "assign", "admin");
  if (!t.ok) return { error: t.error };

  const { data: prof } = await admin
    .from("professionals")
    .select("id, user_id, can_accept_bookings, professional_role_id")
    .eq("id", professionalId)
    .maybeSingle();
  if (!prof) return { error: "Professional not found." };
  const eligible = canAccept(
    { canAcceptBookings: !!prof.can_accept_bookings, professionalRoleId: prof.professional_role_id },
    booking.professional_role_id,
  );
  if (!eligible.ok) return { error: eligible.reason };

  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "assigned", assigned_professional_id: professionalId, booking_type: "admin_assigned", assigned_by: adminId })
    .eq("id", bookingId)
    .eq("status", "open")
    .select("id");
  if (error) return { error: error.message }; // eligibility trigger may raise here
  if (!updated || updated.length === 0) return { error: "This booking is no longer open." };

  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: "open", to_status: "assigned", changed_by: adminId });
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "booking.assigned", entity_type: "booking", entity_id: bookingId });
  await sendNotification("booking_confirmation", booking.requester_user_id, { booking_id: bookingId });
  if (prof.user_id) await sendNotification("booking_confirmation", prof.user_id, { booking_id: bookingId });
  return { ok: true };
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("status, scheduled_start, requester_user_id, assigned_professional_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };

  const actor = await resolveCancelActor(user.id, booking);
  if (!actor) return { error: "You are not allowed to cancel this booking." };

  const t = applyTransition(booking.status, "cancel", actor);
  if (!t.ok) return { error: t.error };

  const isLastMinute = new Date(booking.scheduled_start).getTime() - Date.now() < 24 * 3_600_000;
  const { error } = await admin.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  if (error) return { error: error.message };
  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: booking.status, to_status: "cancelled", changed_by: user.id, reason: reason ?? null });
  await admin.from("booking_cancellations").insert({
    booking_id: bookingId, cancelled_by: user.id, cancelled_role: actor, is_last_minute: isLastMinute, reason: reason ?? null,
  });
  // Notify the other party.
  let recipient: string | null = null;
  if (actor === "professional") recipient = booking.requester_user_id;
  else if (booking.assigned_professional_id) {
    const { data: p } = await admin.from("professionals").select("user_id").eq("id", booking.assigned_professional_id).maybeSingle();
    recipient = p?.user_id ?? null;
  }
  if (recipient) await sendNotification("booking_cancellation", recipient, { booking_id: bookingId });
  return { ok: true };
}
```

- [ ] **Step 4: Verify**

Run: `cd apps/web && npm run test` → PASS (includes `validation/bookings.test.ts`). Run: `cd apps/web && npm run lint` → clean. (Behavioural verification happens in Task 16 E2E.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/auth/admin.ts apps/web/src/lib/admin/compliance-actions.ts apps/web/src/lib/validation/bookings.ts apps/web/src/lib/validation/bookings.test.ts apps/web/src/lib/bookings/actions.ts
git commit -m "feat(app): booking server actions (create/accept/decline/assign/cancel)"
```

---

## Task 13: Client & organisation booking pages

**Files:**
- Create: `apps/web/src/components/booking-request-form.tsx`
- Create: `apps/web/src/app/client/bookings/page.tsx`, `apps/web/src/app/client/bookings/new/page.tsx`
- Create: `apps/web/src/app/organisation/bookings/page.tsx`, `apps/web/src/app/organisation/bookings/new/page.tsx`

- [ ] **Step 1: Build the request form** (`booking-request-form.tsx`, `"use client"`)

Props: `roles: { id: string; name: string }[]`, `requesterType: "client" | "organisation"`. Fields: role `<select>`, `scheduledStart`/`scheduledEnd` (`datetime-local`), `locationAddress`, `locationPostcode`, `notes`. On submit, call `createBooking({...})` (convert `datetime-local` to ISO via `new Date(value).toISOString()`); show the returned error or route to the bookings list on success. Reuse the input/label/button classes from `booking`/`profile` forms (green `#198038` button).

- [ ] **Step 2: Build the `new` pages**

Each `new/page.tsx` is a server component that loads active roles:
```tsx
const { data: roles } = await supabase.from("professional_roles").select("id, name").eq("is_active", true).order("name");
```
and renders `<BookingRequestForm roles={roles ?? []} requesterType="client" /* or "organisation" */ />`.

- [ ] **Step 3: Build the list pages**

Server component reads the requester's own bookings (RLS `bookings_requester`):
```tsx
const { data: bookings } = await supabase
  .from("bookings")
  .select("id, status, scheduled_start, scheduled_end, location_address, professional_role_id, total_client_charge")
  .order("scheduled_start", { ascending: false });
```
Render a table (date, role, status, total) with a "New booking" link to `./new` and, for `open`/`accepted`/`assigned` rows, a cancel control wired to a small client component calling `cancelBooking(id)` (actor is derived server-side — do not pass a role from the client).

- [ ] **Step 4: Verify**

Run: `cd apps/web && npm run lint` → clean. Manual: create a booking, see it listed as `open`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/booking-request-form.tsx apps/web/src/app/client/bookings apps/web/src/app/organisation/bookings
git commit -m "feat(app): client and organisation booking creation, listing and cancel"
```

---

## Task 14: Professional bookings page (open / assigned / history)

**Files:**
- Create: `apps/web/src/components/professional-bookings.tsx`
- Create: `apps/web/src/app/professional/bookings/page.tsx`

- [ ] **Step 1: Build the page** (server component)

```tsx
import { createClient } from "@/lib/supabase/server";
import { ProfessionalBookings } from "@/components/professional-bookings";
export const dynamic = "force-dynamic";

export default async function ProfessionalBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: prof } = user
    ? await supabase.from("professionals").select("id, professional_role_id, can_accept_bookings").eq("user_id", user.id).maybeSingle()
    : { data: null };

  // Own declines (RLS: own rows).
  const { data: declines } = await supabase.from("booking_declines").select("booking_id");
  const declined = new Set((declines ?? []).map((d) => d.booking_id));

  // RLS bookings_prof_visibility returns open + own-assigned; split client-side.
  const { data: rows } = await supabase
    .from("bookings")
    .select("id, status, scheduled_start, scheduled_end, location_address, professional_role_id, assigned_professional_id, total_payout")
    .order("scheduled_start", { ascending: true });

  const roleId = prof?.professional_role_id ?? null;
  const open = (rows ?? []).filter((b) => b.status === "open" && b.professional_role_id === roleId && !declined.has(b.id));
  const mine = (rows ?? []).filter((b) => b.assigned_professional_id === prof?.id);

  return <ProfessionalBookings open={open} mine={mine} eligible={!!prof?.can_accept_bookings} />;
}
```

- [ ] **Step 2: Build the client component** (`professional-bookings.tsx`)

Lists **Open bookings** (each with Accept + Decline buttons; if `!eligible`, disable Accept and show "Complete onboarding to accept bookings"), and **My bookings** (assigned/accepted + history). Accept calls `acceptBooking(id)`; Decline calls `declineBooking(id)`; on error show the message (e.g. "already been taken"); on success `router.refresh()`.

- [ ] **Step 3: Verify**

Run: `cd apps/web && npm run lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/professional-bookings.tsx apps/web/src/app/professional/bookings
git commit -m "feat(app): professional open/assigned bookings with accept and decline"
```

---

## Task 15: Admin bookings page (list + assign + cancel)

**Files:**
- Create: `apps/web/src/components/admin-bookings.tsx`
- Create: `apps/web/src/app/admin/bookings/page.tsx`

- [ ] **Step 1: Build the page** (server component, service client)

```tsx
import { createServiceClient } from "@/lib/supabase/service";
import { AdminBookings } from "@/components/admin-bookings";
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const admin = createServiceClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, status, booking_type, scheduled_start, professional_role_id, assigned_professional_id, professional_roles(name), total_client_charge")
    .order("scheduled_start", { ascending: false });

  // Eligible professionals for the assign picker (role + can_accept_bookings).
  const { data: pros } = await admin
    .from("professionals")
    .select("id, full_name, professional_role_id, can_accept_bookings")
    .eq("can_accept_bookings", true);

  return <AdminBookings bookings={bookings ?? []} professionals={pros ?? []} />;
}
```

- [ ] **Step 2: Build the client component** (`admin-bookings.tsx`)

A table of all bookings; for `open` rows, an "Assign" control showing a `<select>` of eligible professionals **filtered to the booking's role**, wired to `assignBooking(bookingId, professionalId)`. For non-terminal rows, a Cancel control calling `cancelBooking(id)` (no client-supplied actor). Show action errors (including eligibility-trigger messages); `router.refresh()` on success.

- [ ] **Step 3: Verify**

Run: `cd apps/web && npm run lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin-bookings.tsx apps/web/src/app/admin/bookings
git commit -m "feat(app): admin booking list with assign and cancel"
```

---

## Task 16: End-to-end booking flows

**Files:**
- Create: `apps/web/e2e/bookings.spec.ts`

- [ ] **Step 1: Write the E2E spec**

Model it on `apps/web/e2e/onboarding.spec.ts` (service-client fixtures + UI driving). Cover:
1. **Open-market happy path:** seed an approved/eligible professional (role RN) + a client with a profile; client creates a booking via the UI; professional accepts via the UI; assert DB row `status='accepted'`, `assigned_professional_id` set, and `total_client_charge` / `total_payout` equal `rate × duration_hours`.
2. **Admin assign:** seed an open booking; admin assigns an eligible pro via the UI; assert `status='assigned'`, `booking_type='admin_assigned'`.
3. **Negative eligibility (admin assign):** attempt to assign a `pending_verification` pro via the UI → action returns an error and DB status stays `open` (trigger blocks it).
4. **Negative eligibility (pro accept):** seed an open booking; sign in as an ineligible/`pending_verification` professional; attempt Accept via the UI → error message shown (from `canAccept` or trigger) and DB row stays `open`.
5. **Decline:** professional declines an open booking → it disappears from their open list (assert a `booking_declines` row and that the booking is absent after `router.refresh()`).
6. **Last-minute cancel:** create a booking with `scheduled_start` 2h away, accept it, cancel as client → assert a `booking_cancellations` row with `is_last_minute=true`.

Seed helper for an eligible professional (reuse from onboarding spec): create auth user → insert `professionals` with `professional_status='active'`, `compliance_status='approved'`, role RN.

- [ ] **Step 2: Run the suite against local Supabase**

```bash
# from repo root: ensure stack is up and DB seeded
npx supabase start
npx supabase db reset
# kill stale :3000, then run E2E with local creds (URL/keys from `npx supabase status`)
cd apps/web
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<local anon>" \
SUPABASE_SERVICE_ROLE_KEY="<local service_role>" \
npm run e2e -- bookings.spec.ts
```
Expected: all booking scenarios PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/bookings.spec.ts
git commit -m "test(app): booking accept/assign/decline/cancel E2E with eligibility guard"
```

---

## Final verification

- [ ] `cd apps/web && npm run test` → all Vitest pass (existing + new: stripe, accounts, bookings validation, snapshot, create, transitions, eligibility, notifications).
- [ ] repo root `npx supabase db reset && npx supabase test db` → all pgTAP pass (existing + 0023/0024/0025/0026).
- [ ] `cd apps/web && npm run e2e` (with local creds inline) → all Playwright pass.
- [ ] `cd apps/web && npm run lint` and `npm run build` → clean.

## Acceptance (from spec)

Both matching paths work; rate snapshot frozen on the booking; ineligible pros blocked at accept/assign (DB-enforced); concurrent accepts yield exactly one winner; declines hide per-pro; cancellations recorded with the last-minute flag; notification rows created for create/accept/assign/cancel; client/org receive a stub Stripe customer id.

## Notes / open checks for the implementer

- `can_accept_bookings` is a **generated column** on `professionals` (`active` + `approved` ⇒ `true`); eligibility pgTAP fixtures rely on this.
- The `notification_templates.type` CHECK is inline (may not be named `notification_templates_type_check`); find the real name if the `0024` drop fails.
- `users.email` exists (mirrors `auth.users`) — `sendNotification` reads it directly.
- Privileged writes use the **service client** because `private_clients`, `organisations`, `rate_cards`, and booking child tables are admin-only under RLS (same as S1). Migration `0025` restricts `bookings_requester` to **SELECT only** so requesters cannot mutate bookings via the anon client; all booking mutations must go through server actions.
- `cancelBooking` derives the actor server-side via `resolveCancelActor` — UI components call `cancelBooking(id)` only, never pass a role string.
- `requireAdmin` lives in `@/lib/auth/admin` (shared with compliance actions).
