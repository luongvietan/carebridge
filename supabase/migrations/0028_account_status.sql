create type account_status as enum ('active','suspended','deactivated');
alter table users add column account_status account_status not null default 'active';
