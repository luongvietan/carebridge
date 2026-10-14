# Operations readiness — 11 October 2026

This is the operational handover for the Portugal-first web release. Local drills do not certify production backups, alert delivery, provider configuration or staffing. Keep the private-preview gate until business launch approval.

## Read-only monitoring

```powershell
npm run ops:monitor -- --origin https://www.carebridgeconnect.co.uk
# Explicit local HTTP-only smoke check; database is reported as not assessed.
npm run ops:monitor -- --origin http://127.0.0.1:3100 --http-only
```

The command probes `/`, `/login` and `/register`. A same-origin redirect to `/gate` is accepted only if the gate itself returns HTML with HTTP 200. Unexpected redirects, non-HTML replies, timeouts and HTTP errors fail. The full check also reads the PT reference row through the Supabase **anon** client; it does not require a service-role key. Output contains status, timings and booleans, never response bodies, customer records or credentials. Passing means these narrow availability checks passed; it does not prove legal readiness, email deliverability, payments or a successful user journey.

Use `OPS_APP_ORIGIN` for the canonical serving HTTPS origin and `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the intended database. Local runs load `apps/web/.env.local`; always pass an explicit origin when testing localhost.

`.github/workflows/ops-monitor.yml` is a **manual** GitHub Actions check. After publishing the changes, set repository variable `OPS_SUPABASE_URL`, secret `OPS_SUPABASE_ANON_KEY`, and dispatch with the canonical origin. No recurring monitor or notification channel is active merely because the workflow exists locally.

Before launch, configure an external uptime service to probe the canonical site every five minutes and notify the named primary and backup operators after two consecutive failures. Test a notification and recovery notification. Proposed starting thresholds below require operator approval and evidence:

| Signal | Trigger | Response |
| --- | --- | --- |
| Site/database availability | Two consecutive failed probes | Primary operator investigates immediately; backup takes over if unacknowledged after 15 minutes |
| Application errors | Sustained 5xx increase or repeated errors in auth, booking, payment, uploads | Correlate deployment and provider logs; keep customer data out of incident messages |
| Stripe | Failed webhook deliveries or payment reconciliation mismatch | Inspect Stripe dashboard; reconcile event IDs before replay; avoid duplicate charges |
| Email | Failed delivery records, provider failures/bounces | Inspect Resend and notification history; confirm recipient/consent before retrying |
| Compliance/cron | Scheduled application/DB jobs missing a successful daily run | Inspect Vercel cron logs and pg_cron history; verify secret and expiry sweep independently |
| Backup | Latest successful backup exceeds the agreed RPO | Escalate before migration/deploy; verify both database and document objects |

Do not use the cron URL as an uptime probe: it performs business operations.

## Local backup and recovery drill

Requires PowerShell 7.2+, Docker and the running local Supabase database/storage containers. Stop local writers, including E2E, before running:

```powershell
npm run ops:recovery
```

`scripts/local-recovery-drill.ps1` accepts no remote target. It verifies the named containers' Supabase project labels, takes a PostgreSQL custom-format dump and a role dump without passwords, and copies local storage objects into the ignored `.ops-backups/<timestamp>/` directory. It restores into a new network-isolated container using the same database image, checks user/booking/document/country counts, round-trips storage bytes and compares SHA-256 file hashes, then rehearses PT market closure inside a rolled-back transaction. The disposable container/volume are removed; the source stack and backups are preserved.

An interrupted or failed drill is a failed check. A changing source may cause count mismatches: stop writers and rerun. Backups can contain personal data; restrict access and move any retained copies to approved encrypted storage. Database files are not committed. Local roles are restored without passwords; do not use this drill as a complete production identity/secret recovery procedure.

## Production backup and restore acceptance

The user confirmed the Supabase **Free** plan on 11 October 2026. Configure a separately managed export policy; paid-plan database backups/PITR are not verified here. Supabase database backups contain storage metadata, **not uploaded file objects**. See [Supabase backups](https://supabase.com/docs/guides/platform/backups) and [official restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

For this Free project, the proposed policy is a daily database/roles export plus a separate private-storage object copy to approved encrypted off-site storage, with a 30-day retention target for Ana to approve. Until a scheduler and destination are configured, this is a manual checklist, not an active backup service. Record each run's timestamp, checksum/object inventory and success/failure; missing daily evidence triggers escalation to Ana. Verify restoration in isolated staging before relying on it. A service-role key alone is not a full PostgreSQL backup credential.

Ana is the confirmed primary operator; the project owner (the user) is the confirmed backup operator. **WhatsApp to a private number** is the requested alert channel; the number and integration are not configured. A working WhatsApp account/integration and recipient must be configured, then tested with both failure and recovery notifications. No WhatsApp messages were sent, and no automatic alert delivery is active from these local changes. The user has not yet selected an approved encrypted off-site backup destination.

Before production sign-off:

1. Name an accountable backup owner and record the chosen RPO/RTO, schedule, retention and encrypted off-site destination. Suggested initial targets for review: RPO 24 hours, RTO 4 hours; these are not achieved guarantees.
2. Verify the latest successful production database backup and independent private-document object backup. Record timestamp, backup identifier, checksum/inventory and who has restore access.
3. Preserve the existing `PAYOUT_ENC_KEY`, provider secrets and account recovery access in the approved secret manager. Losing the payout key makes restored encrypted bank details unreadable. Do not rotate it as part of this task.
4. Restore an approved backup into an isolated staging project. Disable outbound email, payments and scheduled business jobs there. Check schema/migrations, RLS, auth, document bytes/access, payout decryption, booking/payment history and application behavior. Record actual recovery time.
5. Confirm the new project's Auth redirects, templates, credentials, storage settings and external provider settings separately; a DB dump is not a complete provider configuration backup.

No production backup, restore or configuration change has been performed by the local drill.

Local evidence on 11 October 2026: recovery passed in 8.1 seconds in the disposable container. Counts matched for 112 auth users, 18 bookings, 11 document records and 2 countries; both local storage files matched SHA-256 after the round-trip. The PT market-closure transaction passed. The private evidence is `.ops-backups/20261011-055056/evidence.json`; these fixture counts and timing do not establish production RPO/RTO.

## Incident and rollback procedure

For a broken release, login failure, unavailable uploads, payment discrepancy or suspected access-control failure:

1. Primary operator opens a private incident record with time, affected journeys, last-good deployment and severity. Assign a backup operator and a customer-support contact.
2. Contain new activity: set `PRODUCTION_GATE_ENABLED=true` with the existing secret and close Portugal signup/bookings (`countries.is_live=false`). Verify both from a fresh browser. Re-enabling the gate limits UI access; it does not undo payments or erase sessions/provider events.
3. Promote the reviewed last-good application deployment in Vercel. Keep additive migration 0090 RPC and 0091 signup snapshot column unless a separately reviewed DB recovery plan requires otherwise. Do not load `seed.sql` on production or drop history.
4. Run the read-only probes and controlled auth/booking smoke checks. Compare webhook/payment state with Stripe and actual email delivery state with Resend before any replay.
5. A database restore is a distinct operation requiring an approved recovery point, preservation/reconciliation of transactions since that point, and downtime communication. Do not restore merely to revert application code.
6. Record mitigation, follow-up fixes and evidence. Reopen PT only after technical checks and explicit business approval.

Local evidence covers market closure and existing gate tests. Vercel deployment rollback, production document restore, alert delivery and financial reconciliation still need a controlled staging/production exercise.

## Staffing and launch sign-off

| Responsibility | Named person/channel | Evidence required |
| --- | --- | --- |
| Primary operator, first 72 hours | Ana; WhatsApp requested | Availability window, account/integration and recipient configured, access verified, test alert acknowledged |
| Backup operator | Project owner (the user), confirmed | Availability window, access verified, escalation test |
| Backup owner | Pending user assignment | Schedule, restore access and accepted RPO/RTO |
| Customer-support contact | Pending user assignment | Working inbox/channel and incident message procedure |
| Business go-live approval | Ana, pending confirmation | Approved legal content, rates, assessment bank and five-candidate trial |

These pending items prevent operational production sign-off. Scripts and runbooks are prepared; live monitoring and backup policy must be configured and tested in the actual accounts.
