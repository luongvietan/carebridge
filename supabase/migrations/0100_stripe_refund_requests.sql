alter table public.payments add column refund_pending boolean not null default false;
create table public.stripe_refund_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  requested_by uuid not null references public.users(id),
  amount numeric(10,2) not null check(amount>0),
  refunded_before numeric(10,2) not null default 0,
  reason text not null check(length(trim(reason)) between 5 and 1000),
  status text not null default 'requested' check(status in('requested','pending','succeeded','failed','canceled')),
  stripe_refund_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_refund_active_payment on public.stripe_refund_requests(payment_id) where status in('requested','pending');
alter table public.stripe_refund_requests enable row level security;
-- Keep each provider refund, including dashboard refunds. A refund can change
-- from succeeded to failed; aggregate charge amounts cannot represent that safely.
create table public.stripe_refund_items (
  id text primary key,
  payment_id uuid not null references public.payments(id),
  amount numeric(10,2) not null check(amount>0),
  status text not null check(status in('pending','succeeded','failed','canceled')),
  updated_at timestamptz not null default now()
);
alter table public.stripe_refund_items enable row level security;

create function public.request_stripe_refund(p_payment_id uuid,p_actor_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.payments%rowtype; r public.stripe_refund_requests%rowtype; v_booking uuid;
begin
  if not exists(select 1 from users where id=p_actor_id and (account_type='admin' or is_founder)
    and is_active and account_status='active') then raise exception 'Active administrator required'; end if;
  if length(trim(coalesce(p_reason,''))) not between 5 and 1000 then raise exception 'Refund reason required'; end if;
  select booking_id into v_booking from payments where id=p_payment_id;
  if v_booking is null then raise exception 'Payment not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_booking::text,0));
  select * into p from payments where id=p_payment_id for update;
  select * into r from stripe_refund_requests where payment_id=p.id and status in('requested','pending');
  if r.id is not null then return to_jsonb(r)||jsonb_build_object('payment_intent',p.stripe_payment_intent_id,'booking_id',p.booking_id); end if;
  if p.status<>'succeeded' or p.stripe_payment_intent_id is null or p.refunded_at is not null then raise exception 'Only a successful Stripe payment can be refunded'; end if;
  if exists(select 1 from payouts where booking_id=p.booking_id and status='paid') then raise exception 'Payout already paid; separate financial reconciliation required'; end if;
  insert into stripe_refund_requests(payment_id,requested_by,amount,refunded_before,reason)
    values(p.id,p_actor_id,p.amount-coalesce(p.refunded_amount,0),coalesce(p.refunded_amount,0),trim(p_reason)) returning * into r;
  update payments set refund_pending=true where id=p.id;
  insert into audit_log(actor_user_id,actor_type,action,entity_type,entity_id,summary)
    values(p_actor_id,'admin','payment.refund_requested','payment',p.id::text,trim(p_reason));
  return to_jsonb(r)||jsonb_build_object('payment_intent',p.stripe_payment_intent_id,'booking_id',p.booking_id);
end;
$$;

create function public.reconcile_stripe_refund(p_event jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o jsonb:=p_event#>'{data,object}'; r public.stripe_refund_requests%rowtype;
  p public.payments%rowtype; i public.stripe_refund_items%rowtype; item jsonb;
  v_meta text:=o#>>'{metadata,payment_id}'; v_request text; v_status text;
  v_refunded numeric; v_pending boolean; v_result text:='unchanged'; v_delta numeric:=0;
begin
  if p_event->>'type' not in('refund.created','refund.updated','refund.failed','charge.refunded') then return jsonb_build_object('outcome','unrelated'); end if;
  if p_event->>'id' is null or p_event->>'id' not like 'evt_%' then raise exception 'Invalid Stripe event'; end if;
  if p_event->>'type'='charge.refunded' and (jsonb_typeof(o#>'{refunds,data}') is distinct from 'array'
    or o#>>'{refunds,has_more}' is distinct from 'false') then raise exception 'Complete refund list required'; end if;
  if v_meta ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into p from payments where id=v_meta::uuid for update;
  else select * into p from payments where stripe_payment_intent_id=o->>'payment_intent' for update; end if;
  if p.id is null then
    if v_meta is not null then raise exception 'Referenced payment not available'; end if;
    return jsonb_build_object('outcome','unrelated');
  end if;
  if (p.stripe_payment_intent_id is not null and o->>'payment_intent' is distinct from p.stripe_payment_intent_id)
    or (o#>>'{metadata,booking_id}' is not null and o#>>'{metadata,booking_id}'<>p.booking_id::text) then raise exception 'Refund payment mismatch'; end if;
  insert into stripe_webhook_events(event_id,event_type,payment_id)values(p_event->>'id',p_event->>'type',p.id)on conflict(event_id)do nothing;
  if not found then return jsonb_build_object('outcome','duplicate'); end if;
  for item in select value from jsonb_array_elements(case when p_event->>'type'='charge.refunded' then o#>'{refunds,data}' else jsonb_build_array(o) end) loop
    v_status:=case when item->>'status'='requires_action' then 'pending' else item->>'status' end;
    if v_status is null or v_status not in('pending','succeeded','failed','canceled') then raise exception 'Unknown refund status'; end if;
    if item->>'id' is null or (item->>'amount')::numeric is null or (item->>'amount')::numeric<=0
      or (item->>'amount')::numeric>round(p.amount*100) or lower(item->>'currency') is distinct from lower(trim(p.currency))
      or item->>'payment_intent' is distinct from o->>'payment_intent' then raise exception 'Refund identity or money mismatch'; end if;
    select * into i from stripe_refund_items where id=item->>'id';
    if i.id is not null and (i.payment_id<>p.id or i.amount*100<>(item->>'amount')::numeric) then raise exception 'Refund identity mismatch'; end if;
    v_request:=item#>>'{metadata,refund_request_id}';
    if v_request ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select * into r from stripe_refund_requests where id=v_request::uuid for update;
    else select * into r from stripe_refund_requests where stripe_refund_id=item->>'id' for update; end if;
    if r.id is not null and (r.payment_id<>p.id or r.amount*100<>(item->>'amount')::numeric
      or (r.stripe_refund_id is not null and r.stripe_refund_id<>item->>'id')) then raise exception 'Refund request mismatch'; end if;
    -- Failed/canceled is final; success may later fail, but never return to pending.
    if i.id is not null and (i.status in('failed','canceled') or i.status=v_status or (i.status='succeeded' and v_status='pending')) then v_result:=i.status; continue; end if;
    v_delta:=v_delta + case when v_status='succeeded' then (item->>'amount')::numeric/100 else 0 end
      - case when i.status='succeeded' then i.amount else 0 end;
    insert into stripe_refund_items(id,payment_id,amount,status) values(item->>'id',p.id,(item->>'amount')::numeric/100,v_status)
      on conflict(id) do update set status=excluded.status,updated_at=now();
    if r.id is not null then
      update stripe_refund_requests set stripe_refund_id=item->>'id',status=v_status,updated_at=now() where id=r.id;
    end if;
    insert into audit_log(actor_type,action,entity_type,entity_id,summary)
      values('system','payment.refund_'||v_status,'payment',p.id::text,item->>'id');
    v_result:=v_status;
  end loop;
  -- Apply only each item's change: existing reconciled refunds remain intact.
  v_refunded:=coalesce(p.refunded_amount,0)+v_delta;
  if v_refunded<0 or v_refunded>p.amount then raise exception 'Invalid aggregate refund amount'; end if;
  select exists(select 1 from stripe_refund_items where payment_id=p.id and status='pending')
    or exists(select 1 from stripe_refund_requests where payment_id=p.id and status in('requested','pending')) into v_pending;
  update payments set refunded_amount=v_refunded,refund_pending=v_pending,
    stripe_payment_intent_id=coalesce(stripe_payment_intent_id,o->>'payment_intent'),
    status=case when v_refunded>=amount then 'refunded'::payment_status when status='refunded' then 'succeeded'::payment_status else status end,
    refunded_at=case when v_refunded>=amount then coalesce(refunded_at,now()) else null end where id=p.id;
  return jsonb_build_object('outcome',v_result);
end;
$$;

create function public.guard_payout_refund_pending() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.booking_id is not null and new.status in('recorded','paid') then
    perform pg_advisory_xact_lock(hashtextextended(new.booking_id::text,0));
    if exists(select 1 from payments where booking_id=new.booking_id and refund_pending) then raise exception 'Refund pending; payout is on hold'; end if;
  end if;
  return new;
end;
$$;
create trigger trg_payout_refund_pending before insert or update of status on public.payouts for each row execute function public.guard_payout_refund_pending();
revoke all on function public.request_stripe_refund(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.reconcile_stripe_refund(jsonb) from public,anon,authenticated;
revoke all on function public.guard_payout_refund_pending() from public,anon,authenticated;
grant execute on function public.request_stripe_refund(uuid,uuid,text) to service_role;
grant execute on function public.reconcile_stripe_refund(jsonb) to service_role;
