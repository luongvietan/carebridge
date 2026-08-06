-- The childcare category (0063) is invisible in the data export: a booking's
-- care type (overnight, emergency, after-school …) and the role's category are
-- not in v_export_bookings, and v_export_professionals shows neither the
-- category nor the Ofsted registration number an administrator verified. Export
-- is the founder's primary reporting surface, so childcare has to be reportable
-- there rather than only in the app.
--
-- New columns are appended, which is all `create or replace view` allows and
-- also keeps every existing column in its current position. security_invoker is
-- restated explicitly: 0049 set it on the old view definitions and a replace
-- must not be the thing that quietly drops it.

create or replace view v_export_bookings with (security_invoker = true) as
select b.id, b.status, b.booking_type, r.name as role,
       b.scheduled_start, b.scheduled_end, b.duration_hours,
       b.location_address, b.location_postcode,
       b.total_client_charge, b.total_payout,
       (b.total_client_charge - b.total_payout) as platform_revenue,
       b.snap_currency, b.created_at,
       cat.name as category,
       ct.name as care_type
from bookings b
left join professional_roles r on r.id = b.professional_role_id
left join role_categories cat on cat.id = r.category_id
left join care_types ct on ct.id = b.care_type_id;

create or replace view v_export_professionals with (security_invoker = true) as
select p.id, p.full_name, r.name as role, p.professional_status, p.compliance_status,
       p.can_accept_bookings, p.city, p.postcode, p.employment_status, p.created_at,
       cat.name as category,
       p.ofsted_registration_number
from professionals p
left join professional_roles r on r.id = p.professional_role_id
left join role_categories cat on cat.id = r.category_id;

-- Belt-and-braces: the replace preserves the existing ACL, but these views carry
-- PII and must never become API-reachable through a default grant.
revoke all on public.v_export_bookings, public.v_export_professionals
  from anon, authenticated;
