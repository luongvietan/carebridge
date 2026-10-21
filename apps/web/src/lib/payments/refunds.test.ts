import { beforeEach,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({admin:'admin' as string|null,create:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/auth/require-auth',()=>({requireAuth:async()=>({id:'admin'})}));
vi.mock('@/lib/auth/admin',()=>({requireAdmin:async()=>state.admin}));
vi.mock('@/lib/stripe/client',()=>({stripe:()=>({refunds:{create:state.create}})}));
vi.mock('@/lib/supabase/service',()=>({createServiceClient:()=>({rpc:state.rpc})}));
import { refundPayment } from './refunds';
beforeEach(()=>{
 vi.clearAllMocks();state.admin='admin';
 state.rpc.mockImplementation(async(name:string)=>name==='request_stripe_refund'?{data:{id:'request-one',payment_id:'payment-one',booking_id:'booking-one',payment_intent:'pi_one',amount:75},error:null}:{data:{outcome:'pending'},error:null});
 state.create.mockResolvedValue({id:'re_one',object:'refund',status:'pending',amount:7500,currency:'eur',payment_intent:'pi_one',metadata:{refund_request_id:'request-one'}});
});
it('uses the same reserved refund and amount on retry, without claiming it finished',async()=>{
 expect(await refundPayment('payment-one','Client cancellation')).toEqual({ok:true,pending:true});
 expect(await refundPayment('payment-one','Client cancellation')).toEqual({ok:true,pending:true});
 expect(state.create.mock.calls.map(c=>c[1])).toEqual([{idempotencyKey:'refund:request-one'},{idempotencyKey:'refund:request-one'}]);
 expect(state.create.mock.calls[0][0]).toMatchObject({payment_intent:'pi_one',amount:7500});
});
it('rejects non-admins before reserving or calling Stripe',async()=>{
 state.admin=null;expect(await refundPayment('payment-one','Client cancellation')).toHaveProperty('error');
 expect(state.rpc).not.toHaveBeenCalled();expect(state.create).not.toHaveBeenCalled();
});
it('requires a meaningful reason before any money action',async()=>{
 expect(await refundPayment('payment-one','')).toHaveProperty('error');expect(state.create).not.toHaveBeenCalled();
});
it('fails closed when the database cannot reserve an audited request',async()=>{
 state.rpc.mockResolvedValue({data:null,error:{message:'Could not reserve'}});
 expect(await refundPayment('payment-one','Client cancellation')).toHaveProperty('error');expect(state.create).not.toHaveBeenCalled();
});
it('keeps an uncertain network result retryable without exposing provider diagnostics',async()=>{
 state.create.mockRejectedValue(new Error('provider diagnostic'));
 const result=await refundPayment('payment-one','Client cancellation');expect(result).toHaveProperty('error');expect(JSON.stringify(result)).not.toContain('provider diagnostic');
 expect(state.rpc).toHaveBeenCalledTimes(1);
});
it('shows asynchronous failure even when the API returns an earlier success',async()=>{
 state.create.mockResolvedValue({id:'re_one',status:'succeeded'});
 state.rpc.mockImplementation(async(name:string)=>name==='request_stripe_refund'?{data:{id:'request-one',payment_intent:'pi_one',amount:75},error:null}:{data:{outcome:'failed'},error:null});
 expect(await refundPayment('payment-one','Client cancellation')).toEqual({error:'The refund did not complete. Review the payment before retrying.'});
});
