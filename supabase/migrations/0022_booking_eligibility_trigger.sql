-- Hard backstop: a professional may only be assigned to a booking if they can accept
-- bookings and their role matches. App logic mirrors this for friendly errors.
create or replace function public.enforce_booking_eligibility() returns trigger
language plpgsql as $$
declare ok boolean; rmatch boolean;
begin
  if new.assigned_professional_id is null then return new; end if;
  select can_accept_bookings, (professional_role_id = new.professional_role_id)
    into ok, rmatch
    from professionals where id = new.assigned_professional_id;
  if not coalesce(ok, false) then
    raise exception 'professional not eligible to accept bookings';
  end if;
  if not coalesce(rmatch, false) then
    raise exception 'professional role does not match booking';
  end if;
  return new;
end; $$;

create trigger trg_booking_eligibility
  before insert or update of assigned_professional_id on bookings
  for each row execute function public.enforce_booking_eligibility();
