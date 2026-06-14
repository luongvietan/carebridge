begin;
select plan(5);

select has_type('professional_status');
select has_type('compliance_status');
select has_type('booking_status');
-- spot-check critical enum labels
select enum_has_labels('professional_status',
  array['pending_verification','active','compliance_hold','booking_restricted',
        'temporarily_suspended','under_investigation','rejected','removed']);
select enum_has_labels('compliance_status',
  array['pending_review','approved','rejected','compliance_expired','further_info_required']);

select * from finish();
rollback;
