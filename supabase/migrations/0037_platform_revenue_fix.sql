-- Platform revenue is the margin actually retained on a booking: the client
-- charge minus the professional payout. This is independent of how the rate
-- card's platform fee is configured (derived / percentage / fixed).
--
-- The previous definition computed `snap_platform_fee * duration_hours`, which
-- over-reported revenue by a factor of the shift length for FIXED per-booking
-- fees (e.g. a flat £5 fee on an 8h shift was reported as £40). Both
-- total_client_charge and total_payout are themselves rate * duration_hours
-- generated columns, so their difference is correct for every fee type.
create or replace view v_platform_revenue as
select b.id as booking_id, b.status, b.scheduled_start,
       b.total_client_charge, b.total_payout,
       (b.total_client_charge - b.total_payout) as platform_revenue, b.snap_currency
from bookings b;

create or replace view v_export_bookings as
select b.id, b.status, b.booking_type, r.name as role,
       b.scheduled_start, b.scheduled_end, b.duration_hours,
       b.location_address, b.location_postcode,
       b.total_client_charge, b.total_payout,
       (b.total_client_charge - b.total_payout) as platform_revenue,
       b.snap_currency, b.created_at
from bookings b
left join professional_roles r on r.id = b.professional_role_id;
