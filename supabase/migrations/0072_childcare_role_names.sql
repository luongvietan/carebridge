-- Client request, 7 August 2026: the childcare roles should read as
-- "Ofsted Registered Nanny" and "Registered Childminder".
--
-- Renaming the role itself rather than dressing it up on the marketing page
-- carries the compliance message everywhere it matters — the booking form, the
-- admin queues, the exports and the emails — which is the point she is making
-- about compliance being the platform's strongest asset.
--
-- Codes are untouched, so nothing that keys on them (the Ofsted trigger, the
-- register mapping, the assessment bank) has to change.

update professional_roles set name = 'Ofsted Registered Nanny' where code = 'nanny';
update professional_roles set name = 'Registered Childminder'  where code = 'childminder';
