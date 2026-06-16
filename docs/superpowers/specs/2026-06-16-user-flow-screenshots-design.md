# CareBridge Connect — User Flow Screenshots Design

- **Date:** 2026-06-16
- **Author:** Viet An (with Claude)
- **Status:** Design approved → ready for implementation plan
- **Objective:** Set up local Supabase with test users for all 4 roles, seed realistic sample data, and capture key user flow screenshots organized in `userflow_screen/` folder.

---

## 1. Context

CareBridge Connect MVP has 4 account types with distinct user journeys:
- **Professional**: Healthcare worker seeking assignments
- **Private Client**: Individual hiring healthcare staff
- **Organisation**: Care facility hiring multiple professionals
- **Admin**: Founder managing the platform

This spec documents how to systematically demonstrate each role's key workflows through screenshots with sample data.

---

## 2. Test Users & Accounts

Create 4 test accounts in local Supabase (one per role):

| Account Type | Email | Password | Role | Sample Data |
|--------------|-------|----------|------|-------------|
| Professional | prof@example.com | TestPass123! | Registered Nurse | Jane Smith, 15 yrs exp, DBS verified |
| Private Client | client@example.com | TestPass123! | Individual | John Brown, seeking home care |
| Organisation | org@example.com | TestPass123! | Care Manager | Sunnyhill Care Ltd, 50-bed facility |
| Admin | admin@example.com | TestPass123! | Founder/Admin | Ana (founder account, unrestricted) |

---

## 3. Sample Data Seeding

### 3.1 Professional Data
- **Name:** Jane Smith, Michael Johnson, Sarah Williams (3 professionals for hiring scenarios)
- **Roles:** Registered Nurse, Healthcare Assistant, Support Worker
- **Experience:** 5–20 years
- **Compliance Status:** Mix of approved, pending_review, compliance_expired
- **Documents:** Enhanced DBS (verified), NMC registration (verified), mandatory training (some expired)
- **Rate:** £18–25/hour

### 3.2 Private Client Data
- **Name:** John Brown, Margaret Davis
- **Address:** London postcodes
- **Care Needs:** Post-operative recovery, elderly parent support, live-in care
- **Booking History:** Mix of completed, in_progress, open

### 3.3 Organisation Data
- **Name:** Sunnyhill Care Ltd, Royal Health Services
- **Type:** Care home, NHS contractor
- **Size:** 20–200 bed capacity
- **Booking Pattern:** Regular recurring shifts, ad-hoc cover

### 3.4 Booking Data
- **Status Mix:** open, assigned, accepted, confirmed, in_progress, completed
- **Dates:** Past, present, future (last 30 days to next 60 days)
- **Rates:** Reflect professional rate cards

---

## 4. Key User Flows & Screenshots

### 4.1 Professional Flow
**Narrative:** Healthcare worker registers, uploads credentials, verifies compliance, accepts a booking.

**Key Screens:**
1. **Registration** — Email, password, account type selection
2. **Profile Setup** — Name, qualifications, professional role, experience years
3. **Upload Documents** — DBS certificate, professional registration, training certs
4. **Compliance Status Dashboard** — Approved/pending/expired documents
5. **Accept a Booking** — View incoming booking requests, accept with rate confirmation
6. **Complete Booking** — Mark shift as completed, view history

### 4.2 Private Client Flow
**Narrative:** Individual registers, searches available professionals, creates a booking.

**Key Screens:**
1. **Registration** — Email, password, account type
2. **Profile Setup** — Name, address, care needs description
3. **Search & Filter** — Browse professionals by role, rate, availability
4. **Professional Profile** — View professional details, certifications, rates, reviews
5. **Create Booking** — Select date/time, duration, agree to rate, submit request
6. **Booking Status** — View pending → accepted → confirmed → in_progress → completed

### 4.3 Organisation Flow
**Narrative:** Care facility registers, invites team members, searches and books professionals for shifts.

**Key Screens:**
1. **Registration** — Organization name, address, care type
2. **Organization Profile** — Team members, billing contact, default rates
3. **Team Invite** — Invite team members (care coordinators, staff)
4. **Search Professionals** — Bulk view with filters (role, rate, DBS status, availability)
5. **Manage Bookings** — Recurring shifts, staffing dashboard, cost tracking
6. **Analytics/Reports** — Usage, spending, top professionals, compliance overview

### 4.4 Admin Flow
**Narrative:** Founder logs in, manages users, verifies compliance documents, monitors platform.

