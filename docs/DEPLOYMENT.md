# CareBridge Connect — Production Deployment

> Runbook for deploying CareBridge Connect under CareBridge Connect Ltd.
> Last updated: **2026-06-16** (partial execution — see [Execution log](#execution-log-2026-06-16)).

## Environment inventory

| Environment | Supabase ref | Status |
|-------------|--------------|--------|
| **Development (hosted)** | `fnpozxbbbevdnpyfgyhs` | Active — linked to this repo |
| **Production** | _pending_ | Blocked — see [Prod blocker](#prod-blocker-free-tier) |

### Hosted development (linked)

| Field | Value |
|-------|-------|
| Project name | carebridge project |
| Project ref | `fnpozxbbbevdnpyfgyhs` |
| Organisation | carebridge (`wxhojudsvbrlaogdiccx`) |
| Region | us-east-1 |
| API URL | `https://fnpozxbbbevdnpyfgyhs.supabase.co` |
| Dashboard | `https://supabase.com/dashboard/project/fnpozxbbbevdnpyfgyhs` |
| Migrations applied | `0000`–`0030` (verified 2026-06-16 via `npx supabase migration list --linked`) |
| GitHub repo | `https://github.com/luongvietan/carebridge` |

### Vercel (existing integration)

| Field | Value |
|-------|-------|
| Latest deployment URL | `https://carebridge-90mnpd2e1-luongvietans-projects.vercel.app` |
| Last deployed SHA | `1cf71dd` (2026-06-15 — **pre-S4**; redeploy required after S4 merge) |
| Root directory | `apps/web` |
| Vercel CLI | Not authenticated in this environment (device login required) |

---

## Execution log (2026-06-16)

| Step | Result |
|------|--------|
| Verify hosted migrations through `0030_export_views.sql` | ✅ All 31 migrations in sync |
| Verify seed data on hosted DB | ✅ `assessment_question_bank`: 8 rows; `compliance_requirements`: 24 rows |
| Verify `compliance-sweep-daily` cron | ✅ One job, schedule `0 2 * * *` |
| Create production Supabase project `carebridge-prod` | ❌ Free-tier org limit (2 active projects) |
| Vercel redeploy with S4 code | ⏳ Pending push + Vercel auth |
| Restore drill (physical backup) | ⏳ No backups available yet (see [Backups & restore](#backups--restore)) |
| Full matrix E2E (5 Playwright projects) | ✅ 20/20 smoke tests passed locally |

---

## Prod blocker (free tier)

Attempted:

```bash
npx supabase projects create carebridge-prod \
  --org-id wxhojudsvbrlaogdiccx \
  --region us-east-1 \
  --db-password '<generated>'
```

**Error:** organisation admin `luongvietan` has reached the maximum of **2 active free projects**.

**To unblock production:**

1. Pause or delete an unused active project (e.g. `motionfree` / `kvbvnocqwkllejwxxwgs`), **or**
2. Upgrade the carebridge organisation to a paid plan, **then**
3. Re-run the create command above and continue from [§1 Production Supabase](#1-production-supabase-project).

---

## Prerequisites

- Supabase CLI linked to the organisation
- Vercel access under CareBridge Connect Ltd
- Live Stripe account + Resend API key
- Domain DNS access

## 1. Production Supabase project

1. Create a new Supabase project under **CareBridge Connect Ltd** (distinct from dev `fnpozxbbbevdnpyfgyhs`). Record `<PROD_REF>`.
2. Link the repo: `npx supabase link --project-ref <PROD_REF>`
3. Apply migrations: `npx supabase db push` (through `0030_export_views.sql`).
4. Load seeds: `psql "<PROD_DB_URL>" -f supabase/seed.sql`
5. Verify in SQL editor:
   - `SELECT count(*) FROM assessment_question_bank;` — expect **8**
   - `SELECT count(*) FROM compliance_requirements;` — expect **24**

## 2. Founder admin user

1. Create Ana's account in Supabase Auth with `user_metadata`: `{ "account_type": "admin", "full_name": "Ana ..." }`
2. `handle_new_user` provisions `users.account_type` only — set founder flag manually:
   ```sql
   UPDATE users SET is_founder = true WHERE email = '<ana@...>';
   ```
3. Confirm sign-in reaches `/admin`.

## 3. Encryption key

1. Generate a **stable** production key: `openssl rand -base64 32`
2. Store as `PAYOUT_ENC_KEY` in the secrets manager.
3. **Warning:** rotating this key breaks decryption of stored bank details.

## 4. Vercel project

1. Create project under CareBridge Connect Ltd; root directory `apps/web`.
2. Set environment variables (values in client secret store only):
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://<PROD_REF>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (live)
   - `STRIPE_WEBHOOK_SECRET`
   - `PAYOUT_ENC_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Redeploy after S4 merge so `/admin/reports` and `/api/export/*` are live.

## 5. Domain + SSL

1. Add custom domain in Vercel.
2. Point DNS records; verify certificate issued.

## 6. Supabase Auth

1. Set `site_url` and redirect URLs to the production domain.
2. Configure Resend SMTP for transactional auth emails.

## 7. Live Stripe webhook

Create endpoint `https://<domain>/api/stripe/webhook` for:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Copy signing secret to `STRIPE_WEBHOOK_SECRET`.

## 8. Key rotation

Rotate the dev service-role key that was shared externally. Update `.env.local` and local tooling.

## 9. Smoke check

1. Load production URL.
2. Sign in as Ana → `/admin/reports`.
3. Download one CSV export.

---

## Backups & restore

### Backup schedule

- Enable daily backups / PITR on the **production** Supabase project (requires paid plan).
- Hosted dev (`fnpozxbbbevdnpyfgyhs`) status checked 2026-06-16:
  - `walg_enabled`: true
  - `pitr_enabled`: false
  - Physical backups listed: **none yet** (`npx supabase backups list --project-ref fnpozxbbbevdnpyfgyhs`)

### Compliance sweep (verify, do not re-schedule)

Migration `0015_compliance_engine.sql` schedules `compliance-sweep-daily` on hosted Supabase. Verified on hosted dev:

```sql
SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'compliance-sweep-daily';
-- Result: jobid=1, schedule='0 2 * * *'
```

### Restore procedure

1. In Supabase dashboard → Backups, select a restore point or create a scratch project from backup.
2. Connect via `psql` or SQL editor.
3. Verify seeded reference data, e.g. `SELECT count(*) FROM compliance_requirements;` — expect **24**.

### Restore drill log

| Date | Backup used | Scratch project | Verified | Notes |
|------|-------------|-----------------|----------|-------|
| 2026-06-16 | _none available_ | _n/a_ | Partial | Hosted dev: no PITR, empty backup list. Seed integrity verified via live SQL counts (8 / 24). Full physical restore drill deferred until prod project on paid tier with PITR enabled. |
