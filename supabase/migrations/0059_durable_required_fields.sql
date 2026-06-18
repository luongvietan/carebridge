-- Audit v3 §5/§8: address (clients/orgs) is required by the registration Zod
-- schema but the columns are nullable, so the "required address" invariant is
-- only app-layer. And payments.refunded_amount (0054) had no upper bound, so a
-- malformed Stripe refund event could store refunded_amount > amount.
--
-- Add the constraints NOT VALID: they enforce all new/updated rows immediately
-- without failing on any pre-existing legacy row that predates the rule.

alter table private_clients
  add constraint private_clients_address_present
  check (address_line1 is not null and city is not null and postcode is not null) not valid;

alter table organisations
  add constraint organisations_address_present
  check (address_line1 is not null and city is not null and postcode is not null) not valid;

alter table payments
  add constraint payments_refunded_within_amount
  check (refunded_amount is null or refunded_amount <= amount) not valid;
