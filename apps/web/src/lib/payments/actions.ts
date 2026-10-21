"use server";
import { getAppUrl } from '@/lib/app-url';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/auth/require-auth';
import { stripe } from '@/lib/stripe/client';
import { checkoutSessionForPayment, type CheckoutPayment } from '@/lib/stripe/session';

export type PaymentActionResult = { ok: true; url?: string } | { error: string };
const PAYMENT_FIELDS = 'id,booking_id,amount,currency,checkout_locale,stripe_checkout_session_id';

export async function startCheckout(bookingId: string): Promise<PaymentActionResult> {
  const user = await requireAuth();
  const admin = createServiceClient();
  const { data: account, error: accountError } = await admin.from('users').select('account_type,preferred_locale').eq('id',user.id).single();
  if (accountError || !['private_client','organisation'].includes(account?.account_type)) return { error: 'This account cannot start a booking payment.' };
  const area = account.account_type === 'organisation' ? 'organisation' : 'client';
  const { data: booking, error: bookingError } = await admin.from('bookings')
    .select('id,status,requester_user_id,total_client_charge,snap_currency').eq('id',bookingId).single();
  if (bookingError || !booking) return { error: 'Booking not found.' };
  if (booking.requester_user_id !== user.id) return { error: 'This is not your booking.' };
  if (!['accepted','assigned'].includes(booking.status)) return { error: 'This booking is not ready for payment.' };
  try {
    // A genuinely expired session frees its old attempt; it cannot charge again.
    // Only one replacement is needed, and every create has a stable Stripe key.
    for (let attempt=0; attempt<2; attempt++) {
      const { count, error: paidError } = await admin.from('payments').select('id',{count:'exact',head:true})
        .eq('booking_id',bookingId).in('status',['succeeded','refunded']);
      if (paidError) throw new Error('Payment lookup failed');
      if ((count ?? 0)>0) return { error: 'This booking is already paid.' };
      const { data: existing, error: lookupError } = await admin.from('payments').select(PAYMENT_FIELDS)
        .eq('booking_id',bookingId).eq('status','pending').maybeSingle();
      if (lookupError) throw new Error('Payment lookup failed');
      let payment = existing;
      if (!payment) {
        const { data: created, error: insertError } = await admin.from('payments').insert({
          booking_id:bookingId,payer_user_id:user.id,amount:Number(booking.total_client_charge),
          currency:booking.snap_currency,status:'pending',checkout_locale:account.preferred_locale==='en-GB'?'en':'pt',
        }).select(PAYMENT_FIELDS).single();
        payment=created;
        if (insertError?.code==='23505') {
          const { data: winner, error: winnerError } = await admin.from('payments').select(PAYMENT_FIELDS)
            .eq('booking_id',bookingId).eq('status','pending').maybeSingle();
          if (winnerError) throw new Error('Payment lookup failed');
          payment=winner;
        } else if (insertError) throw new Error('Payment reservation failed');
      }
      if (!payment) throw new Error('Payment reservation unavailable');
      let session;
      try {
        session=await checkoutSessionForPayment(stripe().checkout.sessions,{...payment,amount:Number(payment.amount)} as CheckoutPayment,{appUrl:getAppUrl(),area});
      } catch (error) {
        if (error instanceof Error && error.message==='Checkout session expired') {
          const { error: expireError } = await admin.from('payments').update({status:'failed'})
            .eq('id',payment.id).eq('status','pending');
          if (expireError) throw new Error('Could not close expired attempt', {cause:error});
          continue;
        }
        if (error instanceof Error && error.message==='Payment is being confirmed') return { error:'Payment is being confirmed. Refresh your bookings shortly.' };
        throw error;
      }
      const { data: saved, error: saveError } = await admin.from('payments').update({stripe_checkout_session_id:session.id})
        .eq('id',payment.id).eq('status','pending').select('id').maybeSingle();
      if (saveError || !saved) throw new Error('Could not save Checkout session');
      return {ok:true,url:session.url!};
    }
  } catch {
    // Provider details and credentials stay on the server. A pending row can be
    // retried with the SAME idempotency key after a transient failure.
    return {error:'Could not start payment. Please try again.'};
  }
  return {error:'Could not start payment. Please try again.'};
}
