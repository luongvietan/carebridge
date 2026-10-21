import type Stripe from 'stripe';
import { stripe } from './client';

// Refund items are tracked individually. Charge snapshots may contain pending
// refunds, and their embedded list can be truncated.
export async function refundEventForLedger(event: {id:string;type:string;data:{object:unknown}}) {
  const object = event.data.object as Stripe.Refund | Stripe.Charge;
  const intent = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id;
  if (!intent) throw new Error('Refund has no payment intent');
  let metadata = object.metadata ?? {};
  if (!metadata.payment_id) {
    const payment = await stripe().paymentIntents.retrieve(intent);
    metadata = { ...payment.metadata, ...metadata };
  }
  const normalized: Record<string,unknown> = { ...object, payment_intent: intent, metadata };
  if (event.type === 'charge.refunded') {
    const charge = object as Stripe.Charge;
    let refunds = charge.refunds?.data;
    if (!refunds || charge.refunds?.has_more) {
      refunds = [];
      for await (const refund of stripe().refunds.list({ charge: charge.id, limit: 100 })) refunds.push(refund);
    }
    normalized.refunds = { object: 'list', data: refunds, has_more: false, url: '/v1/refunds' };
  }
  return { id:event.id,type:event.type,data:{object:normalized} };
}
