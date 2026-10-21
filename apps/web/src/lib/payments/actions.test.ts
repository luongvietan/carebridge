import { beforeEach, expect, it, vi } from 'vitest';
const fake=vi.hoisted(()=>({
  type:'organisation',locale:'en-GB',paid:false,readError:false,saveError:false,
  payment:{id:'payment',booking_id:'booking',amount:100,currency:'EUR',checkout_locale:'en',stripe_checkout_session_id:null as string|null,status:'pending'},
  create:vi.fn(),retrieve:vi.fn(),from:vi.fn(),saved:[] as unknown[],
}));
vi.mock('@/lib/auth/require-auth',()=>({requireAuth:async()=>({id:'user'})}));
vi.mock('@/lib/app-url',()=>({getAppUrl:()=> 'https://example.test'}));
vi.mock('@/lib/stripe/client',()=>({stripe:()=>({checkout:{sessions:{create:fake.create,retrieve:fake.retrieve}}})}));
vi.mock('@/lib/supabase/service',()=>({createServiceClient:()=>({from:fake.from})}));
import { startCheckout } from './actions';
beforeEach(()=>{
  vi.clearAllMocks();fake.type='organisation';fake.locale='en-GB';fake.paid=false;fake.readError=false;fake.saveError=false;fake.saved=[];
  fake.payment={id:'payment',booking_id:'booking',amount:100,currency:'EUR',checkout_locale:'en',stripe_checkout_session_id:null,status:'pending'};
  fake.create.mockResolvedValue({id:'cs_test_one',url:'https://checkout.stripe.com/test-one',status:'open'});
  fake.retrieve.mockResolvedValue({id:'cs_test_one',url:'https://checkout.stripe.com/test-one',status:'open'});
  fake.from.mockImplementation((table:string)=>{
    let head=false,write=false,pendingOnly=false,update:Record<string,unknown>|undefined;
    const result=()=>{
      const error=(fake.readError&&!write&&table==='payments')||(fake.saveError&&write)?{message:'database unavailable'}:null;
      const matches=!pendingOnly||fake.payment.status==='pending';
      if(update&&!error&&matches)Object.assign(fake.payment,update);
      return {data:table==='users'?{account_type:fake.type,preferred_locale:fake.locale}:table==='bookings'?{id:'booking',status:'accepted',requester_user_id:'user',total_client_charge:100,snap_currency:'EUR'}:matches?fake.payment:null,count:fake.paid?1:0,error};
    };
    const query:Record<string,unknown>={then:(resolve:(v:unknown)=>void)=>resolve({...result(),...(head?{data:null}:{})}),single:async()=>result(),maybeSingle:async()=>result()};
    query.select=(_s:unknown,opts?:{head?:boolean})=>{head=!!opts?.head;return query;};
    for(const method of ['in','not','is'])query[method]=()=>query;
    query.eq=(key:string,value:unknown)=>{if(value===null)throw new Error('SQL equality to NULL cannot match a row');if(key==='status'&&value==='pending')pendingOnly=true;return query;};
    query.update=(row:Record<string,unknown>)=>{write=true;update=row;fake.saved.push(row);return query;};
    query.insert=()=>{write=true;fake.payment={...fake.payment,id:'payment-retry',status:'pending',stripe_checkout_session_id:null};return query;};
    return query;
  });
});
it.each([['organisation','organisation'],['private_client','client']])('returns %s checkout to the correct area and persists its session',async(type,area)=>{
  fake.type=type;
  expect(await startCheckout('booking')).toEqual({ok:true,url:'https://checkout.stripe.com/test-one'});
  expect(fake.create.mock.calls[0][0].success_url).toBe(`https://example.test/${area}/bookings?checkout=returned&session_id={CHECKOUT_SESSION_ID}`);
  expect(fake.saved).toContainEqual({stripe_checkout_session_id:'cs_test_one'});
});
it('reuses an open session when the payer clicks Pay again',async()=>{
  fake.payment.stripe_checkout_session_id='cs_test_one';
  expect(await startCheckout('booking')).toHaveProperty('ok',true);
  expect(fake.create).not.toHaveBeenCalled();
});
it('keeps the same idempotency key after a database save failure',async()=>{
  fake.saveError=true;
  expect(await startCheckout('booking')).toHaveProperty('error');
  fake.saveError=false;
  expect(await startCheckout('booking')).toHaveProperty('ok',true);
  expect(fake.create.mock.calls.map(c=>c[1])).toEqual([{idempotencyKey:'checkout:payment'},{idempotencyKey:'checkout:payment'}]);
});
it('fails closed when the existing-payment lookup fails',async()=>{
  fake.readError=true;
  expect(await startCheckout('booking')).toHaveProperty('error');
  expect(fake.create).not.toHaveBeenCalled();
});
it('blocks another checkout while a completed session awaits reconciliation',async()=>{
  fake.payment.stripe_checkout_session_id='cs_test_one';
  fake.retrieve.mockResolvedValue({id:'cs_test_one',url:null,status:'complete'});
  expect(await startCheckout('booking')).toHaveProperty('error');
  expect(fake.create).not.toHaveBeenCalled();
});
it('replaces an expired session even when its earlier database save never completed',async()=>{
  fake.create.mockResolvedValueOnce({id:'cs_expired',url:null,status:'expired'});
  expect(await startCheckout('booking')).toHaveProperty('ok',true);
  expect(fake.create.mock.calls.map(c=>c[1])).toEqual([{idempotencyKey:'checkout:payment'},{idempotencyKey:'checkout:payment-retry'}]);
  expect(fake.saved).toContainEqual({status:'failed'});
});
it('does not reveal Stripe errors or credentials to a payer',async()=>{
  fake.create.mockRejectedValue(new Error('secret provider diagnostic'));
  const result=await startCheckout('booking');
  expect(result).toHaveProperty('error');
  expect(JSON.stringify(result)).not.toContain('secret provider diagnostic');
});
it('rejects unsupported accounts before financial effects',async()=>{
  fake.type='professional';
  expect(await startCheckout('booking')).toHaveProperty('error');
  expect(fake.create).not.toHaveBeenCalled();
});
