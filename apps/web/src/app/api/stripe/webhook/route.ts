import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { paymentStatusForEvent } from "@/lib/stripe/events";
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

  const obj = event.data.object as unknown as Record<string, unknown>;
  const intentId =
    (obj.payment_intent as string | undefined) ??
    (event.type.startsWith("payment_intent.") ? (obj.id as string) : undefined);
  if (!intentId) return new Response("no intent", { status: 200 });

  const admin = createServiceClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, payer_user_id, booking_id")
    .eq("stripe_payment_intent_id", intentId)
    .maybeSingle();
  if (!payment) return new Response("no payment row", { status: 200 });
  if (payment.status === status) return new Response("already reconciled", { status: 200 });

  const { error: updateErr } = await admin
    .from("payments")
    .update({ status, ...(status === "succeeded" ? { paid_at: new Date().toISOString() } : {}) })
    .eq("id", payment.id);
  if (updateErr) return new Response("db error", { status: 500 });
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
