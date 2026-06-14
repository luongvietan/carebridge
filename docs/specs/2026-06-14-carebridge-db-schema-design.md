# CareBridge Connect — MVP Database Schema Design

- **Date:** 2026-06-14
- **Author:** Viet An (with Claude)
- **Status:** Approved design → ready for implementation plan
- **Source of truth:** `CareBridge Connect MVP Overview.pdf` (15 pages) + email decisions with Ana (Founder)
- **Database:** PostgreSQL via Supabase

---

## 1. Context

CareBridge Connect is a healthcare staffing marketplace connecting verified healthcare
**Professionals** with **Private Clients** and **Organisations**, administered by an
**Admin/Founder**. The platform's three hardest concerns are **compliance tracking**,
**audit**, and **data ownership/export**. This document specifies the full relational
schema for the MVP.

## 2. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Compliance verification | **Admin-led only** (no third-party integration in MVP) |
| 2 | Booking model | **Combination** — open-market accept + admin-assign |
| 3 | Payments | **Stripe** collection; payout simply **recorded** in-platform |
| 4 | Status modelling | **Two axes** — `professional_status` (lifecycle) + `compliance_status` (derived); engine drives `can_accept_bookings` |
| 5 | Rate modelling | **Effective-dated rate cards** + **snapshot onto bookings** |
| 6 | Schema scope | **All MVP data-bearing entities** (~30 tables) |
| 7 | Rate unit | **Per hour** (`duration_hours` on booking) |
| 8 | Platform fee | Default **`derived`** (charge − payout); schema also supports `percentage` / `fixed` |
| 9 | Bank details | **Separate table** `professional_payout_details`, narrow RLS, `pgcrypto` column encryption |

## 3. Conventions

- All tables live in schema `public`. **RLS enabled on every table.**
- Primary keys: `uuid default gen_random_uuid()` (exception: `audit_log` uses `bigint generated always as identity`).
- Every table has `created_at timestamptz not null default now()`; mutable tables also have `updated_at` maintained by trigger `set_updated_at()`.
- `users.id` references `auth.users(id)` (Supabase Auth).
- Admin-extensible lists (roles, document types, skills, training types) → **reference tables**.
- Engine-reasoned states → **enums** (stable, validated at DB level).
- Money: `numeric(10,2)`; `currency char(3) default 'GBP'`.
- Soft removal via status (`professional_status = 'removed'`), not hard delete, to preserve audit.

---

## 4. Enums

```sql
create type account_type as enum ('professional','private_client','organisation','admin');

create type employment_status as enum
  ('nhs_employed','private_sector_employed','self_employed','not_employed_in_healthcare');

create type professional_status as enum
  ('pending_verification','active','compliance_hold','booking_restricted',
   'temporarily_suspended','under_investigation','rejected','removed');

create type compliance_status as enum
  ('pending_review','approved','rejected','compliance_expired','further_info_required');

create type document_status as enum
  ('pending_review','approved','rejected','expired','further_info_required');

create type booking_status as enum
  ('open','assigned','accepted','confirmed','in_progress','completed','cancelled','no_show');

create type payment_status as enum
  ('pending','requires_action','succeeded','failed','refunded');

create type payout_status as enum ('pending','recorded','paid');

create type assessment_topic as enum
  ('safeguarding','infection_prevention_control','gdpr_confidentiality','professional_boundaries',
   'documentation_record_keeping','medication_awareness','health_safety','role_specific');
```

---

## 5. Identity & Access

```sql
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  account_type  account_type not null,
  is_founder    boolean not null default false,   -- Founder = unrestricted super-admin
  is_active     boolean not null default true,     -- account-level enable/disable
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  consent_type text not null check (consent_type in ('privacy_policy','terms_conditions','gdpr_data_handling')),
  version      text not null,
  accepted_at  timestamptz not null default now(),
  ip_address   inet
);
create index idx_consents_user on consents(user_id);
```

---

## 6. Professional profile

