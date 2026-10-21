import { describe, expect, it, vi } from 'vitest';
import { checkoutSessionForPayment } from './session';
const payment={id:'payment-one',booking_id:'booking-one',amount:125.50,currency:'EUR',checkout_locale:'en' as const,stripe_checkout_session_id:null as string|null};
const urls={appUrl:'https://carebridge.example',area:'client' as const};
const stripeSession={id:'cs_test_one',url:'https://checkout.stripe.com/test-one',status:'open',payment_status:'unpaid'};
function client(session: typeof stripeSession = stripeSession) {
  return {create:vi.fn().mockResolvedValue(session),retrieve:vi.fn().mockResolvedValue(session)};
}
describe('checkoutSessionForPayment',()=>{
  it('uses a stable payment idempotency key, saved language and snapshotted money',async()=>{
    const api=client();
    const result=await checkoutSessionForPayment(api,payment,urls);
    expect(result.id).toBe('cs_test_one');
    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({locale:'en',client_reference_id:'booking-one',line_items:[{quantity:1,price_data:{currency:'eur',unit_amount:12550,product_data:{name:'CareBridge Connect — booking booking-'}}}],success_url:'https://carebridge.example/client/bookings?checkout=returned&session_id={CHECKOUT_SESSION_ID}',metadata:{booking_id:'booking-one',payment_id:'payment-one'}}),{idempotencyKey:'checkout:payment-one'});
  });
  it('reuses the existing open Stripe session without creating another',async()=>{
    const api=client();
    expect((await checkoutSessionForPayment(api,{...payment,stripe_checkout_session_id:'cs_test_one'},urls)).id).toBe('cs_test_one');
    expect(api.create).not.toHaveBeenCalled();
    expect(api.retrieve).toHaveBeenCalledWith('cs_test_one');
  });
  it('does not open another session while a completed payment awaits its webhook',async()=>{
    const api=client({...stripeSession,status:'complete'});
    await expect(checkoutSessionForPayment(api,{...payment,stripe_checkout_session_id:'cs_test_one'},urls)).rejects.toThrow('Payment is being confirmed');
    expect(api.create).not.toHaveBeenCalled();
  });
  it('distinguishes an expired session so the caller can close the attempt',async()=>{
    const api=client({...stripeSession,status:'expired'});
    await expect(checkoutSessionForPayment(api,{...payment,stripe_checkout_session_id:'cs_test_one'},urls)).rejects.toThrow('Checkout session expired');
  });
  it.each([0,-10,NaN,Infinity])('rejects invalid amount %s before contacting Stripe',async amount=>{
    const api=client();
    await expect(checkoutSessionForPayment(api,{...payment,amount},urls)).rejects.toThrow('Invalid payment amount');
    expect(api.create).not.toHaveBeenCalled();
  });
});
