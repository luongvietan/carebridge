# S1 — Professional Onboarding, Assessment & Compliance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Implements subsystem **S1** from [the master plan](2026-06-14-carebridge-mvp-master-plan.md) (Phase 2 · Weeks 2–4). Builds on S0 (auth, RBAC, supabase clients) and the DB layer.

**Goal:** The four-gate professional journey — eligibility screening → competency assessment → profile → document upload — plus admin verification and a compliance dashboard on top of the existing auto-block engine.

**Architecture:** A resumable onboarding wizard under `src/app/professional/onboarding`. Pure domain logic (assessment scoring/attempt rules, eligibility outcome, required-document resolution) lives in `src/lib/*` and is unit-tested independently of React. Documents upload to a private Supabase Storage bucket; admin review runs as server actions using the service client and writes to `audit_log`.

**Tech Stack:** Next.js server actions + client wizard, Supabase Storage, Zod, Vitest, Playwright. DB already provides `eligibility_screenings`, `assessment_question_bank`, `assessment_attempts`, `assessment_answers`, `documents`, `compliance_requirements`, `compliance_alerts`, `fn_run_compliance_sweep`.

**Blocking inputs from Ana (needed before tasks 3 & 7):** the **competency question bank per role** (seeds `assessment_question_bank`) and the **compliance status/suspension workflow sign-off** (confirms the status transitions). Task structure does not depend on the exact questions, so build can start; only the seed data and final approval gates wait.

---

## Conventions
- Run loop unchanged: `npx supabase db reset && npx supabase test db`; `npm run test`; `npm run e2e`.
- New migrations continue the sequence from `0018`: next is `0019_storage_documents.sql`.
- Storage object paths: `documents/{professional_id}/{document_type_code}/{uuid}-{filename}`.

## File structure
```
src/app/professional/onboarding/
  layout.tsx                      # wizard shell + step indicator
  eligibility/page.tsx
  assessment/page.tsx
  profile/page.tsx
  documents/page.tsx
src/lib/assessment/
  selection.ts                    # randomised question pick per role
  scoring.ts                      # score, pass(>=80), attempt rules
  selection.test.ts  scoring.test.ts
src/lib/compliance/
  requirements.ts                 # which doc types a role still needs
  requirements.test.ts
src/lib/onboarding/actions.ts     # server actions: submitEligibility, startAttempt, submitAttempt, saveProfile, uploadDocument
src/app/admin/compliance/
  page.tsx                        # review queue (pending docs)
  [documentId]/review.tsx         # approve/reject/further-info
src/lib/admin/compliance-actions.ts
```

---

## Task 1: Private documents storage bucket + policies

**Files:** Create `supabase/migrations/0019_storage_documents.sql`, `supabase/tests/0020_storage_test.sql`

- [ ] **Step 1: Failing test** — assert the bucket exists and is private.
```sql
begin;
select plan(2);
select is( (select public from storage.buckets where id='documents'), false, 'documents bucket is private');
select isnt( (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
              and policyname like 'documents_%'), 0::bigint, 'documents storage policies exist');
select * from finish();
rollback;
```
- [ ] **Step 2: Run** `npx supabase test db` → FAIL.
- [ ] **Step 3: Migration**
```sql
insert into storage.buckets (id, name, public) values ('documents','documents', false)
  on conflict (id) do nothing;

-- A professional may read/write only objects under their own professional folder.
create policy documents_owner_rw on storage.objects for all to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (select id::text from public.professionals where user_id = auth.uid())
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (select id::text from public.professionals where user_id = auth.uid())
  );

create policy documents_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_admin());
```
- [ ] **Step 4: Run** `npx supabase db reset && npx supabase test db` → PASS.
- [ ] **Step 5: Commit** `feat(db): private documents storage bucket with owner/admin policies`

## Task 2: Eligibility screening step

**Files:** `src/lib/onboarding/actions.ts` (add `submitEligibility`), `src/app/professional/onboarding/eligibility/page.tsx`, `src/lib/validation/onboarding.ts` (+test)

