create table content_pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  body       text,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table faq_items (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

create view v_platform_revenue as
select b.id as booking_id, b.status, b.scheduled_start,
       b.total_client_charge, b.total_payout,
       (b.snap_platform_fee * b.duration_hours) as platform_revenue, b.snap_currency
from bookings b;

create view v_export_bookings as
select b.id, b.status, b.booking_type, r.name as role,
       b.scheduled_start, b.scheduled_end, b.duration_hours,
       b.location_address, b.location_postcode,
       b.total_client_charge, b.total_payout,
       (b.snap_platform_fee * b.duration_hours) as platform_revenue,
       b.snap_currency, b.created_at
from bookings b
left join professional_roles r on r.id = b.professional_role_id;

create view v_export_professionals as
select p.id, p.full_name, r.name as role, p.professional_status, p.compliance_status,
       p.can_accept_bookings, p.city, p.postcode, p.employment_status, p.created_at
from professionals p
left join professional_roles r on r.id = p.professional_role_id;

create view v_export_compliance as
select d.id, p.full_name, t.name as document_type, t.is_compliance_critical,
       d.verification_status, d.issued_date, d.expiry_date, d.reference_number, d.issuing_body
from documents d
join professionals p on p.id = d.professional_id
join document_types t on t.id = d.document_type_id;

create view v_export_payments as
select pay.id, pay.booking_id, pay.amount, pay.currency, pay.status, pay.paid_at, pay.created_at
from payments pay;

create view v_export_audit as
select a.id, a.occurred_at, a.actor_type, a.action, a.entity_type, a.entity_id, a.summary
from audit_log a;