```sql
create table professional_roles (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,         -- 'registered_nurse'
  name       text not null,                -- 'Registered Nurse'
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true
);

create table professionals (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references users(id) on delete cascade,
  full_name              text not null,
  date_of_birth          date,
  address_line1          text,
  address_line2          text,
  city                   text,
  postcode               text,
  national_insurance_no  text,            -- consider pgcrypto if storing in clear
  professional_role_id   uuid references professional_roles(id),
  professional_summary   text,
  travel_distance_km     integer,
  has_driving_licence    boolean,
  has_vehicle            boolean,
  profile_photo_path     text,
  employment_status      employment_status,
  -- TWO-AXIS STATUS
  professional_status    professional_status not null default 'pending_verification',
  compliance_status      compliance_status   not null default 'pending_review',
  can_accept_bookings    boolean generated always as
                           (professional_status = 'active' and compliance_status = 'approved') stored,
  -- assessment gate
  assessment_locked_until date,           -- set when all 3 attempts fail (3–6 months)
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index idx_prof_role   on professionals(professional_role_id);
create index idx_prof_status  on professionals(professional_status);
create index idx_prof_comp    on professionals(compliance_status);

create table professional_skills (
  professional_id uuid not null references professionals(id) on delete cascade,
  skill_id        uuid not null references skills(id),
  primary key (professional_id, skill_id)
);

create table professional_availability (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  day_of_week     smallint check (day_of_week between 0 and 6),
  start_time      time,
  end_time        time
);
```

---

## 7. Eligibility & Competency Assessment

```sql
create table mandatory_training_types (
  id        uuid primary key default gen_random_uuid(),
  code      text unique not null,    -- 'safeguarding_adults'
  name      text not null,
  is_active boolean not null default true
);

create table eligibility_screenings (
  id                 uuid primary key default gen_random_uuid(),
  professional_id    uuid not null references professionals(id) on delete cascade,
  employment_status  employment_status not null,
  training_current   boolean not null,          -- all mandatory training within 12 months?
  outcome            text not null check (outcome in ('continue','pending')),
  submitted_at       timestamptz not null default now()
);

create table professional_training_records (
  id                  uuid primary key default gen_random_uuid(),
  professional_id     uuid not null references professionals(id) on delete cascade,
  training_type_id    uuid not null references mandatory_training_types(id),
  completed_date      date,
  expiry_date         date,
  certificate_doc_id  uuid,                       -- FK added after documents (see §8)
  created_at          timestamptz not null default now(),
  unique (professional_id, training_type_id)
);

create table assessment_question_bank (
  id                   uuid primary key default gen_random_uuid(),
  professional_role_id uuid references professional_roles(id),  -- null = applies to all roles
  topic                assessment_topic not null,
  question_text        text not null,
  options              jsonb not null,            -- [{"key":"a","text":"..."}, ...]
  correct_option       text not null,
  weight               numeric(4,2) not null default 1,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create table assessment_attempts (
  id                 uuid primary key default gen_random_uuid(),
  professional_id    uuid not null references professionals(id) on delete cascade,
  attempt_number     smallint not null check (attempt_number between 1 and 3),
  served_question_ids jsonb not null,             -- snapshot of randomised question set
  score              numeric(5,2),                -- percentage
  passed             boolean,                     -- score >= 80
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  unique (professional_id, attempt_number)
);

create table assessment_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references assessment_attempts(id) on delete cascade,
  question_id     uuid not null references assessment_question_bank(id),
  selected_option text,
  is_correct      boolean
);
```

**Pass rules (enforced in app + checked by trigger):** pass ≥ 80%; max 3 attempts; on 3rd
failure set `professionals.assessment_locked_until = now() + interval '3 months'` (admin can extend to 6).

---

## 8. Documents & Compliance Tracking

```sql
create table document_types (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique not null,   -- 'enhanced_dbs'
  name                    text not null,
  category                text not null,          -- identity|right_to_work|dbs|registration|qualification|training|insurance|reference|bank
  is_compliance_critical  boolean not null default false,  -- expiry => auto-block
  has_expiry              boolean not null default true,
  is_active               boolean not null default true
);

create table compliance_requirements (
  id                   uuid primary key default gen_random_uuid(),
  professional_role_id uuid not null references professional_roles(id),
  document_type_id     uuid not null references document_types(id),
  is_mandatory         boolean not null default true,
  unique (professional_role_id, document_type_id)
);

create table documents (
  id                  uuid primary key default gen_random_uuid(),
  professional_id     uuid not null references professionals(id) on delete cascade,
  document_type_id    uuid not null references document_types(id),
  storage_path        text not null,        -- private Supabase Storage object path
  original_filename   text,
  reference_number    text,                 -- DBS cert no / NMC-HCPC reg no / policy no
  issuing_body        text,                 -- 'NMC','HCPC', insurer, etc.
  issued_date         date,
  expiry_date         date,
  verification_status document_status not null default 'pending_review',
  verified_by         uuid references users(id),
  verified_at         timestamptz,
  rejection_reason    text,
  notes               text,
  uploaded_by         uuid references users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_documents_prof   on documents(professional_id);
create index idx_documents_expiry on documents(expiry_date) where verification_status = 'approved';

-- deferred FK now that documents exists
alter table professional_training_records
  add constraint fk_training_cert foreign key (certificate_doc_id) references documents(id);

create table compliance_alerts (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  document_id     uuid references documents(id) on delete cascade,
  alert_type      text not null check (alert_type in ('expiring','expired')),
  due_date        date,
  acknowledged    boolean not null default false,
  created_at      timestamptz not null default now()
);
```

