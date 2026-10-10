# Release operations — Portugal-first fixes

This checkout contains prepared changes, not a production deployment. Keep the access gate while reviewing. Do not load `supabase/seed.sql` into a live project: it contains test accounts and fixtures.

## Verify locally

1. Start Docker, then run `npx supabase start` and `npx supabase db reset --local` from the root. Reset destroys only the local test stack's fixtures.
2. Run `npx supabase test db`, `npm run lint`, `npm test` and `npm run build`.
3. In `apps/web`, run `npx playwright install chromium firefox webkit`, then `npm run e2e`. Config forces local Supabase keys, app URL on port 3100, dummy Stripe credentials and empty Resend/Anthropic keys. It refuses an existing web server. Browsers run serially against one database.
4. Review `/admin/readiness` in the intended environment. It shows configuration presence only; never paste key values into reports or screenshots.
5. Run `npm run readiness -w @carebridge/web` for a read-only, secret-safe report of the configured environment and question coverage. Exit code 1 indicates missing checks; it never changes database rows or certifies business approval.

## Environment and business inputs

| Setting | Required verification |
| --- | --- |
| Supabase URL, anon key, service key | All belong to the intended project; service key stays server-only. |
| `NEXT_PUBLIC_APP_URL` | Actual serving origin. Auth and Checkout must return here. Coordinate DNS, Auth redirects/templates and Stripe webhook on a domain change. |
| `PAYOUT_ENC_KEY` | Use the existing stable key where encrypted bank data exists. Do not generate a replacement without controlled decrypt/re-encrypt migration and backup. |
| `RESEND_API_KEY`, `RESEND_FROM` | Verified sender/domain; explicit send to a consenting trial reviewer checks inbox receipt and branded rendering. Check provider's SPF/DKIM/DMARC guidance. “Sent” only means provider acceptance. |
| `CRON_SECRET` | Bearer secret for cron; verify authenticated route and database compliance sweep job. |
| Stripe secret/webhook secret | Intended live account and signed webhook; validate EUR payment methods. Live prefix alone is insufficient. |
| `ANTHROPIC_API_KEY` | Optional model mode; bilingual FAQ remains available without it. |
| PT company identity, NIPC, address, chosen RAL | Confirm business inputs and lawyer-approved privacy, terms, processor locations and retention. Replace all draft placeholders. |
| PT rates and specialist banks | Written business approval. Existing rate seeds are placeholders; do not invent clinical questions. |
| `NEXT_PUBLIC_SOCIAL_X/LINKEDIN/INSTAGRAM/FACEBOOK` | Optional verified HTTPS profiles; unset profiles are omitted. |

## Deploy the prepared release

1. Back up the database and confirm restore access. Review new migrations against hosted history. 0089 closes UK, 0090 adds the contact RPC, 0091 snapshots signup country. Local checks perform no hosted migration.
2. Apply reviewed migrations to the intended project, then deploy matching application. Contact needs the RPC; country helpers need the snapshot column. Keep them together.
3. Keep `PRODUCTION_GATE_ENABLED=true`. Walk PT signup, confirmation/recovery, profiles, common assessment, specialist preparation block, documents/expiry, encrypted IBAN, organisation profile, EUR booking/payment, email history and exports with consenting trial users.
4. Verify operational alerts, backup access and source/account ownership with Ana. Presence checks do not certify deliverability, valid keys, payment readiness or legal approval.
5. Finish the five-candidate trial and obtain the missing approved business content.
6. On explicit launch approval only, enable PT `is_live=true` and remove the gate. UK stays closed. Verify final-origin Auth redirects and webhook again.

## Rollback

Close PT signup/bookings and re-enable the gate first. Retain additive snapshot column/RPC when rolling back application code. Do not drop encrypted bank data, booking or payment history. Reconcile notification history before retrying delivery because old code could falsely report skipped mail as sent. Backup restoration is a separate controlled operation.
