# S3a — Payments & Payouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect the client charge via Stripe Checkout once a booking is staffed, reconcile payments by webhook, support in-app admin refunds, and record professional payouts (not auto-disbursed) with pgcrypto-encrypted bank details, plus a finance/revenue report.

**Architecture:** Pure domain logic in `src/lib/*` (Stripe line-item builder, webhook event→status mapper, payout-status transitions, booking `complete` transition) is unit-tested without network. A single `src/lib/stripe/` module wraps the SDK (replacing the S2 stub). Money mutations run as server actions via the **service client** and always write `audit_log`; the webhook is the source of truth for payment state and is **idempotent**. Bank details are encrypted at rest via pgcrypto SQL helpers keyed from `PAYOUT_ENC_KEY` (never stored).

**Tech Stack:** `stripe` SDK + hosted Checkout + webhooks (test mode), Next.js App Router route handler, Supabase service client, pgcrypto, Zod, Vitest, pgTAP, Playwright (Stripe mocked).

**Spec:** [docs/superpowers/specs/2026-06-15-s3a-payments-payouts-design.md](../specs/2026-06-15-s3a-payments-payouts-design.md)

---

## Conventions

- Run loops: `cd apps/web && npm run test` (Vitest); repo root `npx supabase db reset && npx supabase test db` (pgTAP); `cd apps/web && npm run e2e` (Playwright — now targets local Supabase by default via `playwright.config.ts`).
- New migrations continue from `0025`: next is **0026**. New pgTAP tests continue from `0026_booking_accept_concurrency_test`: next is **0027**.
- Supabase clients: `@/lib/supabase/server` (RLS reads), `@/lib/supabase/service` (privileged writes). Admin gate: `requireAdmin` from `@/lib/auth/admin`.
- New env vars (add to `.env.local`, gitignored; never commit real keys): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `PAYOUT_ENC_KEY`. All Stripe work is **test mode** until launch.
- Commit after every task.

## File structure

```
src/lib/stripe/client.ts            # configured Stripe instance + createCustomer (real-or-stub)  (+test)
src/lib/stripe/checkout.ts          # buildCheckoutLineItems (pure)                                (+test)
src/lib/stripe/events.ts            # paymentStatusForEvent (pure)                                 (+test)
src/lib/payments/actions.ts         # startCheckout (requester), refundPayment (admin)
src/app/api/stripe/webhook/route.ts # signature-verified, idempotent reconciliation
src/lib/bookings/transitions.ts     # add `complete` edges from accepted/assigned  (modify + test)
src/lib/bookings/actions.ts         # add completeBooking, markNoShow              (modify)
src/lib/payouts/record.ts           # nextPayoutStatus (pure)                       (+test)
src/lib/payouts/actions.ts          # savePayoutDetails (pro), recordPayout + markPayoutPaid (admin)
src/components/pay-now-button.tsx    src/components/payout-details-form.tsx
src/app/professional/payout-details/page.tsx
src/app/admin/finance/page.tsx       src/app/admin/finance/payouts/page.tsx
supabase/migrations/0026_payout_crypto_fns.sql
supabase/migrations/0027_payment_notification_templates.sql
supabase/tests/0027_payout_crypto_test.sql
e2e/payments-admin.spec.ts
```

DELETE after Task 1: `src/lib/payments/stripe.ts`, `src/lib/payments/stripe.test.ts` (moved into `src/lib/stripe/`).

---

## Task 1: Consolidate Stripe module (real-or-stub `createCustomer`)

**Files:**
- Install: `stripe`
- Create: `apps/web/src/lib/stripe/client.ts`, `apps/web/src/lib/stripe/client.test.ts`
- Modify: `apps/web/src/lib/accounts/actions.ts` (import path)
- Delete: `apps/web/src/lib/payments/stripe.ts`, `apps/web/src/lib/payments/stripe.test.ts`

- [ ] **Step 1: Install the SDK**

Run: `cd apps/web && npm install stripe`
Expected: `stripe` added to `dependencies`.

