-- Requesters may read their own bookings; all mutations go through server actions (service role).
drop policy if exists bookings_requester on bookings;
create policy bookings_requester on bookings
  for select using (requester_user_id = auth.uid());
