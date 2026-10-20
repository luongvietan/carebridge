-- New ledger entries always inherit their booking's currency, including writes
-- outside the application action. Historical paid entries need reconciliation;
-- do not silently rewrite them here.
create or replace function public.fn_payout_booking_currency()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.booking_id is not null then
    select snap_currency into strict new.currency from bookings where id = new.booking_id;
  end if;
  return new;
end;
$$;
create trigger trg_payout_booking_currency before insert or update of booking_id, currency on payouts
  for each row execute function public.fn_payout_booking_currency();
