# Multi-role professionals — design

> Client requirement (Ana, 22 June 2026): a professional may hold more than one
> role, and must pass the assessment for each role they hold.

## The problem

`professionals.professional_role_id` is a single nullable FK. Everything
downstream reads it as *the* role: the booking eligibility trigger, the nightly
compliance sweep, the activation gate, the assessment question bank, the
document requirement set, the register verification, the rate card lookup, the
admin filters and the export views — 24 TypeScript files and six database
objects.

A carer who is also a childminder therefore has to choose. In practice that is
common: an Adult Nurse who nannies at weekends, a Support Worker who is also a
Childminder. Today the platform makes them keep two accounts or give one up.

## Decisions taken

1. **Eligibility is per role.** Being able to accept a booking in role X depends
   only on role X's requirements. A nurse whose nanny role is missing a DBS keeps
   taking nursing shifts.
2. **The assessment cycle is per role.** Three failed attempts in one role locks
   that role for three months and leaves the others alone.
3. **`professional_role_id` stays**, as the primary role, kept in sync by
   trigger. The migration is additive; nothing that reads it today breaks.
4. **Professionals add their own roles**, at any time, from their dashboard.

## Data model

New table, migration `0083`:

```sql
create type role_assignment_status as enum
  ('pending', 'active', 'restricted', 'withdrawn');

create table professional_role_assignments (
  id                      uuid primary key default gen_random_uuid(),
  professional_id         uuid not null references professionals(id) on delete cascade,
  professional_role_id    uuid not null references professional_roles(id),
  is_primary              boolean not null default false,
  status                  role_assignment_status not null default 'pending',
  assessment_locked_until date,
  -- The register reference for THIS role. Null means "use the profile column",
  -- which is what every backfilled primary assignment says. See below.
  registration_reference  text,
  added_at                timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (professional_id, professional_role_id)
);

create unique index uq_prof_primary_role
  on professional_role_assignments (professional_id) where is_primary;
```

**Backfill.** One row per professional that has a `professional_role_id`, with
`is_primary = true` and `status` derived from the professional's current state:
`active` where `can_accept_bookings`, `restricted` where the professional is
`booking_restricted` or `compliance_expired`, otherwise `pending`.

**Sync.** A trigger keeps `professionals.professional_role_id` equal to the
primary assignment's role. A second trigger upserts a primary assignment when
legacy code writes the column directly, so both directions stay honest while the
call sites migrate.

**Withdrawn, not deleted.** A role a professional gives up becomes `withdrawn`.
Historic bookings, payouts and audit rows keep pointing at a row that still
exists.

**Where a register reference lives.** The profile carries three reference
columns — `registration_number`, `ofsted_registration_number`,
`iss_authorisation_number` — one per kind of reference, not one per role. That
holds for a nurse who also childminds (NMC PIN and Ofsted URN are different
columns) but collides for an Adult Nurse who is also a Physiotherapist: an NMC
PIN and an HCPC number both want `registration_number`. So a second and later
assignment stores its own `registration_reference`, and the profile columns
remain the answer for the primary role. `fn_registration_verified` and the
`registration_verifications` rows read the assignment's reference when one is
present. This keeps every existing profile untouched and correct.

## Per-role eligibility

`fn_role_assignment_eligible(p_professional_id uuid, p_role_id uuid) returns boolean`
applies the rules that exist today, scoped to one role:

- every `compliance_requirements` row for that role whose document type is
  `is_compliance_critical` has an `approved` document on the professional;
- at least one passed `assessment_attempts` row **for that role**;
- `fn_registration_verified` for that role's `registration_register` — one of the
  six the platform knows (NMC, HCPC, Ofsted, Ordem dos Enfermeiros, Ordem dos
  Fisioterapeutas, ISS); a role with no register passes this clause;
- the training attestation gate (`eligibility_screenings.training_current`, or an
  approved mandatory training certificate). This is deliberately **shared**: it
  describes the person, not the role.

Documents are shared. One approved DBS satisfies the requirement in every role
that requires a DBS; the professional never uploads the same certificate twice.

**Global status still wins.** `professionals.professional_status` of
`suspended`, `under_investigation`, `rejected` or `removed` blocks every role,
whatever the assignments say. That is the lever Ana needs during an incident, and
it stays a single switch.

## Behaviour that changes

| Object | Change |
|---|---|
| `enforce_booking_eligibility` (0022) | role match becomes `exists (… assignment … status = 'active')` |
| `fn_run_compliance_sweep` (0015) | iterates assignments; restricts the role that is missing a document, not the whole profile. The profile drops to `booking_restricted` only when *no* assignment is left active. |
| `evaluateActivation` / `recomputeCompliance` | return and persist per-assignment state; the professional activates when at least one assignment is eligible |
| `assessment/actions.ts` | attempt is bound to a role; question bank draws that role's role-specific pool; lock read from the assignment |
| Professional booking list | open bookings across every `active` assignment |
| Admin booking assignment | candidate filter reads assignments |
| Export views | roles rendered as a delimited list |

## Assessment

`assessment_attempts` gains `professional_role_id` (not null after backfill to
the primary role). The unique constraint `(professional_id, attempt_number)`
becomes `(professional_id, professional_role_id, attempt_number)`, and the cycle
planner (`planNextCycle`) is scoped the same way. `professionals.assessment_locked_until`
remains, mirroring the primary assignment, so the existing admin display keeps
working.

## Interface

**`/professional/roles`** — new. Lists every assignment with its status and, for
anything not yet active, the outstanding items for that role: documents missing,
assessment not passed, register check absent. "Add a role" offers the roles the
professional does not yet hold, filtered to their country.

Adding a role asks only for what is missing — the registration number for that
role's register if the professional has not given one, and the documents that
role requires and the profile does not already have approved. Then the
assessment for that role. Then the existing admin document review runs unchanged,
and the role activates itself through the same auto-activation path that is
already verified on production.

**Onboarding documents page** — requirements are the union across assignments,
each labelled with the role that needs it.

**Admin professional detail** — every role with its own status, and the same
per-role outstanding list.

## Testing

- **pgTAP**: primary-role uniqueness, the sync triggers, backfill correctness,
  booking trigger accepting a secondary active role and rejecting a pending one,
  the sweep restricting one role and leaving the other active, per-role assessment
  uniqueness.
- **vitest**: eligibility computation, outstanding-items derivation, per-role
  cycle planning, question selection by role.
- **Playwright**: a professional with one active role adds a second, sees only the
  gaps for it, sits that role's assessment, and the role activates once the
  document is approved.

## Rollout

Additive throughout. `0083` creates and backfills; `0084` moves the behaviour
(triggers, sweep, assessment constraint) once the data exists. Neither step
leaves the database in a state the current application cannot read, so each can
be pushed to the hosted project on its own.

## Out of scope

- Different pay rates for a professional in the same role (rate cards stay per
  role and per country, as now).
- Per-role availability calendars — availability remains a property of the person.
- Admin-initiated role assignment. Professionals add their own; an administrator
  who needs to intervene can still suspend the profile or reject a document.