**Key Screens:**
1. **Admin Login** — Email, password (founder-restricted access)
2. **Admin Dashboard** — KPIs: active users by type, compliance status breakdown, bookings, revenue
3. **User Management** — List professionals, clients, organisations; view/edit status
4. **Compliance Verification Workflow** — Review submitted documents (DBS, registration, training); approve/reject/request further info
5. **Document Review Queue** — Pending documents by category, expiry alerts
6. **Platform Analytics** — User growth, booking volume, payment/payout tracking

---

## 5. Data Seeding Strategy

### 5.1 SQL Seeding
- Extend `supabase/seed.sql` to insert:
  - 4 test users (auth.users + public.users table)
  - 3 professional profiles with documents (in various compliance states)
  - 2 private client profiles with care needs
  - 2 organization profiles with team structures
  - 10–15 bookings in mixed states
  - Sample document records (some approved, some pending, some expired)

### 5.2 Auth Setup
- Use Supabase Admin SDK or direct SQL to seed `auth.users`
- Set password hashes directly (or use `auth.users` endpoint with test-mode password)
- Ensure email verification bypassed for local testing

---

## 6. Screenshot Capture Process

### 6.1 Environment
- Local Supabase running at `http://127.0.0.1:54321`
- Next.js dev server running locally
- Chrome/Chromium for consistent rendering

### 6.2 Approach
- Log in as each role sequentially
- Navigate to each key screen
- Use dev server's built-in screenshot / browser DevTools screenshot feature
- Name consistently: `01_registration.png`, `02_profile_setup.png`, etc.
- Capture at **1280×720** (standard desktop viewport) for consistency

### 6.3 Common Considerations
- **Loading states:** Let page fully load before screenshotting
- **Sample data visibility:** Ensure realistic names, rates, documents visible on-screen
- **Authentication:** Log out between role switches to avoid cross-role data leakage
- **Errors:** If compliance-check blocking access, note and screenshot the error state (expected for pending roles)

---

## 7. Output Structure

```
userflow_screen/
├── README.md                          # Index of all flows
├── 01_professional/
│   ├── 01_registration.png
│   ├── 02_profile_setup.png
│   ├── 03_upload_documents.png
│   ├── 04_compliance_dashboard.png
│   ├── 05_accept_booking.png
│   └── 06_complete_booking.png
├── 02_private_client/
│   ├── 01_registration.png
│   ├── 02_profile_setup.png
│   ├── 03_search_professionals.png
│   ├── 04_professional_profile.png
│   ├── 05_create_booking.png
│   └── 06_booking_status.png
├── 03_organisation/
│   ├── 01_registration.png
│   ├── 02_org_profile.png
│   ├── 03_invite_team.png
│   ├── 04_search_professionals.png
│   ├── 05_manage_bookings.png
│   └── 06_analytics.png
└── 04_admin/
    ├── 01_admin_login.png
    ├── 02_dashboard.png
    ├── 03_user_management.png
    ├── 04_compliance_verification.png
    ├── 05_document_review.png
    └── 06_platform_analytics.png
```

### README.md
- Brief description of each role's flow
- Test account credentials (email/password for each role)
- Screenshots are ordered top-to-bottom as a narrative walk-through
- Notes on sample data used (e.g., "Professional: Jane Smith, Registered Nurse")

---

## 8. Success Criteria

✅ All 4 test users created and can log in  
✅ Sample data seeded (professionals, clients, organisations, bookings, documents)  
✅ 24 screenshots captured (6 per role)  
✅ Screenshots named and organized in `userflow_screen/` with subfolders  
✅ README.md in root explaining the structure  
✅ All screenshots at consistent resolution (1280×720)  
✅ Each role's flow is narrative and self-contained (can understand journey from screenshots alone)  

---

## 9. Scope Notes

**Out of scope:**
- Mobile/responsive screenshots (desktop only for MVP)
- Extensive error handling flows (focus on happy path)
- Performance benchmarking
- Accessibility audit (screenshots only)

**In scope:**
- Happy-path workflows for all 4 roles
- Sample data realistic and compliance-aligned
- Screenshots clear, readable, organized
- Narrative progression per role

---

## 10. Dependencies

- Local Supabase running (`npx supabase start`)
- Next.js dev server running
- Migrations applied (`supabase db push`)
- Chrome/Chromium browser
- Screenshot tool (browser DevTools or command-line)
