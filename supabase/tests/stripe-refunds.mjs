import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { test, beforeEach, after } from 'node:test';
const { PGlite }=await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db=await PGlite.create();
await db.exec(`create role anon;create role authenticated;create role service_role;
create type payment_status as enum('pending','requires_action','succeeded','failed','refunded');
create table users(id uuid primary key,account_type text,is_founder boolean default false,is_active boolean default true,account_status text default 'active');
create table payments(id uuid primary key,booking_id uuid,amount numeric,currency text,status payment_status,stripe_payment_intent_id text,refunded_amount numeric,refunded_at timestamptz);
create table payouts(id uuid primary key,booking_id uuid,status text,amount numeric);
create table stripe_webhook_events(event_id text primary key,event_type text,payment_id uuid,received_at timestamptz default now());
create table audit_log(actor_user_id uuid,actor_type text,action text,entity_type text,entity_id text,summary text);`);
try{await db.exec(await readFile(new URL('../migrations/0100_stripe_refund_requests.sql',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const actor='00000000-0000-0000-0000-000000000001',payment='00000000-0000-0000-0000-000000000002',booking='00000000-0000-0000-0000-000000000003';
const one=async sql=>(await db.query(sql)).rows[0];
const request=async()=>(await db.query("select request_stripe_refund($1,$2,'Client cancellation') result",[payment,actor])).rows[0].result;
const reconcile=async(r,status='succeeded',id='evt_refund_one')=>(await db.query('select reconcile_stripe_refund($1::jsonb) result',[JSON.stringify({id,type:'refund.updated',data:{object:{id:'re_one',status,amount:7500,currency:'eur',payment_intent:'pi_one',metadata:{refund_request_id:r.id,payment_id:payment}}}})])).rows[0].result;
beforeEach(async()=>{
 await db.exec('truncate stripe_webhook_events,audit_log,payouts,payments,users cascade');
 await db.query("insert into users(id,account_type)values($1,'admin')",[actor]);
 await db.query("insert into payments(id,booking_id,amount,currency,status,stripe_payment_intent_id,refunded_amount)values($1,$2,100,'EUR','succeeded','pi_one',25)",[payment,booking]);
});after(()=>db.close());
test('reserves only the remaining amount; retries reuse one request and audit',async()=>{
 const first=await request(),second=await request();assert.equal(first.id,second.id);assert.equal(Number(first.amount),75);
 assert.equal((await one('select refund_pending from payments')).refund_pending,true);
 assert.equal((await one("select count(*)::int n from audit_log where action='payment.refund_requested'")).n,1);
});
test('non-admin and suspended admin cannot request a refund',async()=>{
 await db.exec("update users set account_type='private_client'");await assert.rejects(request());
 await db.exec("update users set account_type='admin',account_status='suspended'");await assert.rejects(request());
});
test('paid payouts block in-app refunds requiring separate financial reconciliation',async()=>{
 await db.query("insert into payouts values($1,$2,'paid',60)",[actor,booking]);await assert.rejects(request());
});
test('pending refunds block both recording and marking a payout paid',async()=>{
 await db.query("insert into payouts values($1,$2,'recorded',60)",[actor,booking]);await request();
 await assert.rejects(db.exec("update payouts set status='paid'"));
 await assert.rejects(db.query("insert into payouts values($1,$2,'recorded',60)",[payment,booking]));
});
test('a successful refund arriving before the API response settles exactly once',async()=>{
 const r=await request();await reconcile(r);await reconcile(r);
 const row=await one('select status,refunded_amount,refund_pending from payments');
 assert.equal(row.status,'refunded');assert.equal(Number(row.refunded_amount),100);assert.equal(row.refund_pending,false);
 assert.equal((await one("select count(*)::int n from audit_log where action='payment.refund_succeeded'")).n,1);
});
test('failed refund releases the hold and a fresh request uses a new key',async()=>{
 const r=await request();await reconcile(r,'failed');assert.equal((await one('select refund_pending from payments')).refund_pending,false);
 assert.notEqual((await request()).id,r.id);
});
test('late pending cannot undo success; asynchronous failure restores the paid balance',async()=>{
 const r=await request();await reconcile(r);await reconcile(r,'pending','evt_late_pending');await reconcile(r,'failed','evt_late_failure');
 assert.equal((await one('select status from stripe_refund_requests')).status,'failed');
 assert.equal((await one('select status from payments')).status,'succeeded');
 assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),25);
 await reconcile(r,'succeeded','evt_stale_success');
 assert.equal((await one('select status from stripe_refund_requests')).status,'failed');
});
test('mismatched refund money does not release the hold or settle payment',async()=>{
 const r=await request();await db.exec('update stripe_refund_requests set amount=70');await assert.rejects(reconcile(r));
 assert.equal((await one('select refund_pending from payments')).refund_pending,true);
});
test('missing refund amount cannot settle payment',async()=>{
 const r=await request();
 await assert.rejects(db.query('select reconcile_stripe_refund($1::jsonb)',[JSON.stringify({id:'evt_missing',type:'refund.updated',data:{object:{id:'re_one',status:'succeeded',currency:'eur',payment_intent:'pi_one',metadata:{refund_request_id:r.id}}}})]));
});
test('audit failure cannot leave an unaudited reserved refund',async()=>{
 await db.exec("alter table audit_log add constraint inject_failure check(action='impossible')");await assert.rejects(request());
 assert.equal((await one('select refund_pending from payments')).refund_pending,false);
 assert.equal((await one('select count(*)::int n from stripe_refund_requests')).n,0);
 await db.exec('alter table audit_log drop constraint inject_failure');
});
const charge=async(data,id='evt_charge')=>db.query('select reconcile_stripe_refund($1::jsonb)',[JSON.stringify({id,type:'charge.refunded',data:{object:{payment_intent:'pi_one',metadata:{payment_id:payment},refunds:{has_more:false,data}}}})]);
test('dashboard partial refunds count only succeeded items and keep pending payouts held',async()=>{
 const item={id:'re_dashboard',amount:2000,currency:'eur',payment_intent:'pi_one',status:'pending'};
 await charge([item]);
 assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),25);
 assert.equal((await one('select refund_pending from payments')).refund_pending,true);
 await charge([{...item,status:'succeeded'}],'evt_charge_success');
 assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),45);
 await charge([{...item,status:'succeeded'}],'evt_repeated_snapshot');
 assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),45);
 await charge([{...item,status:'failed'}],'evt_charge_failed');
 assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),25);
 assert.equal((await one('select refund_pending from payments')).refund_pending,false);
});
test('a stale successful charge snapshot cannot undo a refund failure',async()=>{
 const r=await request();await reconcile(r);await reconcile(r,'failed','evt_failed');
 await charge([{id:'re_one',amount:7500,currency:'eur',payment_intent:'pi_one',status:'succeeded'}]);
 assert.equal(Number((await one('select refunded_amount from payments')).refunded_amount),25);
});
