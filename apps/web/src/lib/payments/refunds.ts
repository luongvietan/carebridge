"use server";
import { requireAuth } from '@/lib/auth/require-auth';
import { requireAdmin } from '@/lib/auth/admin';
import { createServiceClient } from '@/lib/supabase/service';
import type { Json } from '@/lib/supabase/types';
import { stripe } from '@/lib/stripe/client';
export async function refundPayment(paymentId: string, reason: string): Promise<{ok:true;pending:boolean}|{error:string}> {
  await requireAuth();
  const actor=await requireAdmin();
  if (!actor) return {error:'Administrator access required.'};
  if (reason.trim().length<5 || reason.trim().length>1000) return {error:'Please enter a refund reason (5–1000 characters).'};
  const db=createServiceClient();
  const {data,error}=await db.rpc('request_stripe_refund',{p_payment_id:paymentId,p_actor_id:actor,p_reason:reason.trim()});
  if (error || !data) return {error:'Could not reserve refund. Check the payment and payout status.'};
  const request=data as {id:string;payment_id:string;booking_id:string;payment_intent:string;amount:number};
  try {
    const refund=await stripe().refunds.create({payment_intent:request.payment_intent,amount:Math.round(Number(request.amount)*100),
      metadata:{refund_request_id:request.id,payment_id:request.payment_id,booking_id:request.booking_id},
    },{idempotencyKey:`refund:${request.id}`});
    // A webhook may arrive before this API response. The same transactional
    // reconciler accepts both and preserves terminal refund state.
    const {data:confirmation,error:saveError}=await db.rpc('reconcile_stripe_refund',{p_event:{
      id:`evt_api_${request.id}_${refund.status}`,type:'refund.updated',data:{object:refund},
    } as unknown as Json});
    if (saveError) return {error:'Refund confirmation is pending. Retry safely to check it again.'};
    const status=(confirmation as {outcome?:string}|null)?.outcome;
    if (status==='failed' || status==='canceled' || refund.status==='failed' || refund.status==='canceled') return {error:'The refund did not complete. Review the payment before retrying.'};
    return {ok:true,pending:status!=='succeeded'};
  } catch {
    // An uncertain response must keep the payout hold and the SAME request key.
    return {error:'Refund confirmation is pending. Retry safely to check it again.'};
  }
}
