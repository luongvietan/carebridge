import {beforeEach,expect,it,vi} from 'vitest';
import type Stripe from 'stripe';
const mock=vi.hoisted(()=>({retrieve:vi.fn(),list:vi.fn()}));
vi.mock('./client',()=>({stripe:()=>({paymentIntents:{retrieve:mock.retrieve},refunds:{list:mock.list}})}));
import {refundEventForLedger} from './refund-event';
beforeEach(()=>{vi.clearAllMocks();mock.retrieve.mockResolvedValue({metadata:{payment_id:'payment',booking_id:'booking'}});});
it('hydrates every page when a signed charge snapshot omits refunds',async()=>{
  mock.list.mockReturnValue((async function*(){yield{id:'re_1',status:'pending'};yield{id:'re_2',status:'failed'};})());
  const result=await refundEventForLedger({type:'charge.refunded',data:{object:{id:'ch_one',payment_intent:'pi_one',metadata:{}}}} as Stripe.Event);
  expect(result.data.object).toMatchObject({metadata:{payment_id:'payment'},refunds:{has_more:false,data:[{id:'re_1',status:'pending'},{id:'re_2',status:'failed'}]}});
  expect(mock.list).toHaveBeenCalledWith({charge:'ch_one',limit:100});
});
it('uses a complete signed refund list without making provider calls',async()=>{
  const event={type:'charge.refunded',data:{object:{id:'ch_one',payment_intent:'pi_one',metadata:{payment_id:'payment'},refunds:{has_more:false,data:[]}}}} as unknown as Stripe.Event;
  await refundEventForLedger(event);expect(mock.list).not.toHaveBeenCalled();expect(mock.retrieve).not.toHaveBeenCalled();
});
it('adds booking identity to a refund created through the Stripe dashboard',async()=>{
  const event={type:'refund.failed',data:{object:{id:'re_1',payment_intent:'pi_one',status:'failed',metadata:{}}}} as Stripe.Event;
  expect((await refundEventForLedger(event)).data.object).toMatchObject({status:'failed',metadata:{payment_id:'payment',booking_id:'booking'}});
});