- [ ] **Step 1: Failing unit test** for an `eligibilityOutcome(trainingCurrent)` helper in `src/lib/compliance/requirements.ts`:
```ts
import { describe, it, expect } from "vitest";
import { eligibilityOutcome } from "./requirements";
describe("eligibilityOutcome", () => {
  it("continues when training current", () => expect(eligibilityOutcome(true)).toBe("continue"));
  it("pends when training not current", () => expect(eligibilityOutcome(false)).toBe("pending"));
});
```
- [ ] **Step 2: Run** `npm run test` → FAIL.
- [ ] **Step 3: Implement** `eligibilityOutcome` returning `"continue" | "pending"`; add Zod `eligibilitySchema` (employment_status enum + per-training booleans + overall trainingCurrent).
- [ ] **Step 4:** Server action `submitEligibility(formData)` → insert `eligibility_screenings` (RLS: professional self). Form page posts to it.
- [ ] **Step 5: Run** `npm run test` → PASS; manual: form saves and routes to assessment.
- [ ] **Step 6: Commit** `feat(app): eligibility screening onboarding step`

## Task 3: Assessment domain logic (selection, scoring, attempts)

**Files:** `src/lib/assessment/selection.ts` (+test), `src/lib/assessment/scoring.ts` (+test)

- [ ] **Step 1: Failing tests**
```ts
// scoring.test.ts
import { describe, it, expect } from "vitest";
import { scorePercent, isPass, nextAttemptState } from "./scoring";
describe("scoring", () => {
  it("scores percent correct", () => expect(scorePercent([true, true, false, true])).toBe(75));
  it("passes at 80", () => { expect(isPass(80)).toBe(true); expect(isPass(79.9)).toBe(false); });
  it("locks after 3rd fail", () => {
    expect(nextAttemptState(3, false)).toMatchObject({ canRetry: false });
    expect(nextAttemptState(2, false)).toMatchObject({ canRetry: true });
  });
});
// selection.test.ts — pickQuestions returns N unique active questions for the role, randomised
```
- [ ] **Step 2: Run** `npm run test` → FAIL.
- [ ] **Step 3: Implement** `scorePercent`, `isPass` (`>= 80`), `nextAttemptState(attemptNumber, passed)` (locks at 3, returns `lockUntil = now + 3 months`); `pickQuestions(pool, n)` (Fisher–Yates, returns ids).
- [ ] **Step 4: Run** `npm run test` → PASS.
- [ ] **Step 5: Commit** `feat(app): competency assessment scoring and selection logic`

## Task 4: Assessment server actions + UI step

**Files:** `src/lib/onboarding/actions.ts` (`startAttempt`, `submitAttempt`), `src/app/professional/onboarding/assessment/page.tsx`

- [ ] **Step 1:** `startAttempt()` — guard `assessment_locked_until`; compute next `attempt_number`; `pickQuestions` for the professional's role; insert `assessment_attempts` with `served_question_ids`; return questions (without correct answers) to the client.
- [ ] **Step 2:** `submitAttempt(attemptId, answers)` — load served questions + correct options, write `assessment_answers`, compute score, set `passed`, update attempt; on 3rd fail set `professionals.assessment_locked_until`.
- [ ] **Step 3:** Assessment page renders questions, posts answers, shows pass/fail + attempts remaining.
- [ ] **Step 4: Verify** with a seeded question set (see Task 9 seed); manual run through pass and fail paths.
- [ ] **Step 5: Commit** `feat(app): online competency assessment with attempts and auto-scoring`

## Task 5: Professional profile step + photo upload

**Files:** `src/lib/onboarding/actions.ts` (`saveProfile`), `src/app/professional/onboarding/profile/page.tsx`, `src/lib/validation/onboarding.ts` (profileSchema)

