# Portugal launch — state of play and go-live runbook

> Written 2026-09-29, after Ana's 9–26 September messages (WhatsApp) asked for Portugal first,
> the domain move, an AI assistant and final testing by **5 October 2026**.

## What is built

| Area | State |
|------|-------|
| Country dimension (roles, documents, assessment, rate cards in €, notification e-mails in pt-PT) | Built earlier (migrations 0076–0082). |
| **Public site in Portuguese** — nav, footer, hero, stats, roles, compliance story, services, about, contact, FAQ | Built. Content per market in `lib/i18n/content.ts` + `data/marketing-copy-pt.ts`; the UK site is unchanged. |
| **Preview of a not-yet-live market** | While `PRODUCTION_GATE_ENABLED=true`, the homepage country switch lets a reviewer choose Portugal (chip reads "preview"). Once the gate is lifted only a market with `countries.is_live = true` can be chosen, and a stale Portugal cookie falls back to the UK. |
| **Professional onboarding for Portugal** | Built. `professionals.country_code` is now set from the market the person registered from (it was never set — a Portuguese applicant would have sat the UK assessment). Profile step offers only that country's roles, asks for a validated **NIF** (stored in `national_insurance_no`), and does not ask for a UK right-to-work basis. Eligibility, assessment, profile and documents steps read in Portuguese. |
| **Payout details** | Built. IBAN (mod-97 checked, `PT` = 25 chars) as well as UK sort code/account; admin can mark a payout paid by "SEPA transfer". |
| **Stripe Checkout** | Euro bookings open Checkout in Portuguese. Payment methods follow the Stripe dashboard (see below). |
| **Bookings** | The booking form offers only the roles of the market being browsed, and the server refuses a role whose country is not live (outside the private preview). |
| **Sign-in / registration / client + organisation profile / booking form** | Read in Portuguese for the Portuguese market. No CQC field for a Portuguese organisation. |
| **AI assistant** (bilingual) | Built. Floating help button on every public and signed-in page except `/admin` and `/gate`. Answers in the language the visitor writes in (pt-PT / English), only from the site's own FAQ + platform guide. Uses Claude when `ANTHROPIC_API_KEY` is set; otherwise falls back to a keyword match over the same content, so it never shows an error. Rate-limited per IP. Source: `lib/assistant/*`, `app/api/assistant/route.ts`. |
| **Domain** | Code now defaults to `https://carebridgeconnects.com` (`lib/site.ts`); `NEXT_PUBLIC_APP_URL` still wins. Both `carebridgeconnects.com` and `www.` were added to the Vercel project on 2026-09-29. |

## Not done — needs a human or an input

1. **DNS for carebridgeconnects.com** — at the moment it resolves to a parking page, not Vercel. The registrar (Ana) must point the apex `A` record to `76.76.21.21` and `www` `CNAME` to `cname.vercel-dns.com` (or delegate DNS to Vercel). Until then the new domain is attached but not serving.
2. **Switch the environment to the new domain** (only after DNS works, or auth e-mails will link to a dead address):
   - Vercel → `NEXT_PUBLIC_APP_URL=https://carebridgeconnects.com`, `NEXT_PUBLIC_CONTACT_EMAIL` (if the mailbox moves), `RESEND_FROM` (a sender on a domain verified in Resend).
   - Supabase → Authentication → URL configuration: set **Site URL** and add the new domain to **Redirect URLs** (`/auth/confirm`, `/reset/update`).
   - Stripe → the webhook endpoint must be `https://carebridgeconnects.com/api/stripe/webhook`.
   - Optionally redirect the old `.co.uk` domain to the new one in Vercel.
3. **Stripe for Portugal** — Ana said she created a Stripe account. Live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must be set in Vercel by whoever owns that account. In the Stripe dashboard enable the payment methods for Portugal (cards, **MB Way**, **Multibanco**); Checkout picks them up automatically for EUR.
4. **`ANTHROPIC_API_KEY`** in Vercel to switch the assistant from keyword mode to Claude (optional `ASSISTANT_MODEL`, default `claude-haiku-4-5-20251001`). Also allow `api.anthropic.com` egress if a firewall is added.
5. **Regulatory confirmation for Portugal** — Ana's decision. Going live is one statement (below) and lifting the gate.
6. **Portuguese legal documents** — terms, privacy and the disclaimer page are still English. They need a lawyer's Portuguese, not a machine translation. The founder's message on the About page is hidden in Portuguese until Ana approves a translation of her own words.
7. **Portuguese content still to come from Ana** — role-specific assessment questions and childcare rates are placeholders (see earlier notes); the Portuguese company address/phone in the footer (it still shows Manchester).
8. **Still English**: the admin area (staff tooling), the sign-up/password-reset e-mails sent by Supabase Auth itself (hosted template, not locale-aware — needs a Portuguese template in the Supabase dashboard), and the legal pages. Everything else a Portuguese client, organisation or professional sees is Portuguese: public site, sign-in/registration, onboarding, dashboards, bookings, hours, earnings, roles, messages, invoices, server messages, notification e-mails. Money is shown in euros and dates in the pt-PT format.

