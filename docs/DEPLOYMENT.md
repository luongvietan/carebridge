# CareBridge Connect — Production Deployment

> Runbook for deploying CareBridge Connect under CareBridge Connect Ltd.
> Record actual project refs, URLs, and dates as steps are executed.

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
   - `SELECT count(*) FROM assessment_question_bank;`
   - `SELECT count(*) FROM compliance_requirements;`

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
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (live)
   - `STRIPE_WEBHOOK_SECRET`
   - `PAYOUT_ENC_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL`

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

- Enable daily backups / PITR on the production Supabase project (per plan tier).

### Compliance sweep (verify, do not re-schedule)

Migration `0015_compliance_engine.sql` schedules `compliance-sweep-daily` on hosted Supabase. Verify:

```sql
SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'compliance-sweep-daily';
```

Expect one row: schedule `0 2 * * *`.

### Restore procedure

1. In Supabase dashboard → Backups, select a restore point or create a scratch project from backup.
2. Connect via `psql` or SQL editor.
3. Verify seeded reference data, e.g. `SELECT count(*) FROM compliance_requirements;`

### Restore drill log

| Date | Backup used | Scratch project | Verified | Notes |
|------|-------------|-----------------|----------|-------|
| _pending_ | | | | Record result when drill is performed |
