import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { isAllowedTransition, paymentStatusForEvent, refundInfoFromCharge } from "@/lib/stripe/events";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/notifications/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const status = paymentStatusForEvent(event.type);
  if (!status) return new Response("ignored", { status: 200 });

  const admin = createServiceClient();

  // Idempotency: insert event.id and treat unique-violation as already handled.
  // 23505 = unique_violation.
  const { error: dedupErr } = await admin
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });
  if (dedupErr) {
    if ((dedupErr as { code?: string }).code === "23505") {
      return new Response("already processed", { status: 200 });
    }
    return new Response("db error", { status: 500 });
  }

  // If processing fails after we have claimed the event, release the idempotency
  // claim so Stripe's retry of the SAME event is reprocessed rather than being
  // short-circuited as "already processed" (which would strand the payment).
  const releaseClaim = async () => {
    await admin.from("stripe_webhook_events").delete().eq("event_id", event.id);
  };

  const obj = event.data.object as unknown as Record<string, unknown>;
  const metadata = obj.metadata as Record<string, string> | undefined;
  const paymentIdMeta = metadata?.payment_id;
  const intentId =
    (typeof obj.payment_intent === "string" ? obj.payment_intent : undefined) ??
    (event.type.startsWith("payment_intent.") ? (obj.id as string) : undefined);

  const sel = "id, status, payer_user_id, booking_id, stripe_payment_intent_id, refunded_at, amount";
  let payment:
    | { id: string; status: string; payer_user_id: string | null; booking_id: string | null; stripe_payment_intent_id: string | null; refunded_at: string | null; amount: number }
    | null = null;
  if (paymentIdMeta) {
    ({ data: payment } = await admin.from("payments").select(sel).eq("id", paymentIdMeta).maybeSingle());
  } else if (intentId) {
    ({ data: payment } = await admin.from("payments").select(sel).eq("stripe_payment_intent_id", intentId).maybeSingle());
  }
  if (!payment) {
    // The payment row may not be visible yet (created right before redirect) →
    // retry. But a genuinely orphan event (references an unknown payment) would
    // otherwise 500 on every redelivery for days and then be lost. Bound the
    // retry window by event age: once it's clearly not a replication-lag case,
    // dead-letter it to the audit log and keep the idempotency claim (return 200)
    // so Stripe stops retrying and we still have a durable trace.
    const ageMs = Date.now() - event.created * 1000;
    if (ageMs > 60 * 60 * 1000) {
      await admin.from("audit_log").insert({
        actor_type: "system",
        action: "payment.webhook_orphan",
        entity_type: "payment",
        entity_id: paymentIdMeta ?? intentId ?? event.id,
        summary: `${event.type} — no matching payment row (event ${event.id})`,
      });
      return new Response("orphan event recorded", { status: 200 });
    }
    await releaseClaim();
    return new Response("no payment row", { status: 500 });
  }

  // Enforce monotonic state machine. A late `payment_intent.succeeded` arriving
  // after a `charge.refunded` must NOT revert status to succeeded; a stale
  // `payment_intent.payment_failed` must NOT overwrite a real `succeeded`.
  // Update payments.stripe_webhook_events so we can link the event to the row
  // even when we choose not to mutate state.
  await admin
    .from("stripe_webhook_events")
    .update({ payment_id: payment.id })
    .eq("event_id", event.id);

  // A partial refund must not flip the payment to fully `refunded` (which would
  // freeze the professional's payout). Record the refunded amount and stop.
  // Clamp to the payment amount (a malformed/duplicate event must never store
  // refunded_amount > amount) and only act on a `succeeded` payment (a refund on
  // a pending/failed row is out-of-order and is ignored).
  let refundedAmount: number | null = null;
  if (event.type === "charge.refunded") {
    const info = refundInfoFromCharge(obj as Parameters<typeof refundInfoFromCharge>[0]);
    refundedAmount = Math.min(info.refundedAmount, Number(payment.amount));
    if (!info.isFullRefund) {
      if (payment.status !== "succeeded") {
        return new Response("partial refund ignored for non-succeeded payment", { status: 200 });
      }
      const { error: refundErr } = await admin
        .from("payments")
        .update({ refunded_amount: refundedAmount })
        .eq("id", payment.id);
      if (refundErr) {
        // Don't keep the idempotency claim on a failed write, or Stripe's retry
        // would be short-circuited as "already processed" and the refund lost.
        await releaseClaim();
        return new Response("db error", { status: 500 });
      }
      await admin.from("audit_log").insert({
        actor_type: "system",
        action: "payment.partially_refunded",
        entity_type: "payment",
        entity_id: payment.id,
        summary: `${event.type} — refunded ${refundedAmount}`,
      });
      return new Response("ok", { status: 200 });
    }
  }

  if (!isAllowedTransition(payment.status, status)) {
    return new Response("transition rejected", { status: 200 });
  }

  const patch: {
    status: typeof status;
    paid_at?: string;
    refunded_at?: string;
    refunded_amount?: number;
    stripe_payment_intent_id?: string;
  } = { status };
  if (status === "succeeded") patch.paid_at = new Date().toISOString();
  if (status === "refunded" && !payment.refunded_at) patch.refunded_at = new Date().toISOString();
  if (status === "refunded" && refundedAmount != null) patch.refunded_amount = refundedAmount;
  if (intentId && !payment.stripe_payment_intent_id) patch.stripe_payment_intent_id = intentId;

  const { error: updateErr } = await admin.from("payments").update(patch).eq("id", payment.id);
  if (updateErr) {
    await releaseClaim();
    return new Response("db error", { status: 500 });
  }

  await admin.from("audit_log").insert({
    actor_type: "system",
    action: `payment.${status}`,
    entity_type: "payment",
    entity_id: payment.id,
    summary: event.type,
  });
  if (status === "succeeded" && payment.payer_user_id) {
    await sendNotification("payment_receipt", payment.payer_user_id, { booking_id: payment.booking_id ?? "" });
  }

  return new Response("ok", { status: 200 });
}
