import type Stripe from 'stripe';
export type CheckoutPayment = {
  id: string; booking_id: string; amount: number; currency: string;
  checkout_locale: 'pt' | 'en'; stripe_checkout_session_id: string | null;
};
type SessionClient = Pick<Stripe['checkout']['sessions'], 'create' | 'retrieve'>;
/** The payment key stays stable even when our database write or HTTP reply fails. */
export async function checkoutSessionForPayment(
  sessions: SessionClient, payment: CheckoutPayment,
  urls: { appUrl: string; area: 'client' | 'organisation' },
) {
  const amount = Math.round(payment.amount * 100);
  if (!Number.isSafeInteger(amount) || amount < 50) throw new Error('Invalid payment amount');
  if (!['EUR', 'GBP'].includes(payment.currency.trim().toUpperCase())) throw new Error('Invalid payment currency');
  let session;
  if (payment.stripe_checkout_session_id) {
    session = await sessions.retrieve(payment.stripe_checkout_session_id);
  } else {
    session = await sessions.create({
      mode: 'payment', locale: payment.checkout_locale, client_reference_id: payment.booking_id,
      adaptive_pricing: { enabled: false },
      line_items: [{ quantity: 1, price_data: {
        currency: payment.currency.trim().toLowerCase(), unit_amount: amount,
        // Send no clinical roles or care details to a payment processor.
        product_data: { name: `CareBridge Connect — booking ${payment.booking_id.slice(0,8)}` },
      } }],
      success_url: `${urls.appUrl}/${urls.area}/bookings?checkout=returned&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${urls.appUrl}/${urls.area}/bookings?checkout=cancelled`,
      metadata: { booking_id: payment.booking_id, payment_id: payment.id },
      payment_intent_data: { metadata: { booking_id: payment.booking_id, payment_id: payment.id } },
    }, { idempotencyKey: `checkout:${payment.id}` });
  }
  if (session.status === 'expired') throw new Error('Checkout session expired');
  if (session.status !== 'open' || !session.url) throw new Error('Payment is being confirmed');
  return session;
}
