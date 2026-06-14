create table rate_cards (
  id                       uuid primary key default gen_random_uuid(),
  professional_role_id     uuid not null references professional_roles(id),
  client_charge_rate       numeric(10,2) not null,
  professional_payout_rate numeric(10,2) not null,
  platform_fee_type        text not null default 'derived'
                            check (platform_fee_type in ('derived','percentage','fixed')),
  platform_fee_value       numeric(10,2),
  currency                 char(3) not null default 'GBP',
  effective_from           timestamptz not null default now(),
  effective_to             timestamptz,
  created_by               uuid references users(id),
  notes                    text,
  created_at               timestamptz not null default now(),
  constraint rate_margin_ok check (client_charge_rate >= professional_payout_rate)
);
create unique index uq_rate_card_active
  on rate_cards(professional_role_id) where effective_to is null;
