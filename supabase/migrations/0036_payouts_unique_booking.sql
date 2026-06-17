-- Prevent double payouts for the same booking. recordPayout() uses a
-- check-then-insert which is not atomic under concurrent admin actions, so
-- enforce uniqueness at the database level as the real safeguard.
-- booking_id is nullable; Postgres treats NULLs as distinct, and real payouts
-- always carry a booking_id, so this does not constrain the (unused) null case.
alter table payouts add constraint payouts_booking_id_unique unique (booking_id);
