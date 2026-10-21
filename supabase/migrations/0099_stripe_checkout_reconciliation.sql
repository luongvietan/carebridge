-- Persist hosted sessions; claim, lock, reconcile and audit in one transaction.
alter table public.payments
  add column stripe_checkout_session_id text,
  add column checkout_locale text not null default 'pt' check (checkout_locale in ('pt','en'));
update public.payments set checkout_locale='en' where trim(currency)<>'EUR';
create unique index uq_payments_checkout_session on public.payments(stripe_checkout_session_id) where stripe_checkout_session_id is not null;

create or replace function public.reconcile_stripe_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_type text:=p_event->>'type';
  v_event_id text:=p_event->>'id';
  v_obj jsonb:=p_event#>'{data,object}';
  v_meta text:=v_obj#>>'{metadata,payment_id}';
  v_booking_meta text:=v_obj#>>'{metadata,booking_id}';
  v_intent text;
  v_payment public.payments%rowtype;
  v_amount numeric;
  v_refund numeric;
  v_next public.payment_status;
  v_outcome text:='unchanged';
  v_receipt boolean:=false;
begin
  if v_type is null or v_type not in (
    'checkout.session.completed','checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed','checkout.session.expired',
    'payment_intent.succeeded','payment_intent.payment_failed','payment_intent.canceled','charge.refunded'
  ) then return jsonb_build_object('outcome','unrelated','send_receipt',false); end if;
  if v_event_id is null or v_event_id not like 'evt_%' then raise exception 'Invalid Stripe event'; end if;
  insert into stripe_webhook_events(event_id,event_type) values(v_event_id,v_type) on conflict(event_id) do nothing;
  if not found then return jsonb_build_object('outcome','duplicate','send_receipt',false); end if;
  v_intent:=case when v_type like 'payment_intent.%' then v_obj->>'id'
    when jsonb_typeof(v_obj->'payment_intent')='object' then v_obj#>>'{payment_intent,id}' else v_obj->>'payment_intent' end;
  if v_meta ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into v_payment from payments where id=v_meta::uuid for update;
  elsif v_intent is not null then
    select * into v_payment from payments where stripe_payment_intent_id=v_intent for update;
  end if;
  if v_payment.id is null then
    if v_meta is null then return jsonb_build_object('outcome','unrelated','send_receipt',false); end if;
    if to_timestamp((p_event->>'created')::double precision)>now()-interval '1 hour' then
      raise exception 'Referenced payment is not available yet';
    end if;
    insert into audit_log(actor_type,action,entity_type,entity_id,summary)
      values('system','payment.webhook_orphan','stripe_event',v_event_id,v_type);
    return jsonb_build_object('outcome','orphan','send_receipt',false);
  end if;
  update stripe_webhook_events set payment_id=v_payment.id where event_id=v_event_id;
  if (v_booking_meta is not null and v_booking_meta<>v_payment.booking_id::text)
    or (v_intent is not null and v_payment.stripe_payment_intent_id is not null and v_intent<>v_payment.stripe_payment_intent_id)
    or (v_type like 'checkout.session.%' and v_payment.stripe_checkout_session_id is not null and v_obj->>'id'<>v_payment.stripe_checkout_session_id)
  then v_outcome:='mismatch'; end if;
  -- A signature alone is insufficient: money and booking identity must agree.
  if v_type in ('payment_intent.succeeded','checkout.session.completed','checkout.session.async_payment_succeeded','charge.refunded') then
    v_amount:=case when v_type='payment_intent.succeeded' then (v_obj->>'amount_received')::numeric
      when v_type='charge.refunded' then coalesce((v_obj->>'amount_captured')::numeric,(v_obj->>'amount')::numeric)
      else (v_obj->>'amount_total')::numeric end;
    if v_amount is null or v_amount<>round(v_payment.amount*100)
      or lower(coalesce(v_obj->>'currency',''))<>lower(trim(v_payment.currency)) then v_outcome:='mismatch'; end if;
  end if;
  if v_outcome='mismatch' then
    insert into audit_log(actor_type,action,entity_type,entity_id,summary)
      values('system','payment.webhook_mismatch','payment',v_payment.id::text,v_event_id||' / '||v_type);
    return jsonb_build_object('outcome','mismatch','send_receipt',false);
  end if;
  if v_intent is not null and v_payment.stripe_payment_intent_id is null then
    update payments set stripe_payment_intent_id=v_intent where id=v_payment.id;
  end if;
  if v_type='charge.refunded' then
    v_refund:=(v_obj->>'amount_refunded')::numeric/100;
    if v_refund is null or v_refund<0 or v_refund>v_payment.amount then raise exception 'Invalid refund amount'; end if;
    v_refund:=greatest(coalesce(v_payment.refunded_amount,0),v_refund);
    update payments set refunded_amount=v_refund,
      status=case when v_refund>=amount then 'refunded'::payment_status else status end,
      refunded_at=case when v_refund>=amount then coalesce(refunded_at,now()) else refunded_at end where id=v_payment.id;
    v_outcome:=case when v_refund>=v_payment.amount then 'refunded' else 'partially_refunded' end;
  else
    v_next:=case when v_type in ('payment_intent.succeeded','checkout.session.async_payment_succeeded') then 'succeeded'
      when v_type='checkout.session.completed' and v_obj->>'payment_status'='paid' then 'succeeded'
      when v_type in ('checkout.session.expired','checkout.session.async_payment_failed','payment_intent.canceled') then 'failed'
      else 'pending' end;
    -- A decline is retryable inside the same Checkout session; keep its row reserved.
    if v_next='pending' and v_payment.status in ('pending','requires_action') then v_outcome:='pending';
    elsif v_next='succeeded' and v_payment.status in ('pending','requires_action','failed') and v_payment.refunded_at is null then
      update payments set status='succeeded',paid_at=coalesce(paid_at,now()) where id=v_payment.id;
      v_outcome:='succeeded'; v_receipt:=true;
    elsif v_next='failed' and v_payment.status in ('pending','requires_action') then
      update payments set status='failed' where id=v_payment.id; v_outcome:='failed';
    end if;
  end if;
  if v_outcome<>'unchanged' then
    insert into audit_log(actor_type,action,entity_type,entity_id,summary)
      values('system','payment.'||v_outcome,'payment',v_payment.id::text,v_event_id||' / '||v_type);
  end if;
  return jsonb_build_object('outcome',v_outcome,'send_receipt',v_receipt,
    'payment_id',v_payment.id,'payer_user_id',v_payment.payer_user_id,'booking_id',v_payment.booking_id);
end;
$$;
revoke all on function public.reconcile_stripe_event(jsonb) from public,anon,authenticated;
grant execute on function public.reconcile_stripe_event(jsonb) to service_role;
