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
  const metadata = obj.metadata as Record<string, string> | undefined;
  const paymentIdMeta = metadata?.payment_id;
  const intentId =
    (typeof obj.payment_intent === "string" ? obj.payment_intent : undefined) ??
    (event.type.startsWith("payment_intent.") ? (obj.id as string) : undefined);

  const admin = createServiceClient();
  const sel = "id, status, payer_user_id, booking_id, stripe_payment_intent_id";
  let payment: { id: string; status: string; payer_user_id: string | null; booking_id: string | null; stripe_payment_intent_id: string | null } | null = null;
  if (paymentIdMeta) {
    ({ data: payment } = await admin.from("payments").select(sel).eq("id", paymentIdMeta).maybeSingle());
  } else if (intentId) {
    ({ data: payment } = await admin.from("payments").select(sel).eq("stripe_payment_intent_id", intentId).maybeSingle());
  }
  if (!payment) return new Response("no payment row", { status: 200 });
  if (payment.status === status) return new Response("already reconciled", { status: 200 });

  const patch: { status: typeof status; paid_at?: string; stripe_payment_intent_id?: string } = { status };
  if (status === "succeeded") patch.paid_at = new Date().toISOString();
  if (intentId && !payment.stripe_payment_intent_id) patch.stripe_payment_intent_id = intentId;
  const { error: updateErr } = await admin.from("payments").update(patch).eq("id", payment.id);
  if (updateErr) return new Response("db error", { status: 500 });

  await admin.from("audit_log").insert({
    actor_type: "system", action: `payment.${status}`, entity_type: "payment", entity_id: payment.id, summary: event.type,
  });
  if (status === "succeeded" && payment.payer_user_id) {
    await sendNotification("payment_receipt", payment.payer_user_id, { booking_id: payment.booking_id ?? "" });
  }

  return new Response("ok", { status: 200 });
}
