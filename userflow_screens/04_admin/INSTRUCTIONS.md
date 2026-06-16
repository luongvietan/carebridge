# Admin User Flow - Screenshot Instructions

## Role Overview
**Account:** CareBridge Admin (System Administrator)  
**Email:** admin@example.com  
**Password:** password123  
**Account Type:** admin

## Login Instructions

1. Open http://localhost:3000 in your browser (in a new/private window if needed)
2. You should see the CareBridge Connect login page
3. Enter email: `admin@example.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for redirect to admin dashboard (usually <1 second)
7. You should see admin-specific dashboard with full system access

---

## Screenshots to Capture (6 Total)

### Screenshot 1: Login Page
**File Name:** `01_login.png`

**URL:** http://localhost:3000/login (or just http://localhost:3000)

**What to Capture:**
- Login form with email and password fields
- Sign In button
- CareBridge Connect branding
- Professional login page design

**Verification Checklist:**
- [ ] Email field visible and ready for input
- [ ] Password field visible
- [ ] Sign In button clearly visible
- [ ] Page title shows CareBridge Connect
- [ ] Form is clean and professional
- [ ] No error messages shown

**Navigation:**
- Open fresh browser or incognito window
- Navigate to http://localhost:3000
- Should automatically show login page

---

### Screenshot 2: Admin Dashboard Overview
**File Name:** `02_admin_dashboard.png`

**URL:** http://localhost:3000/admin/dashboard

**What to Capture:**
- Admin dashboard with system overview
- Navigation sidebar with admin-specific menu items
- Key system metrics/statistics:
  - Total users count
  - Active professionals count
  - Active clients count
  - Active organisations count
  - System health indicators
  - Recent activity feed
- Dashboard widgets/cards with critical information
- Quick action buttons (Add User, View Reports, etc.)
- System status indicators

**Verification Checklist:**
- [ ] Dashboard title indicates "Admin" context
- [ ] Sidebar shows admin-specific menu items
- [ ] Multiple dashboard cards/widgets visible
- [ ] System metrics and statistics displayed
- [ ] Page fully loaded with no spinners
- [ ] Admin-level features visible
- [ ] No error messages

**Navigation:**
1. From login page, enter credentials above
2. Click Sign In
3. System automatically redirects to /admin/dashboard
4. Wait for full dashboard to load with all widgets

---

### Screenshot 3: User Management
**File Name:** `03_user_management.png`

**URL:** http://localhost:3000/admin/users

**What to Capture:**
- List of all system users showing:
  - User name and email
  - Account type (Professional, Client, Organisation, Admin)
  - Account status (Active, Suspended, Pending, etc.)
  - Date created/joined
  - Last login date
  - Email verification status
- Action buttons for each user:
  - View Profile
  - Edit
  - Suspend/Activate
  - Delete
  - Reset Password
  - Send Message
- Filter options:
  - By account type
  - By status (Active, Inactive, etc.)
  - By role
- Search box for finding specific users
- Bulk action capabilities if available

**Verification Checklist:**
- [ ] User list visible with all test users shown
- [ ] User details (name, email, type, status) visible
- [ ] admin@example.com should be in list
- [ ] prof@example.com should be visible
- [ ] client@example.com should be visible
- [ ] org@example.com should be visible
- [ ] Filter/search controls present
- [ ] Action buttons visible for each user
- [ ] Page title indicates "Users" or "User Management"
- [ ] No error messages

**Navigation:**
1. From dashboard (screenshot 2)
2. Look in sidebar for "Users", "User Management", "Accounts", or similar
3. Click that menu item
4. Wait for users list to load
5. Should see comprehensive list of all system users

**Alternative Routes:**
- /admin/users
- /admin/accounts
- /admin/user-management

---

### Screenshot 4: Compliance Monitoring
**File Name:** `04_compliance_monitoring.png`

**URL:** http://localhost:3000/admin/compliance (or /documents, /verification)

**What to Capture:**
- Compliance documents overview showing:
  - All professional documents across system
  - Document type (DBS, Registration, Training, etc.)
  - Professional who submitted it
  - Status (Verified, Pending Review, Rejected, Expired)
  - Date submitted
  - Expiration date
  - Review actions available
- Filter options:
  - By document type
  - By status
  - By professional/organisation
  - By date range
- Action buttons:
  - Approve
  - Request More Info
  - Reject
  - Download/View
  - Mark for Review
- Alerts or flagged items if any

**Verification Checklist:**
- [ ] Compliance documents list visible
- [ ] Document types and statuses shown
- [ ] Professional names associated with documents
- [ ] Dates and expiration info visible
- [ ] Filter/sort options present
- [ ] Action buttons (Approve, Reject, etc.) visible
- [ ] Page title indicates "Compliance" or "Documents"
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Compliance", "Documents", "Verification", or "Quality Assurance"
3. Click that menu item
4. Wait for compliance page to load
5. Should see overview of all system compliance documents

**Alternative Routes:**
- /admin/compliance
- /admin/documents
- /admin/verification
- /admin/qa

---

### Screenshot 5: System Settings / Configuration
**File Name:** `05_system_settings.png`

**URL:** http://localhost:3000/admin/settings (or /configuration, /config)

**What to Capture:**
- System settings and configuration options:
  - Application settings (name, logo, theme)
  - Email configuration
  - Payment/billing settings
  - Notification templates
  - Rate cards and pricing configuration
  - Service categories
  - Geographical settings (regions, locations)
  - System parameters
  - Feature flags or toggles
  - Backup and maintenance settings
- Settings organized by sections/tabs
- Edit buttons for each section
- Save/Update buttons
- Any toggles for features

**Verification Checklist:**
- [ ] Settings page loads successfully
- [ ] Multiple setting sections/tabs visible
- [ ] Configuration options clearly labeled
- [ ] Edit buttons visible for editable settings
- [ ] Application name or logo visible
- [ ] Email/notification settings section present
- [ ] Pricing or rate card settings visible
- [ ] Page title indicates "Settings" or "Configuration"
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Settings", "Configuration", "Config", or "System Settings"
3. Click that menu item
4. Wait for settings page to load
5. Should see comprehensive system configuration options

**Alternative Routes:**
- /admin/settings
- /admin/configuration
- /admin/config
- /admin/system

---

### Screenshot 6: Analytics / Reports
**File Name:** `06_analytics.png`

**URL:** http://localhost:3000/admin/analytics (or /reports, /insights, /statistics)

**What to Capture:**
- System analytics and reporting dashboard showing:
  - User growth/trends (chart over time)
  - User distribution by type (pie/bar chart)
  - Booking/application statistics
  - Revenue/transaction data (if applicable)
  - Professional utilization rates
  - System performance metrics
  - Active sessions or user activity
  - Key performance indicators (KPIs)
  - Date range selector for filtering
  - Export functionality (CSV, PDF, etc.)
- Multiple charts and visualizations
- Data tables with detailed metrics

**Verification Checklist:**
- [ ] Analytics page loads successfully
- [ ] At least 2-3 charts or graphs visible
- [ ] Metrics and KPIs displayed
- [ ] Date range selector present
- [ ] Data is readable and well-formatted
- [ ] Legend and axis labels clear
- [ ] Export or download option visible
- [ ] Page title indicates "Analytics", "Reports", or "Insights"
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Analytics", "Reports", "Insights", "Statistics", or "Performance"
3. Click that menu item
4. Wait for analytics page to load
5. Should see comprehensive system analytics and metrics

**Alternative Routes:**
- /admin/analytics
- /admin/reports
- /admin/insights
- /admin/statistics
- /admin/performance

---

## Completion Checklist

- [ ] Screenshot 1: Login page (01_login.png)
- [ ] Screenshot 2: Admin dashboard (02_admin_dashboard.png)
- [ ] Screenshot 3: User management (03_user_management.png)
- [ ] Screenshot 4: Compliance monitoring (04_compliance_monitoring.png)
- [ ] Screenshot 5: System settings (05_system_settings.png)
- [ ] Screenshot 6: Analytics/reports (06_analytics.png)

All files should be in: `04_admin/`

---

## Tips & Troubleshooting

### Page Won't Load
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check dev server is running
3. Verify URL is exactly as specified

### Login Fails
1. Email must be exactly: `admin@example.com`
2. Password must be exactly: `password123`
3. Try incognito/private window
4. Clear all cookies if needed

### Admin Features Missing
- Some admin features may be under development
- Just capture what's visible
- Document what you find in the notes
- Empty sections are acceptable

### No Data in Reports/Analytics
- This is normal for a development environment
- Just capture the analytics page layout
- Data will be populated with real usage
- Empty charts are acceptable

### Navigation Issues
1. Check sidebar for correct menu labels
2. Use alternative routes listed above
3. Some features may be under different names
4. Try searching sidebar text

---

## Expected User Experience

### Dashboard (Screenshot 2)
- Complete system overview
- Critical metrics at a glance
- Quick access to admin functions
- Professional admin interface

### User Management (Screenshot 3)
- See all system users
- Filter and search capabilities
- Quick user actions
- Account status visibility

### Compliance (Screenshot 4)
- Monitor professional qualifications
- Track document expiration
- Ensure regulatory compliance
- Approve/review documents

### Settings (Screenshot 5)
- Configure system behavior
- Manage application settings
- Set up email and notifications
- Configure pricing and rules

### Analytics (Screenshot 6)
- Data-driven system insights
- User growth and trends
- Performance metrics
- Export data for reporting

---

## Admin-Specific Notes

- Admin accounts have full system access
- Can view and modify all user data
- Can configure system-wide settings
- Can view all compliance documents
- Can access analytics and reports
- Different UI from other roles

## Important Security Note

- These are test accounts with demo data
- Never use admin credentials in production
- Always protect admin access in live systems
- Audit all admin actions in production

---

## Notes

- Admin role has highest privilege level
- Different dashboard from all other roles
- Session persists across navigation
- All features should load quickly
- Data may be partial or empty in dev environment

---

**Role:** Admin (System Administrator)  
**Estimated Time:** 5-10 minutes for all 6 screenshots  
**Status:** Ready to begin!

---

## Final Checklist Before Submitting

Once all 24 screenshots are captured (6 per role):

1. Verify all files are PNG format
2. Check all filenames match exactly
3. Ensure all files are in correct folders
4. Confirm all screenshots are readable
5. Verify no error messages in any screenshots
6. Check that content is fully visible (may need scrolling validation)
7. All 4 roles completed

Thank you for documenting the CareBridge Connect MVP user flows!