## 30 September review (Ana)

- Wording changed to her list (Ligamos…, cuidados infantis, Registe-se como profissional, Solicitar um profissional, Categorias profissionais, Amas licenciadas, Profissionais de apoio domiciliário, qualificados, Reino Unido) across the site, FAQ, assistant, e-mails and the role names in the database (migrations 0085/0086).
- Portugal contact: +351 926 562 988 (footer, contact page, WhatsApp link). The company address for Portugal is still a placeholder ("Portugal").
- Independent-professional onboarding rebuilt to her list (migration 0085): ID and right to work, NIF, NISS (new field), Finanças activity proof, Portuguese criminal record (childcare: the certificate covering contact with minors), foreign record when applicable (optional), qualifications and registration (Ordens), liability and workplace-accident insurance, references and CV, bank details (IBAN, prompted at the end of the document step); expiry dates with automatic suspension. Training is no longer asked in Portugal; the 80% assessment stays.

## 5 October — gaps closed before the deadline

- **Portuguese organisations** (migration 0087): an organisation records its market; a Portuguese one chooses a category (hospital/clínica, RNCCI, lar/ERPI, SAD, centro de dia, IPSS/Misericórdia, creche, escola/ATL, empresa, outra — `lib/accounts/organisation-categories.ts`), gives a mod-11-checked **NIPC** and, for licensed categories, the **ERS** registration or **ISS alvará** number. No CQC field in Portugal. Shown on the admin account page and in the organisations export.
- **Portuguese legal pages as drafts** (`data/legal-copy-pt.ts`): client terms, professional terms and privacy policy written for Portugal (RGPD + Lei 58/2019, CNPD, Livro de Reclamações, RAL, DL 24/2014, trabalhador independente, registo criminal / Lei 113/2009, Ordens / ISS, Portuguese law and courts). Every Portuguese legal page carries a "versão provisória para revisão jurídica" notice. Placeholders in brackets — **[denominação social], [NIPC], [morada], [comarca], RAL entity, processor list, criminal-record retention** — need Ana's company details and her lawyer. The disclaimer page now reads in Portuguese too.
- **Supabase Auth e-mails in Portuguese**: `supabase/templates/confirmation.html` and `recovery.html` switch to pt-PT when `user_metadata.market = "PT"` (set at sign-up from the market cookie; existing Portuguese professionals back-filled by 0087). Verified by rendering both with Go's template engine for PT, GB, missing and malformed data. Both are **applied to the hosted project** (dashboard → Authentication → Emails, 5 October; bodies match the files in commit 5f5cf2f, subjects as in `supabase/config.toml`). The hosted "Reset password" was still Supabase's default, whose `{{ .ConfirmationURL }}` link the app's `/auth/confirm` route (token_hash only) cannot verify — password reset should work now, but has not been tested end to end on prod. Keep the dashboard and these files in step by hand: `config push` is not used because it would overwrite the hosted site URL and redirects.
- **Footer / contact address for Portugal**: set `NEXT_PUBLIC_PT_COMPANY_ADDRESS` in Vercel; until then it shows "Portugal".
- **Consumer information in the Portuguese footer** (legal requirement): a link to the Livro de Reclamações Eletrónico (DL 156/2005 as amended by DL 74/2017) and the RAL notice (Lei 144/2015, art. 18). Until Ana names the dispute-resolution entity it points to the official list on the Portal do Consumidor; set `NEXT_PUBLIC_PT_RAL_NAME` and `NEXT_PUBLIC_PT_RAL_URL` in Vercel to name hers (`lib/marketing/consumer-info.ts`). Ana must also register the business on livroreclamacoes.pt itself.

## Go-live for Portugal (when Ana confirms)

```sql
update countries set is_live = true where code = 'PT';
```

then lift the private-preview gate (remove `PRODUCTION_GATE_ENABLED` in Vercel). No code change.

## Verification notes

- Unit tests: `npm test` (384 at the time of writing), `npm run lint`, `npx tsc --noEmit`, `npx next build` all clean.
- The Playwright suite needs the local Supabase stack (Docker) and was not run in this session; the UK flows it covers are untouched apart from the shared footer, roles filtering and the `(auth)` layout.
- The Portuguese onboarding path was verified by type-checking, unit tests and reading the code paths, **not** by walking it end to end with a test account (the local app talks to the hosted database; creating test accounts there was not done).
