begin;
select plan(6);

-- Reference data is asserted by shape, not by count. The counts these tests used
-- to pin (4 roles, 5 critical document types, 14 templates) were correct in June
-- and wrong the moment childcare, the nurse split and the new identity documents
-- arrived — a test that has to be edited every time the client adds a role is
-- testing the migration, not the invariant.

select ok(
  (select count(*) from professional_roles) >= 4,
  'professional roles are seeded'
);

-- 0063 put every role under a category and made the column NOT NULL; a role
-- without one would break the grouped pickers and the care-type match.
select is(
  (select count(*)::int from professional_roles where category_id is null), 0,
  'every professional role belongs to a category'
);

select is(
  (select count(*)::int from role_categories where code in ('healthcare','childcare')), 2,
  'both role categories are seeded'
);

select is(
  (select count(*)::int from mandatory_training_types), 7, '7 mandatory training types seeded'
);

-- The documents that must be approved before anyone can accept a booking.
select is(
  (select count(*)::int from document_types
    where is_compliance_critical
      and code in ('enhanced_dbs','right_to_work','mandatory_training_certificate',
                   'professional_registration','professional_indemnity_insurance',
                   'ofsted_registration','paediatric_first_aid')),
  7,
  'the critical document types are seeded and still critical'
);

-- Templates the app sends by name: a missing row means a silent no-send.
select is(
  (select count(*)::int from notification_templates
    where type in ('registration_confirmation','assessment_result','compliance_approval',
                   'compliance_expiry_reminder','compliance_rejected','further_info_required',
                   'booking_request','booking_available','booking_confirmation',
                   'booking_cancellation','payment_receipt','payout_recorded')),
  12,
  'the notification templates the app sends are all seeded'
);

select * from finish();
rollback;
