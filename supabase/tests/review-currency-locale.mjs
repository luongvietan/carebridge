// In-memory PostgreSQL regression checks. No network or hosted database access.
// Run: $env:PGLITE_MODULE='<absolute path to @electric-sql/pglite/dist/index.js>'; node supabase/tests/review-currency-locale.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = await PGlite.create();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
create type booking_status as enum ('pending_review','open','cancelled');
create table users(id uuid primary key, account_type text, account_status text default 'active', is_active boolean default true, is_founder boolean default false, is_clinical_reviewer boolean default false, country_code text default 'PT');
create table professional_roles(id uuid primary key, country_code text, is_active boolean default true);
create table bookings(id uuid primary key, professional_role_id uuid references professional_roles(id), status booking_status default 'pending_review', scheduled_start timestamptz default now()+interval '2 days', care_type_id uuid, rate_card_id uuid, snap_client_charge_rate numeric, snap_payout_rate numeric, snap_platform_fee numeric, snap_currency text default 'EUR');
create table booking_risk_assessments(booking_id uuid primary key references bookings(id), risk_level text default 'amber', outcome text default 'A', review_decision text, review_note text, client_message text, reviewed_by uuid, reviewed_at timestamptz, permitted_role_id uuid, chosen_role_family text, requires_two_workers boolean, required_competency text, reassess_on date);
create table booking_safety_briefs(booking_id uuid primary key references bookings(id), instructions text, requires_two_workers boolean default false, updated_at timestamptz);
create table booking_cancellations(booking_id uuid references bookings(id), cancelled_by uuid, cancelled_role text, is_last_minute boolean, reason text);
create table booking_status_history(booking_id uuid references bookings(id), from_status booking_status, to_status booking_status, changed_by uuid, reason text);
create table audit_log(actor_user_id uuid, actor_type text, action text, entity_type text, entity_id text, summary text);
create table payouts(id serial primary key, booking_id uuid references bookings(id), currency text default 'GBP');
`);
for (const migration of ['0096_atomic_booking_review.sql','0097_payout_booking_currency.sql','0098_language_preference.sql']) {
  await db.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
}
const actor='00000000-0000-0000-0000-000000000001';
const role='00000000-0000-0000-0000-000000000002';
const booking='00000000-0000-0000-0000-000000000003';
await db.query("insert into users(id, account_type) values ($1,'admin')",[actor]);
await db.query("insert into professional_roles(id,country_code) values ($1,'PT')",[role]);
async function reset() {
  await db.exec('truncate audit_log, booking_status_history, booking_cancellations, booking_safety_briefs, booking_risk_assessments, payouts, bookings restart identity cascade');
  await db.query('insert into bookings(id,professional_role_id) values ($1,$2)',[booking,role]);
  await db.query('insert into booking_risk_assessments(booking_id) values ($1)',[booking]);
  await db.query('insert into booking_safety_briefs(booking_id) values ($1)',[booking]);
}
const review={reason:'Safe with controls',client_message:'Please clarify',instructions:'Two workers',requires_two_workers:true,reassess_on:'2026-12-10'};
const decide=(decision='approved',input=review,patch={})=>db.query('select review_booking($1,$2,$3,$4::jsonb,$5::jsonb)',[booking,actor,decision,JSON.stringify(input),JSON.stringify(patch)]);
const one=async(sql)=> (await db.query(sql)).rows[0];
await reset();
// An error at the LAST write must roll back every earlier write.
await db.exec("alter table audit_log add constraint inject_audit_failure check (action = 'impossible')");
await assert.rejects(decide());
assert.equal((await one('select status from bookings')).status,'pending_review');
assert.equal((await one('select review_decision from booking_risk_assessments')).review_decision,null);
assert.equal((await one('select instructions from booking_safety_briefs')).instructions,null);
assert.equal((await one('select count(*)::int n from booking_status_history')).n,0);
await db.exec('alter table audit_log drop constraint inject_audit_failure');
await assert.rejects(decide('approved',{...review,reassess_on:'2026-02-31'}));
assert.equal((await one('select status from bookings')).status,'pending_review');
await decide();
assert.equal((await one('select status from bookings')).status,'open');
assert.equal((await one('select review_decision from booking_risk_assessments')).review_decision,'approved');
assert.equal((await one('select instructions from booking_safety_briefs')).instructions,'Two workers');
assert.equal((await one('select count(*)::int n from audit_log')).n,1);
assert.equal((await one('select count(*)::int n from booking_status_history')).n,1);
await assert.rejects(decide()); // A stale/double decision cannot republish.
await reset(); await decide('declined');
assert.equal((await one('select status from bookings')).status,'cancelled');
assert.equal((await one('select count(*)::int n from booking_cancellations')).n,1);
await reset(); await decide('more_info_requested');
assert.equal((await one('select status from bookings')).status,'pending_review');
assert.equal((await one('select review_decision from booking_risk_assessments')).review_decision,'more_info_requested');
await reset();
await db.exec("update booking_risk_assessments set risk_level='red'");
await assert.rejects(decide());
await db.exec('update users set is_clinical_reviewer=true');
await decide();
await reset(); await db.exec("update users set account_status='suspended'");
await assert.rejects(decide());
await db.exec("update users set account_status='active'; delete from booking_safety_briefs");
await assert.rejects(decide());
assert.equal((await one('select review_decision from booking_risk_assessments')).review_decision,null);
assert.equal((await one("select has_function_privilege('authenticated','review_booking(uuid,uuid,text,jsonb,jsonb)','execute') allowed")).allowed,false);
assert.equal((await one("select has_function_privilege('service_role','review_booking(uuid,uuid,text,jsonb,jsonb)','execute') allowed")).allowed,true);
await db.query('insert into payouts(booking_id) values ($1)',[booking]);
assert.equal((await one('select currency from payouts')).currency,'EUR');
await db.exec("update payouts set currency='GBP'");
assert.equal((await one('select currency from payouts')).currency,'EUR');
const member='00000000-0000-0000-0000-000000000004';
await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2)',[member,{preferred_locale:'en-GB',market:'PT'}]);
await db.query("insert into users(id,account_type) values ($1,'professional')",[member]);
assert.equal((await one(`select preferred_locale from users where id='${member}'`)).preferred_locale,'en-GB');
await db.query('update auth.users set raw_user_meta_data=$2 where id=$1',[member,{preferred_locale:'pt-PT',market:'PT'}]);
const saved=await one(`select preferred_locale,country_code from users where id='${member}'`);
assert.deepEqual(saved,{preferred_locale:'pt-PT',country_code:'PT'});
await db.close();
console.log('PostgreSQL: review rollback/decisions/access, payout currency and independent locale checks passed.');
