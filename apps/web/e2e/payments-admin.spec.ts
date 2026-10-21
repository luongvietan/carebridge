import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { randomUUID } from 'node:crypto';
import { buildBookingInsert } from "../src/lib/bookings/create";
import type { RateCard } from "../src/lib/rates/snapshot";

const PASSWORD = "password123";

// ---------------------------------------------------------------------------
// Service client
// ---------------------------------------------------------------------------

function service(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ---------------------------------------------------------------------------
// Stripe signed-event helper
// Stripe.webhooks.generateTestHeaderString lives on the instance, not the class.
// ---------------------------------------------------------------------------

const _stripeInstance = new Stripe("sk_test_placeholder");

function signedEvent(type: string, dataObject: Record<string, unknown>) {
  const payload = JSON.stringify({
    id: `evt_${randomUUID()}`,
    created: Math.floor(Date.now()/1000),
    livemode: false,
    type,
    data: { object: dataObject },
  });
  const header = _stripeInstance.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  return { payload, header };
}

// ---------------------------------------------------------------------------
// Seed helpers (mirror bookings.spec.ts patterns)
// ---------------------------------------------------------------------------

async function rnRoleId(sb: SupabaseClient) {
  const { data: role } = await sb
    .from("professional_roles")
    .select("id")
    .eq("code", "adult_nurse")
    .single();
  if (!role) throw new Error("adult_nurse role missing");
  return role.id as string;
}

async function seedAdmin(sb: SupabaseClient, stamp: number) {
  const email = `padmin_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { market: "GB", preferred_locale: "en-GB", account_type: "admin", full_name: "Pay E2E Admin" },
  });
  if (error || !data.user) throw error ?? new Error("admin user");
  // Signup metadata can't grant admin (0031 hardening downgrades it to
  // private_client); promote the trusted service-role-created test admin.
  await sb.from("users").update({ account_type: "admin" }).eq("id", data.user.id);
  return { email, userId: data.user.id };
}

async function seedClient(sb: SupabaseClient, stamp: number) {
  const email = `pclient_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { market: "GB", preferred_locale: "en-GB", account_type: "private_client", full_name: "Pay E2E Client" },
  });
  if (error || !data.user) throw error ?? new Error("client user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: client, error: cErr } = await sb
    .from("private_clients")
    .insert({ user_id: data.user.id, full_name: "Pay E2E Client", stripe_customer_id: "cus_stub_paye2e", address_line1: "1 Test Street", city: "Manchester", postcode: "M1 1AA" })
    .select("id")
    .single();
  if (cErr || !client) throw cErr ?? new Error("private_clients insert");
  return { email, userId: data.user.id, clientId: client.id as string };
}

