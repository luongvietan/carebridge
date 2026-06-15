# CareBridge Connect — Ownership Handover Checklist

> PDF §13–14, §17 — transfer to **CareBridge Connect Ltd**

## Accounts to transfer

- [ ] GitHub repository
- [ ] Vercel project
- [ ] Supabase production project
- [ ] Stripe account (live mode)
- [ ] Domain registrar
- [ ] Resend account

## Access verification

- [ ] Founder admin can sign in and access `/admin`
- [ ] `users.is_founder = true` on founder row (if required)

## Environment variables (names only — values in client secret store)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYOUT_ENC_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Documentation delivered

- [ ] `docs/DEPLOYMENT.md` — production runbook with actual refs/URLs filled in
- [ ] `docs/USER_GUIDE.md` — role walkthroughs
- [ ] Restore drill completed and logged in `docs/DEPLOYMENT.md`

## Source code handover

- [ ] Final production tag / release identified
- [ ] Client sign-off on delivered scope
- [ ] Dev service-role key rotated after handover

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Client (CareBridge Connect Ltd) | | | |
