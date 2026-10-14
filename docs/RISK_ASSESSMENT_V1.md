# Private client risk and needs assessment — implementation of Ana's Version 1.0

The source is Ana's *CareBridge Private Client Risk and Needs Assessment*, Version 1.0, Portugal live pilot, dated
14 October 2026. Her four pilot instructions (15 October) are applied as written:

- Emergency answers stop the booking and show the 112 guidance.
- Medium, high and unclear cases are held for review.
- Important "Not sure" answers trigger review.
- The matched professional gets only the relevant safety and needs information.
- The assessment applies to private clients only.

## Where things live

| What | Where |
|---|---|
| Questions, options, points, flags and wording (EN/PT) | `apps/web/src/lib/risk-assessment/questionnaire.ts`; version `2026-10-15-v1.0` is stored with each assessment |
| Scoring, bands, routing outcome, conditional visibility | `apps/web/src/lib/risk-assessment/score.ts` |
| What the professional sees | `apps/web/src/lib/risk-assessment/brief.ts` |
| Client form | `apps/web/src/components/risk-assessment-form.tsx`; used by `booking-request-form.tsx` |
| Admin review | `/admin/bookings/review`, built from `lib/risk-assessment/actions.ts` and `components/risk-review-actions.tsx` |
| Database | migrations 0092–0094: `pending_review` status, `booking_risk_assessments`, `booking_safety_briefs` |

## Flow (spec section 1)

1. The client says who is completing the form (A1). They read the privacy notice and give consent. No health
   question is asked before this.
2. The emergency screen comes next (E1–E5). Any "Yes" stops the journey and shows the 112 guidance with an
   "I understand" button. Nothing is saved.
3. The needs and risk questions follow. They are **conditional**:
   - authority questions A2–A4 only when someone else is answering;
   - the child branch K1–K4 only for a child;
   - daily-living items D1–D8 and adult clinical questions only for adults;
   - the C2/C3 nursing follow-ups only when the request is clinical (main reason, recent discharge, or
     medicine administration);
   - M4 manual lifting only when the person needs help moving or uses equipment.

   The server applies the same visibility, so hidden questions are never required and are not stored.
4. The server scores the answers again, the client sees the section 19 wording, and then books.
   - Only **green** requests (no flag, score 0–7) publish straight away.
   - Everything else is created as `pending_review`, and no professional can see it.
   - A **nursing** outcome can only be booked with a nurse. The client cannot override this.

## Scoring (sections 12–13)

**Points:**
- D1–D8 score 0–3 each.
- M1 falls 0/1/3.
- M3 environment 0/2/4.
- S1 cognition 0/2/4, S2 behaviour 0/2/5, S3 mental health 0/1/4, S4 safeguarding 0/3/6.
- Infection R1, allergy R2 and access R5 score 0/2/4 each.

**Bands:** green 0–7, amber 8–15, red 16+. The rules always take priority over the total.

**Outcomes:**

| Outcome | When |
|---|---|
| **X** | Serious danger in the home, or an aggressive animal |
| **N** | Medicine administration or judgement, any nursing procedure, changing observations, an unstable condition, discharge without a plan, confirmed swallowing risk, respiratory equipment, or a child's clinical procedure |
| **A** | Any other flag, or a score of 8 or more |
| **P** | Rehabilitation with no flags |
| **G** | Everything else |

**Flags that hold a request for review:**
- unclear authority or agreement;
- unknown capacity;
- every child request (authority and safeguarding checks);
- recent discharge;
- any dependency item at 3, a hoist or specialist equipment, or manual lifting that is expected or not known;
- recurrent falls;
- home hazards;
- possible or known safeguarding concern;
- serious behaviour risk;
- recent mental-health crisis;
- vulnerable person involved;
- unmanaged infection or allergy;
- higher-risk or overnight lone working;
- unsafe or unknown access.

**"Not sure" answers:**
- These raise their own review flag: authority, capacity, agreement, unclear clinical need, manual lifting,
  parental authority, unknown access.
- Two or more "Not sure" answers of any kind also hold the request.