async function seedEligiblePro(sb: SupabaseClient, stamp: number, roleId: string) {
  const name = `PayPro${stamp}`;
  const email = `ppro_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { market: "GB", preferred_locale: "en-GB", account_type: "professional", full_name: name },
  });
  if (error || !data.user) throw error ?? new Error("pro user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: pro, error: pErr } = await sb
    .from("professionals")
    .insert({
      user_id: data.user.id,
      full_name: name,
      professional_role_id: roleId,
      professional_status: "active",
      compliance_status: "approved",
    })
    .select("id")
    .single();
  if (pErr || !pro) throw pErr ?? new Error("professional insert");
  return { email, userId: data.user.id, proId: pro.id as string, name };
}

function slot(hoursFromNow: number, durationHours: number) {
  const start = new Date(Date.now() + hoursFromNow * 3_600_000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

async function seedBooking(
  sb: SupabaseClient,
  opts: {
    requesterUserId: string;
    privateClientId: string;
    professionalRoleId: string;
    proId: string;
    initialStatus: string;
    locationAddress: string;
  },
) {
  const { startIso, endIso } = slot(48, 4);

  const { data: rateCard, error: rcErr } = await sb
    .from("rate_cards")
    .select("id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency")
    .eq("professional_role_id", opts.professionalRoleId)
    .is("effective_to", null)
    .single();
  if (rcErr || !rateCard) throw rcErr ?? new Error("rate card missing");

  const insertData = buildBookingInsert(
    {
      requesterUserId: opts.requesterUserId,
      privateClientId: opts.privateClientId,
      professionalRoleId: opts.professionalRoleId,
      scheduledStart: startIso,
      scheduledEnd: endIso,
      locationAddress: opts.locationAddress,
    },
    rateCard as RateCard,
  );

  const { data: booking, error } = await sb
    .from("bookings")
    .insert({
      ...insertData,
      created_by: opts.requesterUserId,
      status: opts.initialStatus,
      assigned_professional_id: opts.proId,
    })
    .select("id, total_payout, scheduled_start, scheduled_end")
    .single();
  if (error || !booking) throw error ?? new Error("booking insert");

  await sb.from("booking_status_history").insert({
    booking_id: booking.id,
    to_status: opts.initialStatus,
    changed_by: opts.requesterUserId,
  });

  return booking;
}

async function seedPayment(
  sb: SupabaseClient,
  opts: { bookingId: string; payerUserId: string; intentId: string; status: string; amount: number },
) {
  const { data, error } = await sb
    .from("payments")
    .insert({
      booking_id: opts.bookingId,
      payer_user_id: opts.payerUserId,
      stripe_payment_intent_id: opts.intentId,
      amount: opts.amount,
      status: opts.status,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("payments insert");
  return data.id as string;
}

async function login(page: import("@playwright/test").Page, email: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^(Sign in|Entrar)$/i }).click();
  await expect(page).toHaveURL(urlPattern);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("webhook: decline remains retryable, concurrent success and replay settle once", async ({ request }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const intentId = `pi_test_${stamp}`;

  const booking = await seedBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    proId: pro.proId,
    initialStatus: "accepted",
    locationAddress: `WebhookTest ${stamp}`,
  });
  const paymentId = await seedPayment(sb, {
    bookingId: booking.id,
    payerUserId: client.userId,
    intentId,
    status: "pending",
    amount: Number(booking.total_payout),
  });

  const decline=signedEvent('payment_intent.payment_failed',{id:intentId,metadata:{payment_id:paymentId,booking_id:booking.id}});
  const declined=await request.post('/api/stripe/webhook',{headers:{'stripe-signature':decline.header},data:decline.payload});
  expect(declined.status()).toBe(200);
  expect((await sb.from('payments').select('status').eq('id',paymentId).single()).data?.status).toBe('pending');

  // Deliver the identical success concurrently: row changes and audit are atomic.
  const { payload, header } = signedEvent("payment_intent.succeeded", { id: intentId, amount_received:Math.round(Number(booking.total_payout)*100),currency:'gbp' });
  const deliveries=await Promise.all(Array.from({length:4},()=>request.post("/api/stripe/webhook", {
    headers: { "stripe-signature": header, "content-type": "application/json" },
    data: payload,
  })));
  expect(deliveries.map(r=>r.status())).toEqual([200,200,200,200]);
  const audits=await sb.from('audit_log').select('id',{count:'exact',head:true}).eq('entity_id',paymentId).eq('action','payment.succeeded');
  expect(audits.count).toBe(1);
  const receipts=await sb.from('notifications').select('id',{count:'exact',head:true}).eq('recipient_user_id',client.userId).eq('type','payment_receipt');
  expect(receipts.count).toBe(1);

  const { data: after1 } = await sb
    .from("payments")
    .select("status, paid_at")
    .eq("id", paymentId)
    .single();
  expect(after1?.status).toBe("succeeded");
  expect(after1?.paid_at).not.toBeNull();
  const paidAt1 = after1!.paid_at;

  // --- Second delivery (same event — idempotent) ---
  // Re-sign with the same intentId (new timestamp header is fine; same intent)
  const payload2=payload, header2=header;
  const res2 = await request.post("/api/stripe/webhook", {
    headers: { "stripe-signature": header2, "content-type": "application/json" },
    data: payload2,
  });
  expect(res2.status()).toBe(200);

  const { data: after2 } = await sb
    .from("payments")
    .select("status, paid_at")
    .eq("id", paymentId)
    .single();
  expect(after2?.status).toBe("succeeded");
  // paid_at must not have changed (no re-write on idempotent delivery)
  expect(after2?.paid_at).toBe(paidAt1);

  // Cleanup
  await sb.from("payments").delete().eq("id", paymentId);
  await sb.from("bookings").delete().eq("id", booking.id);
  await sb.auth.admin.deleteUser(client.userId);
  await sb.auth.admin.deleteUser(pro.userId);
});

test('refund reservation holds payouts; asynchronous failure restores the balance',async({request})=>{
  const sb=service(),stamp=Date.now()+20;
  const roleId=await rnRoleId(sb),client=await seedClient(sb,stamp),pro=await seedEligiblePro(sb,stamp+1,roleId),admin=await seedAdmin(sb,stamp+2);
  const booking=await seedBooking(sb,{requesterUserId:client.userId,privateClientId:client.clientId,professionalRoleId:roleId,proId:pro.proId,initialStatus:'completed',locationAddress:`RefundHold ${stamp}`});
  const amount=Number(booking.total_payout),intentId=`pi_hold_${stamp}`;
  const paymentId=await seedPayment(sb,{bookingId:booking.id,payerUserId:client.userId,intentId,status:'succeeded',amount});
  const {data:reserved,error}=await sb.rpc('request_stripe_refund',{p_payment_id:paymentId,p_actor_id:admin.userId,p_reason:'Sandbox client cancellation'});
  expect(error).toBeNull();expect(reserved).toHaveProperty('id');
  const held=await sb.from('payouts').insert({booking_id:booking.id,professional_id:pro.proId,amount,currency:'GBP',status:'recorded'});
  expect(held.error?.message).toMatch(/refund pending/i);
  const item={id:`re_hold_${stamp}`,payment_intent:intentId,amount:Math.round(amount*100),currency:'gbp',metadata:{refund_request_id:reserved.id,payment_id:paymentId,booking_id:booking.id}};
  for(const [index,status] of ['succeeded','failed','succeeded'].entries()){
    const event=signedEvent(status==='failed'?'refund.failed':'refund.updated',{...item,status});
    const response=await request.post('/api/stripe/webhook',{headers:{'stripe-signature':event.header},data:event.payload});
    expect(response.status()).toBe(200);
    const row=(await sb.from('payments').select('status,refunded_amount,refund_pending').eq('id',paymentId).single()).data;
    // The last success is stale: a refund failure is terminal.
    if(index===0)expect(row).toMatchObject({status:'refunded',refunded_amount:amount,refund_pending:false});
    else expect(row).toMatchObject({status:'succeeded',refunded_amount:0,refund_pending:false});
  }
  const ledger=(await sb.from('stripe_refund_items').select('status').eq('id',item.id).single()).data;
  expect(ledger?.status).toBe('failed');
  await sb.from('stripe_refund_items').delete().eq('payment_id',paymentId);
  await sb.from('stripe_refund_requests').delete().eq('payment_id',paymentId);
  await sb.from('payments').delete().eq('id',paymentId);
  await sb.from('bookings').delete().eq('id',booking.id);
  await sb.auth.admin.deleteUser(admin.userId);
  await sb.auth.admin.deleteUser(client.userId);
  await sb.auth.admin.deleteUser(pro.userId);
});

test("payout recording: admin records payout and marks it paid via UI", async ({ page }) => {
  const sb = service();
  const stamp = Date.now() + 1;
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const admin = await seedAdmin(sb, stamp + 2);
  const intentId = `pi_payout_${stamp}`;

  // Seed a completed booking with a succeeded payment
  const booking = await seedBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    proId: pro.proId,
    initialStatus: "completed",
    locationAddress: `PayoutTest ${stamp}`,
  });
  const paymentId = await seedPayment(sb, {
    bookingId: booking.id,
    payerUserId: client.userId,
    intentId,
    status: "succeeded",
    amount: Number(booking.total_payout),
  });

  // Since 0071 a payout cannot be recorded until the hours worked have been
  // confirmed by the client, so the fixture confirms them.
  await sb.from("timesheets").insert({
    booking_id: booking.id,
    professional_id: pro.proId,
    actual_start: booking.scheduled_start,
    actual_end: booking.scheduled_end,
    break_minutes: 0,
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
  });

  // Log in as admin and visit payouts page
  await login(page, admin.email, /\/admin/);
  await page.goto("/admin/finance/payouts");

  // The booking should appear in "Awaiting payout" — scope to that section
  const awaitingSection = page.locator("section", { hasText: "Awaiting payout" });
  const proRow = awaitingSection.locator("tr", { hasText: pro.name });
  await expect(proRow).toBeVisible({ timeout: 15_000 });

  // Click "Record payout"
  await proRow.getByRole("button", { name: /record payout/i }).click();

  // After router.refresh() the row should disappear from "Awaiting payout"
  await expect(proRow).toBeHidden({ timeout: 15_000 });

  // Assert DB: a payouts row with status='recorded'
  const { data: payoutRow } = await sb
    .from("payouts")
    .select("id, status, amount")
    .eq("booking_id", booking.id)
    .single();
  expect(payoutRow?.status).toBe("recorded");
  expect(Number(payoutRow?.amount)).toBeCloseTo(Number(booking.total_payout), 2);

  // Now the row should appear in "Recorded — awaiting bank transfer" section
  const recordedSection = page.locator("section", { hasText: "Recorded" });
  const recordedRow = recordedSection.locator("tr", { hasText: pro.name });
  await expect(recordedRow).toBeVisible({ timeout: 15_000 });

  // Fill in reference and click "Mark paid"
  await recordedRow.locator('input[placeholder="Reference"]').fill("REF-E2E-001");
  await recordedRow.getByRole("button", { name: /mark paid/i }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^confirm payment$/i }).click();

  // Row should disappear from recorded section after refresh
  await expect(recordedRow).toBeHidden({ timeout: 15_000 });

  // Assert DB: payout status='paid' with reference
  const { data: paidRow } = await sb
    .from("payouts")
    .select("id, status, reference, paid_at")
    .eq("id", payoutRow!.id)
    .single();
  expect(paidRow?.status).toBe("paid");
  expect(paidRow?.reference).toBe("REF-E2E-001");
  expect(paidRow?.paid_at).not.toBeNull();

  // Cleanup
  await sb.from("payouts").delete().eq("id", payoutRow!.id);
  await sb.from("payments").delete().eq("id", paymentId);
  await sb.from("bookings").delete().eq("id", booking.id);
  await sb.auth.admin.deleteUser(admin.userId);
  await sb.auth.admin.deleteUser(client.userId);
  await sb.auth.admin.deleteUser(pro.userId);
});

test("webhook: checkout.session.completed reconciles via metadata.payment_id and backfills intent id", async ({ request }) => {
  const sb = service();
  const stamp = Date.now() + 3;
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const csId = `cs_test_${stamp}`;
  const intentId = `pi_cs_${stamp}`;

  const booking = await seedBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    proId: pro.proId,
    initialStatus: "accepted",
    locationAddress: `CheckoutTest ${stamp}`,
  });

  // Insert a payments row with stripe_payment_intent_id = null (intent not yet known at session creation)
  const { data: pmtData, error: pmtErr } = await sb
    .from("payments")
    .insert({
      booking_id: booking.id,
      payer_user_id: client.userId,
      stripe_payment_intent_id: null,
      amount: Number(booking.total_payout),
      status: "pending",
    })
    .select("id")
    .single();
  if (pmtErr || !pmtData) throw pmtErr ?? new Error("payments insert");
  const paymentId = pmtData.id as string;

  // Completion can arrive before payment; it must leave the ledger pending.
  const unpaid = signedEvent("checkout.session.completed", {
    id: `${csId}_unpaid`,
    amount_total:Math.round(Number(booking.total_payout)*100),currency:'gbp',
    payment_status: "unpaid",
    payment_intent: intentId,
    metadata: { payment_id: paymentId, booking_id: booking.id },
  });
  const unpaidResponse = await request.post("/api/stripe/webhook", {
    headers: { "stripe-signature": unpaid.header, "content-type": "application/json" },
    data: unpaid.payload,
  });
  expect(unpaidResponse.status()).toBe(200);
  const { data: pending } = await sb.from("payments")
    .select("status, paid_at, stripe_payment_intent_id").eq("id", paymentId).single();
  expect(pending).toMatchObject({ status: "pending", paid_at: null, stripe_payment_intent_id: intentId });

  // A paid completion reconciles using metadata and backfills the intent id.
  const { payload, header } = signedEvent("checkout.session.completed", {
    id: csId,
    amount_total:Math.round(Number(booking.total_payout)*100),currency:'gbp',
    payment_status: "paid",
    payment_intent: intentId,
    metadata: { payment_id: paymentId, booking_id: booking.id },
  });
  const res = await request.post("/api/stripe/webhook", {
    headers: { "stripe-signature": header, "content-type": "application/json" },
    data: payload,
  });
  expect(res.status()).toBe(200);

  const { data: after } = await sb
    .from("payments")
    .select("status, paid_at, stripe_payment_intent_id")
    .eq("id", paymentId)
    .single();
  expect(after?.status).toBe("succeeded");
  expect(after?.paid_at).not.toBeNull();
  // Intent id must have been backfilled from the event
  expect(after?.stripe_payment_intent_id).toBe(intentId);

  // Cleanup
  await sb.from("payments").delete().eq("id", paymentId);
  await sb.from("bookings").delete().eq("id", booking.id);
  await sb.auth.admin.deleteUser(client.userId);
  await sb.auth.admin.deleteUser(pro.userId);
});

test("webhook: charge.refunded sets payment status to refunded", async ({ request }) => {
  const sb = service();
  const stamp = Date.now() + 2;
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const intentId = `pi_ref_${stamp}`;

  const booking = await seedBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    proId: pro.proId,
    initialStatus: "accepted",
    locationAddress: `RefundTest ${stamp}`,
  });
  const paymentId = await seedPayment(sb, {
    bookingId: booking.id,
    payerUserId: client.userId,
    intentId,
    status: "succeeded",
    amount: Number(booking.total_payout),
  });

  // POST a FULL charge.refunded event. Stripe marks a fully-refunded charge with
  // refunded: true and amount_refunded equal to the captured amount; since audit
  // v3 a partial refund deliberately leaves the payment `succeeded`, so an event
  // carrying no amounts at all is a £0 partial and must not flip the status.
  const capturedPence = Math.round(Number(booking.total_payout) * 100);
  const { payload, header } = signedEvent("charge.refunded", {
    id: `ch_ref_${stamp}`,
    payment_intent: intentId,
    metadata: {payment_id:paymentId,booking_id:booking.id},
    refunded: true,
    amount_captured: capturedPence,
    currency:'gbp',
    amount_refunded: capturedPence,
    refunds: {has_more:false,data:[{id:`re_test_${stamp}`,payment_intent:intentId,status:'succeeded',amount:capturedPence,currency:'gbp'}]},
  });
  const res = await request.post("/api/stripe/webhook", {
    headers: { "stripe-signature": header, "content-type": "application/json" },
    data: payload,
  });
  expect(res.status()).toBe(200);

  const { data: after } = await sb
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .single();
  expect(after?.status).toBe("refunded");

  // Cleanup
  await sb.from("payments").delete().eq("id", paymentId);
  await sb.from("bookings").delete().eq("id", booking.id);
  await sb.auth.admin.deleteUser(client.userId);
  await sb.auth.admin.deleteUser(pro.userId);
});
