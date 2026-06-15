# CareBridge Connect — User Guide

## Admin (founder / operations)

### Dashboard

Sign in at `/login` with an admin account → `/admin`.

### Approve professionals

1. **Compliance** (`/admin/compliance`) — review uploaded documents; approve or reject.
2. **Users** (`/admin/users`) — search professionals; suspend or reinstate accounts.

### Manage bookings

- **Bookings** (`/admin/bookings`) — view all bookings; assign professionals to open bookings.

### Rates

- **Rates** (`/admin/rates`) — amend rate cards per professional role. Existing booking snapshots are unchanged.

### Finance

- **Finance** (`/admin/finance`) — view payments and payouts summary.
- **Record payouts** (`/admin/finance/payouts`) — record and mark payouts paid.

### Reports & exports

- **Reports** (`/admin/reports`) — download any dataset as CSV or Excel.
- **Audit report** — filter by date, entity type, actor type; preview recent entries and download filtered export.

Nine datasets: professionals, clients, organisations, bookings, assessments, compliance documents, payments, payouts, audit log.

---

## Professional

1. Register → confirm email → sign in.
2. **Onboarding** (`/professional/onboarding/...`):
   - Eligibility screening
   - Profile
   - Document upload
   - Assessment (up to 3 attempts)
3. **Payout details** — enter bank details (encrypted at rest).
4. **Bookings** (`/professional/bookings`) — accept or decline open bookings.

---

## Private client

1. Register → confirm email → complete profile (`/client/register`).
2. **Bookings** (`/client/bookings`) — create and manage bookings; pay via Stripe checkout when prompted.

---

## Organisation

1. Register → confirm email → complete organisation profile (`/organisation/register`).
2. **Bookings** (`/organisation/bookings`) — same booking flow as private clients.
