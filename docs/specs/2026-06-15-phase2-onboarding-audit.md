# Phase 2 — Onboarding & Compliance (S1) — Audit

> Date: 2026-06-15. Audits the existing **S1** build (the master plan's *Phase 2 · Weeks 2–4*)
> against the Phase 2 brief: eligibility screening, competency assessment (question bank,
> randomised, auto-scored, 80% pass / 3 attempts), professional profile, document uploads,
> compliance tracking and expiry logic.

## Verdict

**Phase 2 is functionally complete and matches the brief.** Every requirement is implemented,
tested, and merged to `master`. The remaining work is **data + hosted deployment**, not code.
No rebuild is justified.

## Spec coverage

| Requirement | Implementation | Status |
|---|---|---|
| Eligibility screening | `submitEligibility` + `onboarding/eligibility/page.tsx`; outcome `continue`/`pending` on training currency (`eligibilityOutcome`) | ✅ |
| Question bank | `assessment_question_bank` table + seed; served via `startAttempt` using the service client so correct answers never reach the client | ✅ |
| Randomised | `pickQuestions` — Fisher–Yates shuffle (`lib/assessment/selection.ts`) | ✅ (see finding 3) |
| Auto-scored | `submitAttempt` → `scorePercent`, persists `assessment_answers` | ✅ |
| 80% pass | `isPass` = `score >= 80` (`PASS_THRESHOLD = 80`) | ✅ |
| 3 attempts | `nextAttemptState`: locks at attempt 3, sets `assessment_locked_until` = now + 3 months | ✅ |
| Professional profile | `saveProfile` + `onboarding/profile/page.tsx` (+ photo to private bucket) | ✅ |
| Document uploads | `uploadDocument` → private `documents` bucket, owner/admin RLS (migration 0020) | ✅ |
| Compliance tracking | Admin review queue (`admin/compliance/page.tsx`) + `recomputeCompliance` flips `compliance_status`/`professional_status`/`can_accept_bookings` | ✅ |
| Expiry logic | `compliance_alerts` + `fn_run_compliance_sweep` (manual "run sweep" button) + DB auto-block engine | ✅ |

## Verification

- **vitest: 24/24 pass** (re-run this session, 2026-06-15) — covers scoring, selection,
  requirements, and validation schemas.
- **pgTAP + Playwright E2E:** green at build time per build notes; re-run tracked separately
  (requires local Supabase / Docker up).

## Findings

1. **🔴 Assessment questions are placeholders.** `supabase/seed.sql` holds 8 generic questions
   (`professional_role_id = NULL`, all roles), explicitly flagged *"Replace with Ana's real
   per-role question bank."* This is a **content dependency on Ana**, not a code gap, and is the
   #1 open item for Phase 2 sign-off.

2. **🟠 Hosted DB is behind local.** Per build notes, migrations **0019–0021** are not yet
   `db push`ed to hosted, and the assessment-question + compliance-requirements seeds are not
   loaded to hosted (`db push` does not run `seed.sql`). Hosted state was not verified during
   this audit.

3. **🟡 "Randomised" is currently a no-op.** `QUESTIONS_PER_ATTEMPT = 8` and the seed bank has
   exactly 8 questions, so every attempt serves all 8. The selection code is correct; randomisation
   only becomes meaningful once Ana's bank holds **more than 8 questions per role**. When the real
   bank lands, either grow it well beyond 8 or revisit `QUESTIONS_PER_ATTEMPT`.

4. **🟡 Minor deviations from the S1 plan (reasonable simplifications):**
   - Eligibility captures a single overall `trainingCurrent` yes/no rather than per-training
     booleans (plan T2 suggested per-training). The UI lists the 7 training types but records one
     confirmation. Changing to per-training would need a DB migration and an Ana decision — deferred.
   - National Insurance number had no format validation — **addressed** (lenient optional UK NI
     format check in `profileSchema`).

5. **⚪ Memory was stale.** The "reference tables RLS read policy" gap previously noted is in fact
   **closed** by `0019_reference_read_policies.sql` (read for `authenticated` on roles, skills,
   training types, document types, compliance requirements).

6. **Still owed by Ana (unchanged):** the real per-role question bank, and the compliance
   status / suspension workflow sign-off.

## Recommended next steps

1. Re-run the full suite (pgTAP + E2E) once Docker is up to re-confirm green.
2. `db push` migrations 0019–0021 to hosted and load the assessment/compliance seeds to hosted.
3. On delivery of Ana's question bank: replace the placeholder seed and size the bank so
   randomisation is meaningful.
4. Obtain Ana's compliance/suspension workflow sign-off to close Phase 2.
