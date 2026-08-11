-- Give professional_roles.country_code a default.
--
-- 0076 made it NOT NULL with no default, so every insert that predates the
-- column — a dozen pgTAP fixtures, and anything else that creates a role without
-- naming a country — fails. That is exactly the breakage 0063 caused with
-- category_id, and the fix there was to chase every call site. This is the
-- better fix, and it is available here because it was not available there:
-- guessing a role's CATEGORY would be wrong (a role is healthcare or childcare,
-- and picking one silently mislabels it), whereas defaulting the COUNTRY to the
-- platform's home market is both correct today and obvious when read.
--
-- 0077 sets 'PT' explicitly on every Portuguese role, so the default never
-- decides anything that matters.

alter table professional_roles alter column country_code set default 'GB';

comment on column professional_roles.country_code is
  'Country whose rules this role follows. Defaults to GB, the platform''s home market; set explicitly when adding a role in another country.';
