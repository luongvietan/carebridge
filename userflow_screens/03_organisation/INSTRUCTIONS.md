# Organisation User Flow - Screenshot Instructions

## Role Overview
**Account:** Sunnyhill Care Ltd (Organisation)  
**Email:** org@example.com  
**Password:** password123  
**Account Type:** organisation

## Login Instructions

1. Open http://localhost:3000 in your browser (in a new/private window if needed)
2. You should see the CareBridge Connect login page
3. Enter email: `org@example.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for redirect to organisation dashboard (usually <1 second)
7. You should see organisation-specific dashboard

---

## Screenshots to Capture (6 Total)

### Screenshot 1: Login Page
**File Name:** `01_login.png`

**URL:** http://localhost:3000/login (or just http://localhost:3000)

**What to Capture:**
- Login form with email and password fields
- Sign In button
- CareBridge branding and header
- Any organization-specific messaging

**Verification Checklist:**
- [ ] Email field visible and empty
- [ ] Password field visible
- [ ] Sign In button clearly visible
- [ ] Page title shows CareBridge Connect
- [ ] Form looks clean and professional
- [ ] No error messages

**Navigation:**
- If needed, open incognito/private browser window
- Navigate to http://localhost:3000
- Should see login page

---

### Screenshot 2: Organisation Dashboard Overview
**File Name:** `02_dashboard_overview.png`

**URL:** http://localhost:3000/organisation/dashboard

**What to Capture:**
- Main dashboard with organisation-specific content
- Navigation sidebar with organisation menu items
- Welcome message or greeting
- Organisation name "Sunnyhill Care Ltd" or similar
- Dashboard widgets/cards showing:
  - Active job postings count
  - Total candidates/applications
  - Team members count
  - Revenue or budgets
  - Recent applications
- Quick action buttons (Post Job, View Candidates, etc.)

**Verification Checklist:**
- [ ] Organisation name visible
- [ ] Dashboard title clearly states "Organisation" context
- [ ] Sidebar shows organisation-specific menu items
- [ ] Multiple dashboard cards/widgets visible
- [ ] Key metrics or statistics shown
- [ ] Page fully loaded
- [ ] No error messages

**Navigation:**
1. From login page, enter credentials above
2. Click Sign In
3. System automatically redirects to /organisation/dashboard
4. Wait for full dashboard load

---

### Screenshot 3: Job Listing / Job Management
**File Name:** `03_job_listing.png`

**URL:** http://localhost:3000/organisation/jobs (or /postings, /listings)

**What to Capture:**
- List of organisation's posted jobs showing:
  - Job title
  - Status (Active, Draft, Closed, etc.)
  - Number of applicants
  - Date posted
  - Job type (permanent, temporary, etc.)
- Action buttons for each job (View, Edit, View Applicants, Close, etc.)
- "Post New Job" button
- Filter or sort options (by status, date, etc.)
- Pagination if many jobs

**Verification Checklist:**
- [ ] List of jobs visible (or empty state if no jobs)
- [ ] Job titles and details visible
- [ ] Applicant counts shown
- [ ] Status indicators visible (color-coded if applicable)
- [ ] "Post New Job" button visible
- [ ] Filter/sort controls present
- [ ] Page title indicates "Jobs" or "Job Listings"
- [ ] No error messages

**Navigation:**
1. From dashboard (screenshot 2)
2. Look in sidebar for "Jobs", "Job Listings", "Job Postings", or similar
3. Click that menu item
4. Wait for jobs list to load
5. You should see list of organisation's job postings

**Alternative Routes:**
- /organisation/jobs
- /organisation/postings
- /organisation/job-listings

---

### Screenshot 4: Candidate Pool / Applications
**File Name:** `04_candidate_pool.png`

**URL:** http://localhost:3000/organisation/candidates (or /applicants, /applications)

**What to Capture:**
- List of candidates/applicants showing:
  - Candidate name and photo (if available)
  - Professional title/specialization
  - Rating or qualifications summary
  - Date applied
  - Status (Applied, Shortlisted, Rejected, Hired, etc.)
- Filters (by status, job, specialization, etc.)
- Sort options (newest first, highest rated, etc.)
- Action buttons:
  - View Profile
  - Schedule Interview
  - Shortlist
  - Reject
  - Hire/Accept
- Bulk actions if available

**Verification Checklist:**
- [ ] Candidate list visible (or empty state)
- [ ] Candidate names/profiles shown
- [ ] Application status clearly indicated
- [ ] Filter/sort options present
- [ ] Action buttons visible
- [ ] Page title indicates "Candidates", "Applicants", or similar
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Candidates", "Applicants", "Applications", or "Talent Pool"
3. Click that menu item
4. Wait for candidates list to load
5. Should see list of people who applied to your jobs

**Alternative Routes:**
- /organisation/candidates
- /organisation/applicants
- /organisation/applications
- /organisation/talent-pool

---

### Screenshot 5: Team Management
**File Name:** `05_team_management.png`

**URL:** http://localhost:3000/organisation/team (or /members, /staff)

**What to Capture:**
- List of organisation team members showing:
  - Team member name
  - Role within organisation (Admin, Manager, Recruiter, etc.)
  - Email address
  - Status (Active, Inactive, etc.)
  - Date joined
- Action buttons (Edit, Remove, Change Role, etc.)
- "Invite Team Member" button
- Filter or sort options
- Role/permission levels visible

**Verification Checklist:**
- [ ] Team members list visible
- [ ] Member names, emails, and roles shown
- [ ] Status indicators visible
- [ ] "Invite Team Member" button present
- [ ] Action buttons (Edit, Remove, etc.) visible
- [ ] Page title indicates "Team", "Members", or similar
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Team", "Team Members", "Staff", or "Users"
3. Click that menu item
4. Wait for team list to load
5. Should see list of organisation team members

**Alternative Routes:**
- /organisation/team
- /organisation/members
- /organisation/staff
- /organisation/team-members

---

### Screenshot 6: Reports / Analytics
**File Name:** `06_reports.png`

**URL:** http://localhost:3000/organisation/reports (or /analytics, /insights)

**What to Capture:**
- Reports or analytics dashboard showing:
  - Job posting statistics
  - Application metrics (total applications, conversion rates)
  - Hiring funnel (applied → shortlisted → hired)
  - Team activity
  - Charts or graphs (bar, line, pie charts)
  - Date range selector
  - Export or download options
  - Key metrics and KPIs

**Verification Checklist:**
- [ ] Analytics/reports page loads
- [ ] At least one chart or metric visible
- [ ] Date range selector present
- [ ] Key statistics displayed
- [ ] Professional appearance with clear data visualization
- [ ] Page title indicates "Reports", "Analytics", or similar
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Reports", "Analytics", "Insights", or "Performance"
3. Click that menu item
4. Wait for reports page to load
5. Should see analytics and metrics about your organisation

**Alternative Routes:**
- /organisation/reports
- /organisation/analytics
- /organisation/insights
- /organisation/performance

---

## Completion Checklist

- [ ] Screenshot 1: Login page (01_login.png)
- [ ] Screenshot 2: Dashboard (02_dashboard_overview.png)
- [ ] Screenshot 3: Job listings (03_job_listing.png)
- [ ] Screenshot 4: Candidate pool (04_candidate_pool.png)
- [ ] Screenshot 5: Team management (05_team_management.png)
- [ ] Screenshot 6: Reports (06_reports.png)

All files should be in: `03_organisation/`

---

## Tips & Troubleshooting

### Page Won't Load
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check dev server is running (`npm run dev`)
3. Verify URL spelling matches documentation

### Login Fails
1. Email must be exactly: `org@example.com`
2. Password must be exactly: `password123`
3. Try incognito window for clean session
4. Clear browsing data if needed

### Empty Lists
- This is normal if no jobs/candidates were created
- Just capture the empty state screen
- Include any empty state message if present
- Don't need to worry about missing data

### Menu Items Not Found
1. Check if sidebar is visible (click hamburger ☰ if collapsed)
2. Scroll within sidebar if it has many items
3. Some items may be under a submenu or dropdown
4. Try maximizing the browser window

### Can't Find Specific Feature
- Use the alternative routes listed above
- Try searching sidebar for keywords
- Check if feature might be under different name
- Report the location in screenshots for documentation

---

## Expected User Experience

### Dashboard (Screenshot 2)
- Organisation overview at a glance
- Key metrics prominently displayed
- Quick links to main features
- Professional and organized layout

### Job Listings (Screenshot 3)
- Easy to see all active job postings
- Status and applicant counts clear
- Quick actions for managing jobs
- Ability to post new jobs easily

### Candidate Pool (Screenshot 4)
- View all applicants in one place
- Filter and sort capabilities
- Quick assessment of candidates
- Actions to progress hiring

### Team Management (Screenshot 5)
- See all team members
- Clear roles and permissions
- Easy to add new team members
- Manage team access and responsibilities

### Reports (Screenshot 6)
- Data-driven insights about hiring
- Visual representation of metrics
- Understand recruitment performance
- Export or analyze data

---

## Notes

- Organisation role focuses on recruiting and managing jobs
- Different dashboard layout from Professional and Client roles
- Session persists - no need to log out between screenshots
- Data may be partially populated or empty (all sample data)
- All features should load quickly

When finished with all 6 screenshots for Organisation role, move on to the final role (04_admin/).

---

**Role:** Organisation (Sunnyhill Care Ltd)  
**Estimated Time:** 5-10 minutes for all 6 screenshots  
**Status:** Ready to begin!