### 8.1 Compliance engine

A daily Supabase scheduled job runs `fn_run_compliance_sweep()`, complemented by a trigger
on `documents` (fires on admin approval/rejection):

```sql
create or replace function fn_run_compliance_sweep() returns void language plpgsql as $$
begin
  -- 1) Expire approved docs that are past expiry_date
  update documents set verification_status = 'expired', updated_at = now()
   where verification_status = 'approved'
     and expiry_date is not null and expiry_date < current_date;

  -- 2) Raise 'expiring' alerts N days before expiry (default 30) for critical docs
  insert into compliance_alerts (professional_id, document_id, alert_type, due_date)
  select d.professional_id, d.id, 'expiring', d.expiry_date
    from documents d join document_types t on t.id = d.document_type_id
   where t.is_compliance_critical
     and d.verification_status = 'approved'
     and d.expiry_date between current_date and current_date + 30
     and not exists (select 1 from compliance_alerts a
                      where a.document_id = d.id and a.alert_type = 'expiring' and not a.acknowledged);

  -- 3) For each professional missing ANY approved critical document required for their role:
  --    set compliance_status = 'compliance_expired',
  --        professional_status = 'booking_restricted' (if currently 'active'),
  --    insert professional_status_actions (is_automatic = true, applied_by = null,
  --        reason_code matching the lapsed document), and write audit_log.
  --    Professionals only regain eligibility after admin re-approval (reinstate action).
end;
$$;
```

> Critical document types (`is_compliance_critical = true`): Enhanced DBS, Mandatory Training
> certificates, Professional Registration, Professional Indemnity Insurance, Right to Work.

### 8.2 Suspension & status workflow

```sql
create table professional_status_actions (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references professionals(id),
  action_type      text not null check (action_type in
     ('suspend','compliance_hold','booking_restriction','full_suspension',
      'under_investigation','reinstate','reject','remove')),
  reason_code      text check (reason_code in
     ('last_minute_cancellation','repeated_cancellations','no_show',
      'expired_dbs','expired_training','expired_registration','expired_insurance',
      'right_to_work_concern','safeguarding_concern','client_complaint',
      'conduct_concern','missing_documents','other')),
  reason_text      text,
  internal_notes   text,                       -- admin-only via RLS
  review_date      date,
  resulting_status professional_status,
  applied_by       uuid references users(id),  -- null = system auto-block
  is_automatic     boolean not null default false,
  applied_at       timestamptz not null default now(),
  resolved_at      timestamptz
);
create index idx_status_actions_prof on professional_status_actions(professional_id, applied_at desc);
```

`professionals.professional_status` holds the **current** state; this table is the immutable
**history** of transitions (both admin actions and automatic compliance blocks).

---

## 9. Clients & Organisations

```sql
create table private_clients (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references users(id) on delete cascade,
  full_name          text not null,
  phone              text,
  email_contact      text,
  address_line1      text,
  address_line2      text,
  city               text,
  postcode           text,
  stripe_customer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table organisations (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references users(id) on delete cascade,
  organisation_name       text not null,
  contact_person          text,
  phone                   text,
  email_contact           text,
  address_line1           text,
  address_line2           text,
  city                    text,
  postcode                text,
  cqc_registration_number text,
  billing_email           text,
  billing_address         text,
  stripe_customer_id      text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
```

---

## 10. Rate Management (3-tier, effective-dated)

```sql
create table rate_cards (
  id                       uuid primary key default gen_random_uuid(),
  professional_role_id     uuid not null references professional_roles(id),
  client_charge_rate       numeric(10,2) not null,   -- TIER 1: client pays / hour
  professional_payout_rate numeric(10,2) not null,   -- TIER 2: professional receives / hour
  platform_fee_type        text not null default 'derived'
                            check (platform_fee_type in ('derived','percentage','fixed')),
  platform_fee_value       numeric(10,2),            -- TIER 3: explicit fee when not 'derived'
  currency                 char(3) not null default 'GBP',
  effective_from           timestamptz not null default now(),
  effective_to             timestamptz,              -- null = currently active
  created_by               uuid references users(id),
  notes                    text,
  created_at               timestamptz not null default now(),
  constraint rate_margin_ok check (client_charge_rate >= professional_payout_rate)
);
-- exactly one active card per role
create unique index uq_rate_card_active
  on rate_cards(professional_role_id) where effective_to is null;
```

