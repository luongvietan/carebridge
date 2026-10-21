import { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/service';
import type { Json } from '@/lib/supabase/types';
import { sendNotification } from '@/lib/notifications/send';
import { refundEventForLedger } from '@/lib/stripe/refund-event';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response('Missing signature', { status: 400 });
  let event: Stripe.Event;
  try { event = stripe().webhooks.constructEvent(await req.text(), signature, secret); }
  catch { return new Response('Invalid signature', { status: 400 }); }
  const liveKey = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ?? false;
  if (event.livemode !== liveKey) return new Response('Wrong Stripe mode', { status: 400 });
  // Event claim, row lock, money checks, state and audit commit together.
  const isRefund = event.type.startsWith('refund.') || event.type === 'charge.refunded';
  let ledgerEvent = event as unknown as Json;
  if (isRefund) {
    try { ledgerEvent = await refundEventForLedger(event) as unknown as Json; }
    catch { return new Response('Refund confirmation unavailable', { status: 500 }); }
  }
  const procedure = isRefund ? 'reconcile_stripe_refund' : 'reconcile_stripe_event';
  const { data, error } = await createServiceClient().rpc(procedure, { p_event: ledgerEvent });
  if (error || !data) return new Response('Reconciliation unavailable', { status: 500 });
  const result = data as { outcome: string; send_receipt: boolean; payer_user_id?: string; booking_id?: string };
  if (result.send_receipt && result.payer_user_id) {
    await sendNotification('payment_receipt', result.payer_user_id, { booking_id: result.booking_id ?? '' });
  }
  return new Response(result.outcome, { status: 200 });
}
