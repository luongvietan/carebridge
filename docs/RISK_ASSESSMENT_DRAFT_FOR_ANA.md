# Risk and needs assessment — draft for Ana's sign-off

The feature is built and live behind the preview gate: Client → New booking. Everything below is a
**draft**. Please confirm or edit the questions, points and thresholds by **Tuesday 20 October**.
Changes are a one-file edit (`apps/web/src/lib/risk-assessment/questionnaire.ts`).

The form shows in Portuguese for Portuguese clients. The wording below is the English version.
It is guidance for safety, not a medical diagnosis, and the form says so.

## 1. Who is completing it
The person who needs support · A family member or friend · A social worker or care professional ·
Someone else.

## 2. Emergency screen
If the answer to **any** of these is "Yes", the form stops, shows **"Call 112"** and saves nothing:
1. Right now, does the person have difficulty breathing, chest pain, or signs of a stroke?
2. Right now, is the person unconscious, not responding, or having a seizure?
3. Right now, is there severe bleeding, a serious injury, or a suspected overdose or poisoning?
4. Right now, is anyone in immediate danger, including someone who intends to harm themselves or
   another person?

## 3. Needs questions (points in brackets)
| # | Question | Answers |
|---|---|---|
| 1 | Who needs support? | Adult 18–64 (0) · Older adult 65+ (1) · Child under 18 (0) |
| 2 | Main support needed | Company and practical help (0) · Personal care (1) · Clinical care: wounds, injections, catheter, feeding tube (2) · Physiotherapy/rehabilitation (1) · Childcare (0) |
| 3 | Mobility | Independent (0) · Some help or a walking aid (1) · Full help or a hoist (2) · Mostly in bed (3) · Not sure |
| 4 | Medication | None or self-managed (0) · Reminders only (1) · Someone must give it, including injections (2) · Not sure |
| 5 | Memory or understanding | No concerns (0) · Some confusion (1) · Dementia or significant confusion (2) · Not sure |
| 6 | Behaviour that may put people at risk | No (0) · Occasionally (2) · **Often or serious (4, always review)** · Not sure |
| 7 | Left hospital or health change in the last 2 weeks | No (0) · Yes, now stable (1) · **Yes, still unwell or worse (3, always review)** · Not sure |
| 8 | Falls in the last 3 months | None (0) · One (1) · Two or more (2) · Not sure |
| 9 | Mental health | No concerns (0) · Stable diagnosed condition (1) · **Recent crisis, self-harm or suicidal thoughts (4, always review)** · Not sure |
| 10 | Safety concerns in the home | No (0) · Some (1) · **Serious (3, always review)** · Not sure |
| 11 | Does the person agree to the support? | Yes (0) · Not sure or only partly (2, counts as "not sure") · **No (4, always review)** |

The client must then tick a consent box covering the health information and, when answering for
someone else, their authority to do so.

## 4. Risk level
- **High:** a total of 12 points or more, or any answer marked "always review".
- **Unclear:** two or more "Not sure" answers, or childcare chosen for an adult.
- **Medium:** 6–11 points. **Low:** 0–5 points.

**High and Unclear requests are held for admin review.** So is any request where the client books
a different type of professional from the recommendation. Booking a nurse where a support worker
was recommended is allowed without review. Medium and Low requests go live straight away.

## 5. Recommended professional
- Recent mental health crisis → **mental health nurse**
- Clinical care, or medication that must be given → **nurse** (children's nurse for a child)
- Physiotherapy/rehabilitation → **physiotherapist**
- Childcare, or a child needing non-clinical support → **childcare professional**
- Everything else → **support worker / healthcare assistant**

## 6. What happens to a held request
- The client sees "under review" and gets an e-mail.
- Admins get an e-mail, and the request appears under Admin → Bookings → Requests awaiting review,
  with the answers and the reasons it was held.
- Professionals cannot see the request.
- **Approve and publish** opens the request to matching professionals and e-mails the client.
- **Decline** needs a message to the client. The request is cancelled and the client gets the
  message by e-mail.

## Questions for Ana
1. Are these the right questions and point values? Add, remove or reword anything.
2. Should **Medium** requests also go to review, or only High and Unclear?
3. Should the professional who takes the job see a short summary of the assessment, for example
   "falls risk, needs hoist"? It is currently visible only to the client and admins.
4. Does this apply only to private clients (as built), or also to organisations?