When `platform_fee_type = 'derived'`, the per-hour platform fee = `client_charge_rate − professional_payout_rate`.
Admin "amends rates centrally" by inserting a new row (`effective_from = now()`) and closing the
previous row (`effective_to = now()`).

---

## 11. Bookings (with rate snapshot)

```sql
create table bookings (
  id                       uuid primary key default gen_random_uuid(),
  requester_user_id        uuid not null references users(id),
  private_client_id        uuid references private_clients(id),
  organisation_id          uuid references organisations(id),
  professional_role_id     uuid not null references professional_roles(id),
  assigned_professional_id uuid references professionals(id),
  booking_type             text not null default 'open_market'
                            check (booking_type in ('open_market','admin_assigned')),
  status                   booking_status not null default 'open',
  scheduled_start          timestamptz not null,
  scheduled_end            timestamptz not null,
  duration_hours           numeric(5,2) not null,
  location_address         text not null,
  location_postcode        text,
  notes                    text,
  -- RATE SNAPSHOT — frozen at create/assign, immune to later rate_card edits
  rate_card_id             uuid references rate_cards(id),
  snap_client_charge_rate  numeric(10,2) not null,
  snap_payout_rate         numeric(10,2) not null,
  snap_platform_fee        numeric(10,2) not null,
  snap_currency            char(3) not null default 'GBP',
  total_client_charge      numeric(10,2) generated always as (snap_client_charge_rate * duration_hours) stored,
  total_payout             numeric(10,2) generated always as (snap_payout_rate * duration_hours) stored,
  assigned_by              uuid references users(id),
  accepted_at              timestamptz,
  created_by               uuid references users(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint one_requester check (num_nonnulls(private_client_id, organisation_id) = 1),
  constraint valid_window  check (scheduled_end > scheduled_start)
);
create index idx_bookings_status on bookings(status);
create index idx_bookings_prof   on bookings(assigned_professional_id);
create index idx_bookings_role   on bookings(professional_role_id);

create table booking_status_history (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  from_status booking_status,
  to_status   booking_status not null,
  changed_by  uuid references users(id),
  reason      text,
  changed_at  timestamptz not null default now()
);

create table booking_cancellations (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references bookings(id) on delete cascade,
  cancelled_by   uuid references users(id),
  cancelled_role text check (cancelled_role in ('professional','client','organisation','admin')),
  is_last_minute boolean not null default false,
  reason         text,
  cancelled_at   timestamptz not null default now()
);
```

**Eligibility check** at acceptance/assignment: enforce `professionals.can_accept_bookings = true`
(plus role match) via app logic and a `before insert/update` trigger on `bookings`.

---

## 12. Payments & Payouts

```sql
create table payments (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references bookings(id),
  payer_user_id            uuid references users(id),
  stripe_payment_intent_id text,
  amount                   numeric(10,2) not null,    -- = booking.total_client_charge
  currency                 char(3) not null default 'GBP',
  status                   payment_status not null default 'pending',
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index idx_payments_booking on payments(booking_id);

create table payouts (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id),
  booking_id      uuid references bookings(id),
  amount          numeric(10,2) not null,             -- = booking.total_payout
  currency        char(3) not null default 'GBP',
  status          payout_status not null default 'pending',
  method          text,
  reference       text,
  recorded_by     uuid references users(id),
  recorded_at     timestamptz,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);
create index idx_payouts_prof on payouts(professional_id);

-- Sensitive: restricted RLS + pgcrypto. Store encrypted; expose only last4 to admin UI.
create table professional_payout_details (
  id                       uuid primary key default gen_random_uuid(),
  professional_id          uuid not null unique references professionals(id) on delete cascade,
  account_name             text,
  sort_code_enc            bytea,             -- pgcrypto pgp_sym_encrypt
  account_number_enc       bytea,             -- pgcrypto pgp_sym_encrypt
  account_number_last4     text,
  recorded_at              timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
```

Platform revenue per booking = `snap_platform_fee * duration_hours`, surfaced via the reporting
view in §15 (no separate ledger table in MVP — YAGNI).

---

