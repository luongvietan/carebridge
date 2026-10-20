-- A review and its publication/cancellation are one transaction. Service only;
-- the signed-in actor is checked again under the booking lock.
create or replace function public.review_booking(
  p_booking_id uuid, p_admin_id uuid, p_decision text,
  p_review jsonb, p_booking_patch jsonb default '{}'
) returns void language plpgsql security definer set search_path = public as $$
declare
  b bookings%rowtype;
  ra booking_risk_assessments%rowtype;
  reviewer users%rowtype;
  next_status booking_status;
  reason text := nullif(left(trim(p_review->>'reason'), 2000), '');
  message text := nullif(left(trim(p_review->>'client_message'), 2000), '');
begin
  select * into reviewer from users where id = p_admin_id;
  if not found or not reviewer.is_active or reviewer.account_status <> 'active' or not (reviewer.account_type = 'admin' or reviewer.is_founder) then
    raise exception 'Administrator access required.';
  end if;
  if p_decision is null or p_decision not in ('approved', 'declined', 'more_info_requested') then
    raise exception 'Invalid review decision.';
  end if;
  select * into b from bookings where id = p_booking_id for update;
  if not found or b.status <> 'pending_review' then raise exception 'This request is no longer waiting for review.'; end if;
  select * into ra from booking_risk_assessments where booking_id = b.id for update;
  if not found then raise exception 'Assessment not found.'; end if;
  if (ra.risk_level = 'red' or ra.outcome in ('N','X')) and not reviewer.is_clinical_reviewer then
    raise exception 'Only a clinical reviewer can decide nursing or red-risk requests.';
  end if;
  if p_decision = 'approved' then
    if reason is null then raise exception 'Please record the reason and any risk-control measures.'; end if;
    if b.scheduled_start <= now() then raise exception 'This request start time has passed.'; end if;
    if p_booking_patch ? 'professional_role_id' and not exists (
      select 1 from professional_roles n join professional_roles o on o.id = b.professional_role_id
      where n.id = (p_booking_patch->>'professional_role_id')::uuid and n.is_active and n.country_code = o.country_code
    ) then raise exception 'Choose an active professional category in the same country.'; end if;
    next_status := 'open';
  else
    if message is null then raise exception 'Please write a message to the client.'; end if;
    next_status := case when p_decision = 'declined' then 'cancelled'::booking_status else 'pending_review'::booking_status end;
  end if;

  update booking_risk_assessments set review_decision = p_decision, review_note = reason,
    client_message = message, reviewed_by = p_admin_id, reviewed_at = now(),
    permitted_role_id = case when p_decision = 'approved' then coalesce((p_booking_patch->>'professional_role_id')::uuid, b.professional_role_id) else null end,
    chosen_role_family = coalesce(p_review->>'chosen_role_family', chosen_role_family),
    requires_two_workers = coalesce((p_review->>'requires_two_workers')::boolean, false),
    required_competency = nullif(left(p_review->>'required_competency', 2000), ''),
    reassess_on = (nullif(p_review->>'reassess_on', ''))::date
  where booking_id = b.id;

  if p_decision = 'approved' then
    update booking_safety_briefs set instructions = nullif(left(p_review->>'instructions', 4001), ''),
      requires_two_workers = coalesce((p_review->>'requires_two_workers')::boolean, false), updated_at = now()
    where booking_id = b.id;
    if not found then raise exception 'Safety brief not found.'; end if;
    update bookings set
      professional_role_id = coalesce((p_booking_patch->>'professional_role_id')::uuid, professional_role_id),
      care_type_id = case when p_booking_patch ? 'care_type_id' then (p_booking_patch->>'care_type_id')::uuid else care_type_id end,
      rate_card_id = coalesce((p_booking_patch->>'rate_card_id')::uuid, rate_card_id),
      snap_client_charge_rate = coalesce((p_booking_patch->>'snap_client_charge_rate')::numeric, snap_client_charge_rate),
      snap_payout_rate = coalesce((p_booking_patch->>'snap_payout_rate')::numeric, snap_payout_rate),
      snap_platform_fee = coalesce((p_booking_patch->>'snap_platform_fee')::numeric, snap_platform_fee),
      snap_currency = coalesce(p_booking_patch->>'snap_currency', snap_currency), status = next_status
    where id = b.id;
  elsif p_decision = 'declined' then
    update bookings set status = next_status where id = b.id;
    insert into booking_cancellations (booking_id, cancelled_by, cancelled_role, is_last_minute, reason)
      values (b.id, p_admin_id, 'admin', false, coalesce(reason, message));
  end if;
  if next_status <> b.status then
    insert into booking_status_history (booking_id, from_status, to_status, changed_by, reason)
      values (b.id, b.status, next_status, p_admin_id, coalesce(reason, message));
  end if;
  insert into audit_log (actor_user_id, actor_type, action, entity_type, entity_id, summary)
    values (p_admin_id, 'admin', 'booking.review_' || p_decision, 'booking', b.id::text, reason);
end;
$$;
revoke all on function public.review_booking(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.review_booking(uuid, uuid, text, jsonb, jsonb) to service_role;