## Admin review record (section 15)

The admin records:
- the reason and risk-control measures (internal);
- the permitted professional category — a different category re-prices the booking from its active rate card;
- whether two workers are needed;
- any specific competency or equipment;
- instructions added to the professional's brief;
- a reassessment date;
- a message to the client.

**Decisions:**
- **Approve and publish:** matching professionals are e-mailed.
- **Request more information:** the request stays held, and the client is e-mailed the message.
- **Decline:** the request is cancelled, and the client is e-mailed the message.

Every decision is written to the audit log.

## Who sees what (section 14)

| Who | What they see |
|---|---|
| Client | Their recommendation and status |
| Admin | The full assessment, score, flags and answers by section, plus a preview of the professional's brief |
| Matched professional | On open or assigned work, a "Safety information" brief with practical items only, e.g. hoist in use, no manual lifting, falls risk, lone working overnight, animals, admin instructions. It never includes safeguarding, scores or flags. Each view is written to the audit log. |
| Other professionals | Nothing while the request is held, because `pending_review` bookings are invisible to them |

Alerts carry no health detail. The admin e-mail only says that a request is waiting.

## Governance decisions (Ana, 15 October 2026)

- **Clinical review of the questions and override rules for the pilot:** "Reviewed by Ana Dos Santos, UK
  Registered Nurse and Founder of CareBridge Connect." This statement is in `CLINICAL_REVIEW` in
  `questionnaire.ts` and is shown on the admin review page. Ana is arranging a further review by a nurse
  registered with the Ordem dos Enfermeiros.

- **Lawful basis:**
  - Account and booking information: necessary to provide the requested service (Article 6(1)(b) GDPR).
  - Health information: explicit consent (Articles 6(1)(a) and 9(2)(a) GDPR).

  The notice in the form explains what is collected, why, and who can access it. It also covers retention,
  withdrawal of consent through privacy@carebridgeconnects.com, and the person's rights.

- **Retention:** migration 0095 adds `fn_purge_risk_assessments`, run daily at 03:30 by pg_cron. Every run is
  written to the audit log.
  - **Abandoned requests:** the assessment and safety brief are deleted 30 days later. This covers cancelled or
    declined requests, and requests never staffed 30 days after their end. Unfinished forms are never stored in
    the first place.
  - **Served bookings:** the assessment and safety brief are deleted three years after the final service.
  - **Exceptions:** nothing is deleted while the booking or its client has an open or investigating complaint,
    incident or safeguarding concern, or while `retention_hold` is set (for example a legal claim).

- **Who decides:**
  - Admins decide general and non-clinical (amber) cases.
  - Nursing (N) and red-risk (including X) requests stay on hold until a **clinical reviewer** decides them:
    approve, request more information, change the professional category, or decline. Clinical reviewers are
    accounts with `users.is_clinical_reviewer = true`. No account has this yet; grant it to Ana's own account.
  - The server enforces the rule, and other admins see "Clinical review required".

- **Individual accounts:** every decision and every opening of the review page is written to `audit_log` under
  the reviewer's own user id. Shared logins must not be used. The hosted `admin@carebridgeconnect.co.uk`
  account is a shared mailbox, so Ana needs a personal account.

- **European Portuguese:** all Portuguese text was checked for Brazilian vocabulary, spelling and gerunds; none
  was found. The booking form now refers to Portugal time, and the AI assistant is told never to use Brazilian
  Portuguese.

## Not done for the pilot — needs Ana or a later phase

- **Granting the clinical-reviewer flag:** there is no screen for it yet. It is set once per person, by SQL.
- **Reassessment triggers (section 16):** the date is recorded, but nothing re-prompts the client yet. Bookings
  are single shifts, so the 90-day continuing-service review applies once repeat bookings exist.
- **Admin-editable weights (section 17):** weights change through the versioned config file in the repository,
  not through an admin screen. Historical assessments keep their version.
- **Governance (section 18):** the DPIA and the Ordem dos Enfermeiros review are Ana's to arrange.
- The UK (999) path uses the same questions and has not been reviewed for the UK.