## 13. Notifications

```sql
create table notification_templates (
  id      uuid primary key default gen_random_uuid(),
  type    text unique not null check (type in
            ('registration_confirmation','email_verification','assessment_result',
             'compliance_approval','compliance_expiry_reminder','booking_request',
             'booking_confirmation','password_reset')),
  subject text not null,
  body    text not null
);

create table notifications (
  id                uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references users(id) on delete cascade,
  type              text not null,
  channel           text not null default 'email',
  payload           jsonb,
  status            text not null default 'queued' check (status in ('queued','sent','failed')),
  related_entity    text,
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_user_id);
```

---

## 14. Audit Trail (append-only)

```sql
create table audit_log (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),
  actor_user_id uuid references users(id),     -- null = system / scheduled job
  actor_type    text not null default 'user' check (actor_type in ('user','admin','system')),
  action        text not null,                 -- 'document.approved','booking.assigned','professional.suspended'
  entity_type   text not null,                 -- 'document','booking','professional','assessment'
  entity_id     text not null,
  summary       text,
  changes       jsonb,                          -- { "before": {...}, "after": {...} }
  ip_address    inet,
  user_agent    text
);
create index idx_audit_entity on audit_log(entity_type, entity_id);
create index idx_audit_actor  on audit_log(actor_user_id, occurred_at desc);

-- enforce append-only at the DB layer
create rule audit_no_update as on update to audit_log do instead nothing;
create rule audit_no_delete as on delete to audit_log do instead nothing;
```

Triggers write to `audit_log` on insert/update of: `documents`, `bookings`,
`professional_status_actions`, `payments`, `payouts`, `assessment_attempts`, and on
professional registration.

---

## 15. Website content (optional) & Reporting views

```sql
create table content_pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,    -- 'home','about','services','faq','privacy','terms'
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

-- Platform revenue report
create view v_platform_revenue as
select b.id as booking_id, b.status, b.scheduled_start,
       b.total_client_charge, b.total_payout,
       (b.snap_platform_fee * b.duration_hours) as platform_revenue, b.snap_currency
from bookings b;
```

---

## 16. Data export layer (priority #1)

Every exportable entity gets a flat view consumed by the app to stream **CSV/XLSX** on demand:

```
v_export_professionals     v_export_documents        v_export_compliance
v_export_clients           v_export_organisations    v_export_bookings
v_export_assessments       v_export_payments         v_export_payouts
v_export_audit
```

These flatten foreign keys to human-readable labels (role name, status, dates) so any dataset is
exportable at any time — satisfying the Founder's single most important requirement.

---

## 17. RLS policy summary

| Role | Access |
|------|--------|
| Professional | Own `professionals`, `documents`, `assessment_*`, `bookings` (assigned + open in their role), own `payouts`. **No** access to `internal_notes`. |
| Private Client / Organisation | Own profile + own `bookings` + own `payments`. |
| Admin | All operational tables, including `internal_notes` and financials. |
| Founder (`is_founder = true`) | Unrestricted — bypass policy on all tables. |
| `audit_log` | Insert by app/triggers; select by admin/Founder; update/delete blocked by rule. |
| `professional_payout_details` | Professional can write own; admin reads `last4` only. |

---

## 18. Reference seed data

- **professional_roles:** Registered Nurse, Healthcare Assistant, Support Worker, Physiotherapist.
- **mandatory_training_types:** Safeguarding Adults, Safeguarding Children, Basic Life Support, Infection Prevention & Control, Health & Safety, Moving & Handling, GDPR & Confidentiality.
- **document_types:** Photo ID, Right to Work*, Enhanced DBS*, DBS Update Service, Professional Registration*, Qualification, Mandatory Training Certificate*, Professional Reference, Professional Indemnity Insurance*, Bank Details. (`*` = `is_compliance_critical`).
- **notification_templates:** all 8 types listed in §13.

---

## 19. Phase 2 hooks (not built now)

- Per-client / per-booking rate overrides (rate_cards already carries `rate_card_id` on bookings).
- Automated Stripe Connect payouts (replace manual `payouts` recording).
- Ratings & reviews, in-app messaging, video consultations, mobile apps, AI matching.

---

## 20. Open items to confirm before/at build

1. Rate granularity confirmed **per hour** — change to per-shift would alter `bookings.duration_hours`/generated totals.
2. `national_insurance_no` storage — clear text vs `pgcrypto` (recommend encrypt).
3. Whether `content_pages`/`faq_items` are DB-driven or static in Next.js (low cost either way).
