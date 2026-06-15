-- S4: complete export coverage. Encrypted bank details and stripe_customer_id are
-- deliberately excluded. Plain views; the export endpoint reads them via the service
-- role and the app layer enforces admin-only access (mirrors 0014_content_views.sql).

create view v_export_clients as
select id, full_name, phone, email_contact, city, postcode, created_at
from private_clients;

create view v_export_organisations as
select id, organisation_name, contact_person, phone, email_contact,
       city, postcode, cqc_registration_number, billing_email, created_at
from organisations;

create view v_export_assessments as
select aa.id, p.full_name, r.name as role, aa.attempt_number,
       aa.score, aa.passed, aa.started_at, aa.completed_at
from assessment_attempts aa
join professionals p on p.id = aa.professional_id
left join professional_roles r on r.id = p.professional_role_id;

create view v_export_payouts as
select po.id, p.full_name, po.booking_id, po.amount, po.currency,
       po.status, po.method, po.reference, po.recorded_at, po.paid_at
from payouts po
join professionals p on p.id = po.professional_id;