- [ ] **Step 2: Write the failing test** (`client.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { createCustomer } from "./client";

// With no STRIPE_SECRET_KEY in the test env, createCustomer returns a deterministic stub.
describe("createCustomer (stub mode, no STRIPE_SECRET_KEY)", () => {
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

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/stripe/client.test.ts`
Expected: FAIL — cannot find module `./client`.

- [ ] **Step 4: Implement** (`client.ts`)

```ts
import "server-only";
import Stripe from "stripe";
import { randomUUID } from "crypto";

export type StripeCustomer = { id: string };

let _stripe: Stripe | null = null;
/** Configured Stripe instance. Throws if used without a key (callers that need real Stripe). */
export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Real Stripe customer when a key is configured; deterministic stub otherwise (dev/test). */
export async function createCustomer(params: { email?: string | null; name: string }): Promise<StripeCustomer> {
  if (!process.env.STRIPE_SECRET_KEY) return { id: `cus_stub_${randomUUID()}` };
  const c = await stripe().customers.create({ email: params.email ?? undefined, name: params.name });
  return { id: c.id };
}
```

- [ ] **Step 5: Update the import** in `accounts/actions.ts`

Change `import { createCustomer } from "@/lib/payments/stripe";` → `import { createCustomer } from "@/lib/stripe/client";`

- [ ] **Step 6: Delete the old stub** and run tests

```bash
git rm apps/web/src/lib/payments/stripe.ts apps/web/src/lib/payments/stripe.test.ts
```
Run: `cd apps/web && npm run test`
Expected: all pass (the new `client.test.ts` covers stub mode; accounts unaffected).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/stripe apps/web/src/lib/accounts/actions.ts apps/web/package.json apps/web/package-lock.json
git commit -m "feat(app): consolidate Stripe into lib/stripe with real-or-stub createCustomer"
```

---

## Task 2: Wire the `complete` transition (accepted/assigned → completed)

**Files:**
- Modify: `apps/web/src/lib/bookings/transitions.ts`
- Modify: `apps/web/src/lib/bookings/transitions.test.ts`

- [ ] **Step 1: Add failing tests** (append to `transitions.test.ts`)

```ts
  it("professional completes an accepted booking", () => {
    expect(applyTransition("accepted", "complete", "professional")).toEqual({ ok: true, to: "completed" });
  });
  it("admin completes an assigned booking", () => {
    expect(applyTransition("assigned", "complete", "admin")).toEqual({ ok: true, to: "completed" });
  });
  it("rejects completing an open booking", () => {
    expect(applyTransition("open", "complete", "professional").ok).toBe(false);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/bookings/transitions.test.ts`
Expected: FAIL — the accepted/assigned `complete` edges don't exist.

- [ ] **Step 3: Add the edges** in `transitions.ts` (insert into `RULES`, in the S3 section)

```ts
  { from: "accepted", action: "complete", actors: ["professional", "admin"], to: "completed" },
  { from: "assigned", action: "complete", actors: ["professional", "admin"], to: "completed" },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/bookings/transitions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/bookings/transitions.ts apps/web/src/lib/bookings/transitions.test.ts
git commit -m "feat(app): allow completing accepted/assigned bookings"
```

---

## Task 3: Stripe Checkout line-item builder (pure)

**Files:**
- Create: `apps/web/src/lib/stripe/checkout.ts`, `apps/web/src/lib/stripe/checkout.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildCheckoutLineItems } from "./checkout";

describe("buildCheckoutLineItems", () => {
  it("converts the client charge to pence and lowercases currency", () => {
    const items = buildCheckoutLineItems({ total_client_charge: 320, snap_currency: "GBP", role_name: "Registered Nurse" });
    expect(items).toEqual([
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: 32000,
          product_data: { name: "Booking — Registered Nurse" },
        },
      },
    ]);
  });
  it("rounds fractional pounds to the nearest penny", () => {
    const items = buildCheckoutLineItems({ total_client_charge: 12.345, snap_currency: "GBP", role_name: "Carer" });
    expect(items[0].price_data.unit_amount).toBe(1235);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/stripe/checkout.test.ts`
Expected: FAIL — cannot find module `./checkout`.

- [ ] **Step 3: Implement**

```ts
export type CheckoutBooking = {
  total_client_charge: number;
  snap_currency: string;
  role_name: string;
};

export type CheckoutLineItem = {
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: { name: string };
  };
};

export function buildCheckoutLineItems(b: CheckoutBooking): CheckoutLineItem[] {
  return [
    {
      quantity: 1,
      price_data: {
        currency: b.snap_currency.trim().toLowerCase(),
        unit_amount: Math.round(b.total_client_charge * 100),
        product_data: { name: `Booking — ${b.role_name}` },
      },
    },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/stripe/checkout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/stripe/checkout.ts apps/web/src/lib/stripe/checkout.test.ts
git commit -m "feat(app): Stripe Checkout line-item builder"
```

---

## Task 4: Webhook event → payment-status mapper (pure)

**Files:**
- Create: `apps/web/src/lib/stripe/events.ts`, `apps/web/src/lib/stripe/events.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { paymentStatusForEvent } from "./events";

describe("paymentStatusForEvent", () => {
  it("maps success events to succeeded", () => {
    expect(paymentStatusForEvent("checkout.session.completed")).toBe("succeeded");
    expect(paymentStatusForEvent("payment_intent.succeeded")).toBe("succeeded");
  });
  it("maps failure to failed and refund to refunded", () => {
    expect(paymentStatusForEvent("payment_intent.payment_failed")).toBe("failed");
    expect(paymentStatusForEvent("charge.refunded")).toBe("refunded");
  });
  it("returns null for unhandled events", () => {
    expect(paymentStatusForEvent("invoice.paid")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/stripe/events.test.ts`
Expected: FAIL — cannot find module `./events`.

- [ ] **Step 3: Implement**

```ts
export type PaymentStatus = "succeeded" | "failed" | "refunded";

const MAP: Record<string, PaymentStatus> = {
  "checkout.session.completed": "succeeded",
  "payment_intent.succeeded": "succeeded",
  "payment_intent.payment_failed": "failed",
  "charge.refunded": "refunded",
};

export function paymentStatusForEvent(eventType: string): PaymentStatus | null {
  return MAP[eventType] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/stripe/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/stripe/events.ts apps/web/src/lib/stripe/events.test.ts
git commit -m "feat(app): Stripe webhook event to payment-status mapper"
```

---

## Task 5: `startCheckout` + `refundPayment` actions

**Files:**
- Create: `apps/web/src/lib/payments/actions.ts`

- [ ] **Step 1: Implement `startCheckout`**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { stripe } from "@/lib/stripe/client";
import { buildCheckoutLineItems } from "@/lib/stripe/checkout";

export type PaymentActionResult = { ok: true; url?: string } | { error: string };

async function authUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function startCheckout(bookingId: string): Promise<PaymentActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, requester_user_id, total_client_charge, snap_currency, professional_roles(name)")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };
  if (booking.requester_user_id !== user.id) return { error: "This is not your booking." };
  if (!["accepted", "assigned"].includes(booking.status)) {
    return { error: "This booking is not ready for payment." };
  }

  // Reuse an existing unpaid payment row, else create one.
  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("booking_id", bookingId)
    .neq("status", "succeeded")
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (await alreadyPaid(admin, bookingId)) return { error: "This booking is already paid." };

  let paymentId = existing?.id ?? null;
  if (!paymentId) {
    const { data: created, error } = await admin
      .from("payments")
      .insert({ booking_id: bookingId, payer_user_id: user.id, amount: booking.total_client_charge, currency: booking.snap_currency, status: "pending" })
      .select("id")
      .single();
    if (error || !created) return { error: error?.message ?? "Could not start payment." };
    paymentId = created.id;
  }

  const roleName = (booking.professional_roles as { name: string } | null)?.name ?? "professional";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: buildCheckoutLineItems({ total_client_charge: Number(booking.total_client_charge), snap_currency: booking.snap_currency, role_name: roleName }),
    success_url: `${appUrl}/client/bookings?paid=1`,
    cancel_url: `${appUrl}/client/bookings?paid=0`,
    metadata: { booking_id: bookingId, payment_id: paymentId },
    payment_intent_data: { metadata: { booking_id: bookingId, payment_id: paymentId } },
  });

  await admin.from("payments").update({ stripe_payment_intent_id: (session.payment_intent as string) ?? null }).eq("id", paymentId);
  return { ok: true, url: session.url ?? undefined };
}

async function alreadyPaid(admin: ReturnType<typeof createServiceClient>, bookingId: string): Promise<boolean> {
  const { count } = await admin.from("payments").select("id", { count: "exact", head: true }).eq("booking_id", bookingId).eq("status", "succeeded");
  return (count ?? 0) > 0;
}

export async function refundPayment(paymentId: string): Promise<PaymentActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: payment } = await admin.from("payments").select("id, stripe_payment_intent_id, status").eq("id", paymentId).single();
  if (!payment) return { error: "Payment not found." };
  if (payment.status !== "succeeded") return { error: "Only a succeeded payment can be refunded." };
  if (!payment.stripe_payment_intent_id) return { error: "No Stripe payment intent on this payment." };

  await stripe().refunds.create({ payment_intent: payment.stripe_payment_intent_id });
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "payment.refund_requested", entity_type: "payment", entity_id: paymentId });
  // The charge.refunded webhook flips status to 'refunded' (source of truth).
  return { ok: true };
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npm run lint` → clean. (Behaviour verified in Task 14 E2E with Stripe mocked.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/payments/actions.ts
git commit -m "feat(app): start Stripe Checkout and request refunds"
```

---

## Task 6: Stripe webhook route (idempotent reconciliation)

**Files:**
- Create: `apps/web/src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { paymentStatusForEvent } from "@/lib/stripe/events";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const status = paymentStatusForEvent(event.type);
  if (!status) return new Response("ignored", { status: 200 });

  // Resolve the PaymentIntent id across event shapes.
  const obj = event.data.object as Record<string, unknown>;
  const intentId =
    (obj.payment_intent as string | undefined) ??
    (event.type.startsWith("payment_intent.") ? (obj.id as string) : undefined);
  if (!intentId) return new Response("no intent", { status: 200 });

  const admin = createServiceClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status")
    .eq("stripe_payment_intent_id", intentId)
    .maybeSingle();
  if (!payment) return new Response("no payment row", { status: 200 });
  if (payment.status === status) return new Response("already reconciled", { status: 200 }); // idempotent

  await admin
    .from("payments")
    .update({ status, paid_at: status === "succeeded" ? new Date().toISOString() : null })
    .eq("id", payment.id);
  await admin.from("audit_log").insert({
    actor_type: "system", action: `payment.${status}`, entity_type: "payment", entity_id: payment.id, summary: event.type,
  });

  return new Response("ok", { status: 200 });
}
```

- [ ] **Step 2: Verify locally** (optional, requires Stripe CLI)

`stripe listen --forward-to 127.0.0.1:3000/api/stripe/webhook` then `stripe trigger payment_intent.succeeded`. Expected: 200 and the matching `payments` row flips to `succeeded`. (Automated coverage is the Task 14 E2E with a locally-signed event.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/stripe/webhook/route.ts
git commit -m "feat(app): idempotent Stripe webhook reconciles payment status"
```

---

## Task 7: Booking completion + no-show actions

**Files:**
- Modify: `apps/web/src/lib/bookings/actions.ts`

- [ ] **Step 1: Add the actions** (append to `actions.ts`, reusing its `authUser`, `requireAdmin`, `applyTransition`, `sendNotification` imports)

```ts
/** Professional (own booking) or admin marks a booking completed. */
export async function completeBooking(bookingId: string): Promise<BookingActionResult> {
  const user = await authUser();
  if (!user) return { error: "You must be signed in." };
  const admin = createServiceClient();
  const isAdmin = !!(await requireAdmin());

  const { data: booking } = await admin
    .from("bookings")
    .select("status, assigned_professional_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found." };

  let actor: Actor = "admin";
  if (!isAdmin) {
    const { data: prof } = await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
    if (!prof || prof.id !== booking.assigned_professional_id) return { error: "This is not your booking." };
    actor = "professional";
  }

  const t = applyTransition(booking.status, "complete", actor);
  if (!t.ok) return { error: t.error };

  const { data: updated, error } = await admin
    .from("bookings").update({ status: "completed" }).eq("id", bookingId).eq("status", booking.status).select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking is no longer in a completable state." };

  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: booking.status, to_status: "completed", changed_by: user.id });
  await admin.from("audit_log").insert({ actor_user_id: user.id, actor_type: isAdmin ? "admin" : "user", action: "booking.completed", entity_type: "booking", entity_id: bookingId });
  return { ok: true };
}

/** Admin marks an accepted/assigned booking as a no-show. */
export async function markNoShow(bookingId: string): Promise<BookingActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: booking } = await admin.from("bookings").select("status").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  const t = applyTransition(booking.status, "no_show", "admin");
  if (!t.ok) return { error: t.error };
  const { data: updated, error } = await admin
    .from("bookings").update({ status: "no_show" }).eq("id", bookingId).eq("status", booking.status).select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "This booking is no longer in a no-show-able state." };
  await admin.from("booking_status_history").insert({ booking_id: bookingId, from_status: booking.status, to_status: "no_show", changed_by: adminId });
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "booking.no_show", entity_type: "booking", entity_id: bookingId });
  return { ok: true };
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/bookings/actions.ts
git commit -m "feat(app): complete and no-show booking actions"
```

---

## Task 8: pgcrypto payout-detail helpers

**Files:**
- Create: `supabase/migrations/0026_payout_crypto_fns.sql`, `supabase/tests/0027_payout_crypto_test.sql`

- [ ] **Step 1: Write the failing pgTAP test**

```sql
begin;
select plan(2);

insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000c0001','rn_pay','RN Pay', true) on conflict do nothing;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000c0010','pay@test.dev') on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id)
  values ('00000000-0000-0000-0000-0000000c0020','00000000-0000-0000-0000-0000000c0010','Pay Pro','00000000-0000-0000-0000-0000000c0001')
  on conflict do nothing;

select lives_ok($$ select set_payout_details('00000000-0000-0000-0000-0000000c0020','A Pro','12-34-56','12345678','test-key') $$);

-- last4 is stored in clear; the full number round-trips via pgp_sym_decrypt with the key.
select is(
  (select account_number_last4 from professional_payout_details where professional_id='00000000-0000-0000-0000-0000000c0020'),
  '5678', 'account_number_last4 is stored');

select * from finish();
rollback;
```

- [ ] **Step 2: Run test to verify it fails**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: FAIL — function `set_payout_details` does not exist.

- [ ] **Step 3: Write the migration**

```sql
-- pgcrypto is already enabled (migration 0000). Encrypt bank details at rest; the key is
-- supplied per call from PAYOUT_ENC_KEY by the server action and never stored.
create or replace function public.set_payout_details(
  p_professional_id uuid, p_account_name text, p_sort_code text, p_account_number text, p_key text
) returns void language plpgsql security definer as $$
begin
  insert into professional_payout_details (professional_id, account_name, sort_code_enc, account_number_enc, account_number_last4)
  values (
    p_professional_id, p_account_name,
    pgp_sym_encrypt(p_sort_code, p_key),
    pgp_sym_encrypt(p_account_number, p_key),
    right(p_account_number, 4)
  )
  on conflict (professional_id) do update set
    account_name = excluded.account_name,
    sort_code_enc = excluded.sort_code_enc,
    account_number_enc = excluded.account_number_enc,
    account_number_last4 = excluded.account_number_last4,
    updated_at = now();
end; $$;

create or replace function public.get_payout_last4(p_professional_id uuid)
returns text language sql stable as $$
  select account_number_last4 from professional_payout_details where professional_id = p_professional_id;
$$;

revoke all on function public.set_payout_details(uuid, text, text, text, text) from public, anon, authenticated;
```

- [ ] **Step 4: Run test to verify it passes**

Run (repo root): `npx supabase db reset && npx supabase test db`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0026_payout_crypto_fns.sql supabase/tests/0027_payout_crypto_test.sql
git commit -m "feat(db): encrypted payout-detail helpers (pgcrypto)"
```

---

## Task 9: Payout status transitions (pure)

**Files:**
- Create: `apps/web/src/lib/payouts/record.ts`, `apps/web/src/lib/payouts/record.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { nextPayoutStatus } from "./record";

describe("nextPayoutStatus", () => {
  it("records a pending payout", () => expect(nextPayoutStatus("pending", "record")).toBe("recorded"));
  it("marks a recorded payout paid", () => expect(nextPayoutStatus("recorded", "mark_paid")).toBe("paid"));
  it("throws on an illegal transition", () => {
    expect(() => nextPayoutStatus("pending", "mark_paid")).toThrow();
    expect(() => nextPayoutStatus("paid", "record")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/lib/payouts/record.test.ts`
Expected: FAIL — cannot find module `./record`.

- [ ] **Step 3: Implement**

```ts
export type PayoutStatus = "pending" | "recorded" | "paid";
export type PayoutAction = "record" | "mark_paid";

const NEXT: Record<PayoutStatus, Partial<Record<PayoutAction, PayoutStatus>>> = {
  pending: { record: "recorded" },
  recorded: { mark_paid: "paid" },
  paid: {},
};

export function nextPayoutStatus(current: PayoutStatus, action: PayoutAction): PayoutStatus {
  const to = NEXT[current][action];
  if (!to) throw new Error(`Illegal payout transition: ${action} from ${current}`);
  return to;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/lib/payouts/record.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/payouts/record.ts apps/web/src/lib/payouts/record.test.ts
git commit -m "feat(app): payout status transition logic"
```

---

## Task 10: Payout actions (save details, record, mark paid)

**Files:**
- Create: `apps/web/src/lib/payouts/actions.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";

export type PayoutResult = { ok: true } | { error: string };

/** Professional saves their (encrypted) bank details. */
export async function savePayoutDetails(form: {
  accountName: string; sortCode: string; accountNumber: string;
}): Promise<PayoutResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const key = process.env.PAYOUT_ENC_KEY;
  if (!key) return { error: "Payout encryption is not configured." };

  const admin = createServiceClient();
  const { data: prof } = await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
  if (!prof) return { error: "Professional profile not found." };

  const { error } = await admin.rpc("set_payout_details", {
    p_professional_id: prof.id, p_account_name: form.accountName,
    p_sort_code: form.sortCode, p_account_number: form.accountNumber, p_key: key,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/** Admin records a payout for a completed + paid booking (amount = total_payout). */
export async function recordPayout(bookingId: string): Promise<PayoutResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();

  const { data: booking } = await admin
    .from("bookings").select("id, status, assigned_professional_id, total_payout").eq("id", bookingId).single();
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "completed") return { error: "Booking is not completed." };
  if (!booking.assigned_professional_id) return { error: "Booking has no assigned professional." };

  const { count: paid } = await admin.from("payments")
    .select("id", { count: "exact", head: true }).eq("booking_id", bookingId).eq("status", "succeeded");
  if ((paid ?? 0) === 0) return { error: "The client payment has not succeeded yet." };

  const { count: existing } = await admin.from("payouts")
    .select("id", { count: "exact", head: true }).eq("booking_id", bookingId);
  if ((existing ?? 0) > 0) return { error: "A payout already exists for this booking." };

  const { error } = await admin.from("payouts").insert({
    professional_id: booking.assigned_professional_id, booking_id: bookingId,
    amount: booking.total_payout, status: "recorded", recorded_by: adminId, recorded_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "payout.recorded", entity_type: "booking", entity_id: bookingId });
  return { ok: true };
}

/** Admin marks a recorded payout as paid (out-of-band bank transfer). */
export async function markPayoutPaid(payoutId: string, method: string, reference: string): Promise<PayoutResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };
  const admin = createServiceClient();
  const { data: payout } = await admin.from("payouts").select("id, status").eq("id", payoutId).single();
  if (!payout) return { error: "Payout not found." };
  if (payout.status !== "recorded") return { error: "Only a recorded payout can be marked paid." };
  const { error } = await admin.from("payouts")
    .update({ status: "paid", method, reference, paid_at: new Date().toISOString() }).eq("id", payoutId);
  if (error) return { error: error.message };
  await admin.from("audit_log").insert({ actor_user_id: adminId, actor_type: "admin", action: "payout.paid", entity_type: "payout", entity_id: payoutId });
  return { ok: true };
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/web && npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/payouts/actions.ts
git commit -m "feat(app): payout details, recording and mark-paid actions"
```

---

## Task 11: Payment & payout notification templates

**Files:**
- Create: `supabase/migrations/0027_payment_notification_templates.sql`
- Modify: `apps/web/src/app/api/stripe/webhook/route.ts` (send receipt), `apps/web/src/lib/payouts/actions.ts` (send payout notice)

- [ ] **Step 1: Write the migration**

```sql
alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded','password_reset'));

insert into notification_templates (type, subject, body) values
  ('payment_receipt','Payment received','We have received your payment for booking {{booking_id}}.'),
  ('payout_recorded','Payout recorded','A payout of {{amount}} has been recorded for booking {{booking_id}}.')
on conflict (type) do nothing;
```

- [ ] **Step 2: Run** (repo root) `npx supabase db reset && npx supabase test db` → all pgTAP PASS (the existing `0025_booking_seed_test` style still holds; no new test required for templates, but confirm nothing breaks).

- [ ] **Step 3: Send the receipt** in the webhook — after a successful reconcile to `succeeded`, add:

```ts
import { sendNotification } from "@/lib/notifications/send";
// ... after the payments update, when status === "succeeded":
const { data: b } = await admin.from("payments").select("payer_user_id").eq("id", payment.id).maybeSingle();
if (b?.payer_user_id) await sendNotification("payment_receipt", b.payer_user_id, { booking_id: String((obj.metadata as Record<string,string> | undefined)?.booking_id ?? "") });
```

- [ ] **Step 4: Send the payout notice** in `recordPayout` — after the audit insert:

```ts
import { sendNotification } from "@/lib/notifications/send";
const { data: proRow } = await admin.from("professionals").select("user_id").eq("id", booking.assigned_professional_id).maybeSingle();
if (proRow?.user_id) await sendNotification("payout_recorded", proRow.user_id, { booking_id: bookingId, amount: String(booking.total_payout) });
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0027_payment_notification_templates.sql apps/web/src/app/api/stripe/webhook/route.ts apps/web/src/lib/payouts/actions.ts
git commit -m "feat(app): payment receipt and payout notifications"
```

---

## Task 12: Professional payout-details page

**Files:**
- Create: `apps/web/src/components/payout-details-form.tsx`, `apps/web/src/app/professional/payout-details/page.tsx`

- [ ] **Step 1: Build the form** (`payout-details-form.tsx`, `"use client"`)

`useState`-driven form: `accountName`, `sortCode`, `accountNumber`; submit calls `savePayoutDetails(...)`; on success shows "Bank details saved — we store only the last 4 digits." Reuse input/label/button classes from `profile-form.tsx`. Accepts a `last4: string | null` prop to display the currently-stored masked number.

- [ ] **Step 2: Build the page** (server component)

```tsx
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PayoutDetailsForm } from "@/components/payout-details-form";
export const dynamic = "force-dynamic";

export default async function PayoutDetailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let last4: string | null = null;
  if (user) {
    const admin = createServiceClient();
    const { data: prof } = await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
    if (prof) {
      const { data } = await admin.rpc("get_payout_last4", { p_professional_id: prof.id });
      last4 = (data as string | null) ?? null;
    }
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-light">Payout details</h1>
      <PayoutDetailsForm last4={last4} />
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd apps/web && npm run lint` → clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/payout-details-form.tsx apps/web/src/app/professional/payout-details
git commit -m "feat(app): professional payout bank-detail entry (encrypted)"
```

---

## Task 13: "Pay now" control + admin finance pages

**Files:**
- Create: `apps/web/src/components/pay-now-button.tsx`
- Modify: `apps/web/src/app/client/bookings/page.tsx`, `apps/web/src/app/organisation/bookings/page.tsx` (add Pay now + payment status), and the professional/admin booking views (Mark completed / No-show)
- Create: `apps/web/src/app/admin/finance/page.tsx`, `apps/web/src/app/admin/finance/payouts/page.tsx`

- [ ] **Step 1: `pay-now-button.tsx`** (`"use client"`)

Calls `startCheckout(bookingId)`; on `ok` with `url`, `window.location.href = url`; on error shows the message. Render it on the requester's `accepted`/`assigned` bookings that aren't yet paid. Add a payment-status column (read each booking's latest `payments.status`).

- [ ] **Step 2: Completion controls**

In `professional-bookings.tsx`, add a "Mark completed" button on the professional's `accepted`/`assigned` rows calling `completeBooking(id)`. In `admin-bookings.tsx`, add "Mark completed" and "No-show" (calling `completeBooking`/`markNoShow`) for non-terminal rows.

- [ ] **Step 3: `admin/finance/page.tsx`** (server component, service client)

Load `payments` (join booking + requester) and `payouts` (join professional) for a transaction list; load `v_platform_revenue` and sum `platform_revenue` over bookings whose payment is `succeeded` for the revenue headline. Provide simple from/to date inputs (query params). Show totals: collected, paid out, platform revenue.

- [ ] **Step 4: `admin/finance/payouts/page.tsx`** (server component, service client)

List `completed` bookings with a `succeeded` payment and no payout yet → "Record payout" (`recordPayout(bookingId)`); list `recorded` payouts → "Mark paid" (`markPayoutPaid`). Show the professional name + `get_payout_last4`.

- [ ] **Step 5: Verify**

Run: `cd apps/web && npm run lint` → clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/pay-now-button.tsx apps/web/src/app/client/bookings apps/web/src/app/organisation/bookings apps/web/src/components/professional-bookings.tsx apps/web/src/components/admin-bookings.tsx apps/web/src/app/admin/finance
git commit -m "feat(app): pay-now, completion controls, and admin finance pages"
```

---

## Task 14: End-to-end payments + payout flow (Stripe mocked)

**Files:**
- Create: `apps/web/e2e/payments-admin.spec.ts`

- [ ] **Step 1: Write the E2E spec**

Model it on `e2e/bookings.spec.ts`. Because real Stripe calls are not made in CI, drive the money state via the **webhook + DB** rather than the hosted Checkout page:
1. Seed an approved professional + a client; create an `accepted` booking (service-client fixture, like the bookings spec).
2. Insert a `payments` row (`status='pending'`, a synthetic `stripe_payment_intent_id`).
3. Build a **locally-signed** Stripe event with `stripe.webhooks.generateTestHeaderString` (use the test `STRIPE_WEBHOOK_SECRET`) for `payment_intent.succeeded` carrying that intent id, POST it to `/api/stripe/webhook`; assert 200 and the `payments` row flips to `succeeded`.
4. Re-POST the same event; assert it stays `succeeded` (idempotent) and no duplicate side effects.
5. Professional marks the booking `completed` (UI or `completeBooking`); admin records payout → assert a `payouts` row (`status='recorded'`, `amount = total_payout`).
6. Admin marks payout paid → `status='paid'`.
7. Refund path: cancel a paid booking; POST a signed `charge.refunded` event for its intent → `payments.status='refunded'`.

Set `STRIPE_WEBHOOK_SECRET` for the test run (e.g. `whsec_test_...`) so both the route and the test signer agree.

- [ ] **Step 2: Run the suite**

```bash
# from repo root: ensure local stack is up and migrated
npx supabase start && npx supabase db reset
cd apps/web
STRIPE_WEBHOOK_SECRET="whsec_test_carebridge" npm run e2e -- payments-admin.spec.ts
```
Expected: all payments/payout scenarios PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/payments-admin.spec.ts
git commit -m "test(app): payments webhook + payout recording E2E (Stripe mocked)"
```

---

## Final verification

- [ ] `cd apps/web && npm run test` → all Vitest pass (new: stripe/client, stripe/checkout, stripe/events, payouts/record, transitions complete edges).
- [ ] repo root `npx supabase db reset && npx supabase test db` → all pgTAP pass (incl. `0027_payout_crypto_test`).
- [ ] `cd apps/web && STRIPE_WEBHOOK_SECRET=whsec_test_carebridge npm run e2e` → all Playwright pass.
- [ ] `cd apps/web && npm run lint && npm run build` → clean.

## Acceptance (from spec)

Client pays the charge via Checkout once staffed; webhook reconciles `payments` idempotently; a completed+paid booking's payout is recordable (amount = `total_payout`) with encrypted bank details and a pending→recorded→paid trail; paid+cancelled bookings refundable in-app; revenue report sums platform fee over paid bookings; every money action audited.

## Notes / open checks for the implementer

- Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYOUT_ENC_KEY`, `NEXT_PUBLIC_APP_URL` to `.env.local` (and hosted env at deploy). Never commit real keys. `PAYOUT_ENC_KEY` must be stable — rotating it makes existing encrypted bank details unreadable.
- Confirm the `notification_templates_type_check` constraint name before the `0027` migration's `drop constraint` (default expected: `notification_templates_type_check`).
- The webhook route must NOT be behind the auth proxy/middleware — verify `src/proxy.ts` matcher excludes `/api/stripe/webhook`.
- `numeric` columns may arrive as strings from supabase-js — wrap money fields in `Number(...)` where used in arithmetic (as the S2 `toRateCard` does).
- Stripe is **test mode** throughout S3a; live keys (under CareBridge Connect Ltd) are wired at launch.
```
