// Execute the real migration in PostgreSQL WASM; no hosted data or network calls.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { test, beforeEach, after } from 'node:test';
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = await PGlite.create();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create type payment_status as enum ('pending','requires_action','succeeded','failed','refunded');
create table users(id uuid primary key, account_type text, is_founder boolean default false, account_status text default 'active', is_active boolean default true);
create table bookings(id uuid primary key, status text default 'accepted');
create table payments(id uuid primary key, booking_id uuid references bookings, payer_user_id uuid, stripe_payment_intent_id text, amount numeric(10,2), currency char(3), status payment_status default 'pending', paid_at timestamptz, refunded_at timestamptz, refunded_amount numeric(10,2), created_at timestamptz default now());
create table payouts(id uuid primary key, booking_id uuid, status text, amount numeric);
create table stripe_webhook_events(event_id text primary key, event_type text not null, payment_id uuid references payments, received_at timestamptz default now());
create table audit_log(id serial primary key, actor_user_id uuid, actor_type text not null, action text not null, entity_type text not null, entity_id text not null, summary text, changes jsonb);
`);
try { await db.exec(await readFile(new URL('../migrations/0099_stripe_checkout_reconciliation.sql', import.meta.url), 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
const payment='00000000-0000-0000-0000-000000000001';
const booking='00000000-0000-0000-0000-000000000002';
const payer='00000000-0000-0000-0000-000000000003';
let counter=0;
const event=(type,patch={})=>({id:`evt_test_${++counter}`,created:Math.floor(Date.now()/1000),type,livemode:false,data:{object:{id:type.startsWith('checkout.')?'cs_test_one':type.startsWith('charge.')?'ch_one':'pi_one',payment_intent:'pi_one',amount:10000,amount_received:10000,amount_captured:10000,amount_total:10000,currency:'eur',metadata:{payment_id:payment,booking_id:booking},...patch}}});
const reconcile=async e=>(await db.query('select reconcile_stripe_event($1::jsonb) result',[JSON.stringify(e)])).rows[0].result;
const one=async sql=>(await db.query(sql)).rows[0];
beforeEach(async()=>{
  await db.exec('truncate stripe_webhook_events, audit_log, payouts, payments, bookings cascade');
  await db.query('insert into bookings(id) values ($1)',[booking]);
  await db.query("insert into payments(id,booking_id,payer_user_id,amount,currency) values ($1,$2,$3,100,'EUR')",[payment,booking,payer]);
});
after(()=>db.close());
test('a declined card stays retryable and the same intent can then succeed once',async()=>{
  await reconcile(event('payment_intent.payment_failed'));
  assert.equal((await one('select status from payments')).status,'pending');
  const paid=event('payment_intent.succeeded');
  assert.equal((await reconcile(paid)).send_receipt,true);
  assert.equal((await reconcile(paid)).outcome,'duplicate');
  assert.equal((await reconcile(event('checkout.session.completed',{payment_status:'paid'}))).send_receipt,false);
  assert.equal((await one('select status from payments')).status,'succeeded');
  assert.equal((await one("select count(*)::int n from audit_log where action='payment.succeeded'")).n,1);
});
test('unpaid completion stays pending; delayed success settles it',async()=>{
  await reconcile(event('checkout.session.completed',{payment_status:'unpaid'}));
  assert.equal((await one('select status from payments')).status,'pending');
  await reconcile(event('checkout.session.async_payment_succeeded',{payment_status:'paid'}));
  assert.equal((await one('select status from payments')).status,'succeeded');
});
test('expired sessions and canceled intents close a pending attempt',async()=>{
  await reconcile(event('checkout.session.expired'));
  assert.equal((await one('select status from payments')).status,'failed');
});
test('amount, currency and booking metadata mismatches never settle a payment',async()=>{
  for(const patch of [{amount_received:9000},{currency:'gbp'},{metadata:{payment_id:payment,booking_id:payer}}]) {
    assert.equal((await reconcile(event('payment_intent.succeeded',patch))).outcome,'mismatch');
  }
  assert.equal((await one('select status from payments')).status,'pending');
});
test('stale session and intent events cannot affect a different attempt',async()=>{
  await db.exec("update payments set stripe_checkout_session_id='cs_test_current',stripe_payment_intent_id='pi_current'");
  assert.equal((await reconcile(event('checkout.session.expired'))).outcome,'mismatch');
  assert.equal((await reconcile(event('payment_intent.succeeded'))).outcome,'mismatch');
  assert.equal((await one('select status from payments')).status,'pending');
});
test('cumulative partial refunds never decrease on an older event',async()=>{
  await reconcile(event('payment_intent.succeeded'));
  await reconcile(event('charge.refunded',{amount_refunded:4000,refunded:false}));
  await reconcile(event('charge.refunded',{amount_refunded:1000,refunded:false}));
  assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),40);
  assert.equal((await one('select status from payments')).status,'succeeded');
});
test('a refund arriving before success preserves refund state and blocks late success',async()=>{
  await reconcile(event('charge.refunded',{amount_refunded:10000,refunded:true}));
  await reconcile(event('payment_intent.succeeded'));
  assert.equal((await one('select status from payments')).status,'refunded');
});
test('a partial refund arriving before success is retained when success arrives',async()=>{
  await reconcile(event('charge.refunded',{amount_refunded:2500,refunded:false}));
  await reconcile(event('payment_intent.succeeded'));
  assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),25);
});
test('a late failure cannot overwrite successful payment',async()=>{
  await reconcile(event('payment_intent.succeeded'));
  await reconcile(event('payment_intent.payment_failed'));
  await reconcile(event('checkout.session.async_payment_failed'));
  assert.equal((await one('select status from payments')).status,'succeeded');
});
test('an audit failure rolls back the payment and releases the event for retry',async()=>{
  const paid=event('payment_intent.succeeded');
  await db.exec("alter table audit_log add constraint inject_failure check(action='impossible')");
  await assert.rejects(reconcile(paid));
  assert.equal((await one('select status from payments')).status,'pending');
  assert.equal((await one('select count(*)::int n from stripe_webhook_events')).n,0);
  await db.exec('alter table audit_log drop constraint inject_failure');
  assert.equal((await reconcile(paid)).send_receipt,true);
});
test('unrelated Stripe events are ignored without retrying forever',async()=>{
  assert.equal((await reconcile(event('payment_intent.succeeded',{metadata:{},id:'pi_unrelated',payment_intent:null}))).outcome,'unrelated');
});
test('a missing referenced payment is retried then durably recorded after one hour',async()=>{
  const missing=event('payment_intent.succeeded',{metadata:{payment_id:payer}});
  await assert.rejects(reconcile(missing));
  assert.equal((await one('select count(*)::int n from stripe_webhook_events')).n,0);
  missing.created-=7200;
  assert.equal((await reconcile(missing)).outcome,'orphan');
  assert.equal((await one("select count(*)::int n from audit_log where action='payment.webhook_orphan'")).n,1);
});
test('only the service role can reconcile Stripe events',async()=>{
  for(const role of ['anon','authenticated']) assert.equal((await one(`select has_function_privilege('${role}','reconcile_stripe_event(jsonb)','execute') allowed`)).allowed,false);
  assert.equal((await one("select has_function_privilege('service_role','reconcile_stripe_event(jsonb)','execute') allowed")).allowed,true);
});