- [ ] **Step 1:** `profileSchema` (all PDF fields: dob, address, NI number, role, summary, skills, availability, travel distance, driving licence, vehicle).
- [ ] **Step 2:** `saveProfile(formData)` updates the professional row (RLS self) and inserts `professional_skills`/`professional_availability`; uploads photo to `documents/{id}/profile/`.
- [ ] **Step 3:** Profile form page.
- [ ] **Step 4: Commit** `feat(app): professional profile step with photo upload`

## Task 6: Document upload step

**Files:** `src/lib/onboarding/actions.ts` (`uploadDocument`), `src/app/professional/onboarding/documents/page.tsx`

- [ ] **Step 1:** Page lists required document types for the role (from `requirements.ts` against `compliance_requirements`), shows status per type.
- [ ] **Step 2:** `uploadDocument` uploads the file to the private bucket and inserts a `documents` row (type, reference number, issued/expiry dates) in `pending_review`.
- [ ] **Step 3: Verify** RLS — a professional cannot read another professional's objects (covered by Task 1 policy; add a Playwright assertion in Task 9).
- [ ] **Step 4: Commit** `feat(app): compliance document upload step`

## Task 7: Admin document review queue

**Files:** `src/lib/admin/compliance-actions.ts`, `src/app/admin/compliance/page.tsx`, `.../[documentId]/review.tsx`

- [ ] **Step 1:** Queue lists `pending_review` / `further_info_required` documents across professionals (admin RLS).
- [ ] **Step 2:** `reviewDocument(documentId, decision, note)` (service client): set `verification_status` to approved/rejected/further_info_required, set `verified_by/at`; recompute the professional's `compliance_status`/`professional_status` (all critical docs approved → `approved`/`active`); write `audit_log` and a `professional_status_actions` row on restriction/reinstatement.
- [ ] **Step 3: Verify** approving the last missing critical doc flips `can_accept_bookings` to true.
- [ ] **Step 4: Commit** `feat(app): admin compliance document review and status recompute`

## Task 8: Compliance dashboard (expiry + non-compliant)

**Files:** `src/app/admin/compliance/page.tsx` (extend), reuse `compliance_alerts` + `v_export_compliance`

- [ ] **Step 1:** Surface `compliance_alerts` (expiring/expired) and highlight non-compliant professionals; link to each professional's documents.
- [ ] **Step 2:** Add a "run sweep now" admin action calling `fn_run_compliance_sweep()` (service client) for manual testing.
- [ ] **Step 3: Commit** `feat(app): admin compliance dashboard with expiry alerts`

## Task 9: Seed assessment questions + E2E

**Files:** `supabase/seed.sql` (append questions once Ana provides them), `e2e/onboarding.spec.ts`

- [ ] **Step 1:** Append a representative `assessment_question_bank` seed per role and `compliance_requirements` per role (real questions supplied by Ana; placeholders flagged until then).
- [ ] **Step 2:** E2E: a confirmed professional completes eligibility → passes assessment → fills profile → uploads a DBS doc; an admin approves it; assert `can_accept_bookings` becomes true. Assert a professional cannot fetch another's document object.
- [ ] **Step 3: Run** `npm run e2e` → PASS.
- [ ] **Step 4: Commit** `test(app): onboarding + admin approval E2E`

---

## Test strategy
Vitest for `scoring`, `selection`, `requirements`, validation schemas (pure logic). pgTAP already covers the auto-block engine + storage policies. Playwright for the full onboarding journey and admin approval; one negative test for cross-professional document access.

## Acceptance
A professional completes all four gates; failing the assessment 3× sets a reapply lock; documents are private to owner+admin; admin approval flips compliance/booking eligibility; expiring/expired criticals surface and auto-restrict.

## Self-review
- Master-plan S1 coverage: eligibility (T2), assessment (T3–4, T9), profile (T5), documents (T6, T1), admin verification (T7), compliance dashboard (T8). Mapped.
- Blocking inputs (questions, workflow sign-off) explicitly flagged at T3/T7/T9, not silently assumed.
- No placeholder code in steps that ship code; UI steps describe concrete forms with the exact fields from the DB schema.
