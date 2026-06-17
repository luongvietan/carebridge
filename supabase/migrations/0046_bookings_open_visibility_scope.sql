-- Scope open-booking visibility to professionals of the MATCHING role.
--
-- The original bookings_prof_visibility policy (0016) used the predicate
-- `status = 'open'`, which let ANY authenticated account read EVERY open
-- booking's address and notes regardless of role. Tighten it so a professional
-- only sees open bookings for their own role (plus bookings assigned to them).
-- Requesters keep access via bookings_requester; admins via bookings_admin_all.

drop policy if exists bookings_prof_visibility on bookings;
create policy bookings_prof_visibility on bookings
  for select using (
    (
      status = 'open'
      and professional_role_id in (
        select professional_role_id
          from professionals
         where user_id = auth.uid() and professional_role_id is not null
      )
    )
    or assigned_professional_id in (select id from professionals where user_id = auth.uid())
  );
