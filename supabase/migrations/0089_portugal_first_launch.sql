-- Portugal is the initial launch. Regulatory approval must explicitly open PT.
-- Keep all legacy UK accounts, reference data and booking history intact.
update public.countries set is_live = false where code = 'GB';
