# Private Client User Flow - Screenshot Instructions

## Role Overview
**Account:** John Brown (Private Client)  
**Email:** client@example.com  
**Password:** password123  
**Account Type:** private_client

## Login Instructions

1. Open http://localhost:3000 in your browser (in a new/private window to avoid session confusion)
2. You should see the CareBridge Connect login page
3. Enter email: `client@example.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for redirect to private client dashboard (usually <1 second)
7. You should see client dashboard with different layout than professional view

---

## Screenshots to Capture (6 Total)

### Screenshot 1: Login Page
**File Name:** `01_login.png`

**URL:** http://localhost:3000/login (or just http://localhost:3000)

**What to Capture:**
- Login form with email and password fields
- Sign In button
- CareBridge branding and header/footer
- Any login-specific messaging for this role

**Verification Checklist:**
- [ ] Email field visible and ready for input
- [ ] Password field visible
- [ ] Sign In button visible
- [ ] Page title shows CareBridge Connect
- [ ] No error messages
- [ ] Form looks clean and accessible

**Navigation:**
- If session from previous role still active, open incognito/private window
- Navigate to http://localhost:3000
- Should land on login page automatically

---

### Screenshot 2: Private Client Dashboard Overview
**File Name:** `02_dashboard_overview.png`

**URL:** http://localhost:3000/private-client/dashboard

**What to Capture:**
- Main dashboard with client-specific content
- Navigation sidebar
- Welcome message with "John Brown" or similar
- Quick stats or cards (e.g., active bookings, saved professionals)
- Call-to-action buttons (Browse Professionals, Book Now, etc.)
- Any upcoming appointments/bookings section

**Verification Checklist:**
- [ ] Client name "John Brown" visible or "Client" label shown
- [ ] Dashboard title clearly states "Private Client" or similar
- [ ] Sidebar navigation with client-specific menu items
- [ ] Dashboard cards/widgets showing key information
- [ ] No error messages or loading spinners
- [ ] Page fully loaded

**Navigation:**
1. From login page (screenshot 1), enter credentials above
2. Click Sign In
3. System automatically redirects to /private-client/dashboard
4. Wait for dashboard to fully load

---

### Screenshot 3: Browse Professionals / Professional Search
**File Name:** `03_find_professionals.png`

**URL:** http://localhost:3000/private-client/professionals (or /browse, /find-professionals)

**What to Capture:**
- List of available professionals
- Professional cards showing:
  - Name and photo (if available)
  - Title/qualifications (e.g., Registered Nurse)
  - Hourly rate or pricing
  - Rating/reviews (if available)
  - Quick action buttons (View Profile, Book Now, etc.)
- Search/filter options (by specialty, location, availability, rate)
- Pagination or "Load More" button

**Verification Checklist:**
- [ ] At least 3-5 professionals displayed
- [ ] Professional names and qualifications visible
- [ ] Pricing information shown
- [ ] Search or filter controls present
- [ ] View Profile button or similar action visible
- [ ] Page title indicates professionals/search
- [ ] No error messages

**Navigation:**
1. From dashboard (screenshot 2)
2. Look in sidebar for "Browse Professionals", "Find Care", "Search Professionals", or similar
3. Click that menu item
4. Wait for professionals list to load
5. You should see cards or list of available professionals

**Alternative Routes:**
- /private-client/professionals
- /private-client/browse
- /private-client/find
- Check sidebar for similar menu labels

---

### Screenshot 4: Professional Profile View
**File Name:** `04_professional_profile.png`

**URL:** http://localhost:3000/private-client/professionals/[id] (click a professional from previous screenshot)

**What to Capture:**
- Professional's detailed profile including:
  - Name and photo
  - Title/qualifications (e.g., Registered Nurse)
  - Bio/about section
  - Experience and skills
  - Qualifications and certifications
  - Hourly rate or pricing
  - Availability/schedule
  - Reviews/ratings (if available)
  - Book Now button or schedule appointment button

**Verification Checklist:**
- [ ] Professional name prominently displayed
- [ ] Qualifications and experience detailed
- [ ] Hourly rate or service pricing shown
- [ ] About/bio section visible
- [ ] Book/Schedule action button visible
- [ ] Back button to return to professionals list
- [ ] Contact information displayed (if allowed)
- [ ] No error messages

**Navigation:**
1. From professionals list (screenshot 3)
2. Click on any professional card or name
3. Wait for profile detail page to load
4. Verify all information is visible (scroll if needed to see full profile)

---

### Screenshot 5: Bookings / Appointments List
**File Name:** `05_bookings_list.png`

**URL:** http://localhost:3000/private-client/bookings (or /appointments, /schedule)

**What to Capture:**
- List of client's bookings/appointments showing:
  - Professional name
  - Service/appointment type
  - Date and time
  - Duration
  - Location or "In-Home" indicator
  - Booking status (Confirmed, Pending, Completed, Cancelled)
- Filter or status tabs (Upcoming, Past, All)
- Action buttons (Reschedule, Cancel, View Details, Review, etc.)
- Empty state message if no bookings (acceptable)

**Verification Checklist:**
- [ ] Page title indicates "Bookings", "Appointments", or similar
- [ ] Bookings list or table visible (or empty state message)
- [ ] If bookings exist: names, dates, times visible
- [ ] Status indicators clear (color-coded if applicable)
- [ ] Filter or sort options present
- [ ] Action buttons available
- [ ] No error messages

**Navigation:**
1. From dashboard or sidebar
2. Look for "Bookings", "Appointments", "My Schedule", or similar
3. Click that menu item
4. Wait for bookings page to load
5. May be empty initially if no bookings exist

**Alternative Routes:**
- /private-client/bookings
- /private-client/appointments
- /private-client/schedule

---

### Screenshot 6: Settings / Account Preferences
**File Name:** `06_settings.png`

**URL:** http://localhost:3000/private-client/settings (or /account, /profile)

**What to Capture:**
- Account and preference settings including:
  - Personal information (name, email, phone)
  - Address/location information
  - Notification preferences
  - Payment methods or billing information
  - Privacy settings
  - Emergency contact information
- Edit buttons for each section
- Save changes button
- Log out option

**Verification Checklist:**
- [ ] Personal information section visible
- [ ] Name "John Brown" shown
- [ ] Email client@example.com shown
- [ ] Notification/preference settings visible
- [ ] Edit buttons for each section
- [ ] Page title indicates "Settings" or "Account"
- [ ] No error messages

**Navigation:**
1. From any page in the app
2. Look in top-right corner for user menu (usually shows name or avatar)
3. Click user menu and select "Settings" or "Account"
4. Alternatively, look in sidebar for "Settings" or gear icon
5. Wait for settings page to load

**Alternative Routes:**
- /private-client/settings
- /private-client/account
- /private-client/profile
- Click profile icon in top navigation

---

## Completion Checklist

- [ ] Screenshot 1: Login page (01_login.png)
- [ ] Screenshot 2: Dashboard (02_dashboard_overview.png)
- [ ] Screenshot 3: Browse professionals (03_find_professionals.png)
- [ ] Screenshot 4: Professional profile (04_professional_profile.png)
- [ ] Screenshot 5: Bookings list (05_bookings_list.png)
- [ ] Screenshot 6: Settings (06_settings.png)

All files should be in: `02_private_client/`

---

## Tips & Troubleshooting

### Page Won't Load
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check dev server is running
3. Verify URL is correct

### Login Fails
1. Verify email: `client@example.com` (exact)
2. Verify password: `password123` (exact)
3. Try incognito window if session cache is issue
4. Clear cookies

### Can't Find Menu Items
1. Check if sidebar is collapsed (click hamburger menu ☰)
2. Scroll down sidebar if menu is long
3. Look for icons matching the feature (briefcase for jobs, people for professionals, etc.)
4. Maximize window if in small viewport

### Bookings Empty
- This is normal if no bookings were created
- Just capture the empty state screen
- Include any empty state message if present

### Routing Issues
- If URL doesn't work, use sidebar menu instead
- Sidebar navigation is the authoritative way to reach features
- URLs may differ from the documentation

---

## Expected User Experience

### Dashboard (Screenshot 2)
- Welcoming and client-focused
- Shows current bookings or calls to action
- Easy access to core features
- Professional appearance

### Browse Professionals (Screenshot 3)
- Easy to scan and find care providers
- Clear pricing and qualifications
- Search/filter to narrow options
- Quick action buttons

### Professional Profile (Screenshot 4)
- Detailed information about the provider
- Clear availability information
- Easy booking process
- Reviews/ratings to aid decision

### Bookings (Screenshot 5)
- Clear view of schedule
- Easy to manage appointments
- Status clearly indicated
- Quick actions (reschedule, cancel, etc.)

### Settings (Screenshot 6)
- Account details organized and clear
- Easy to update information
- Privacy and notification controls
- Secure appearance

---

## Notes

- Private client role focuses on finding and booking professionals
- Session persists - no need to log out between screenshots
- All features should load quickly
- Different layout/menu from Professional role
- Data may be partially populated (bookings, reviews, etc.)

When finished with all 6 screenshots for Private Client role, move on to the next role (03_organisation/).

---

**Role:** Private Client (John Brown)  
**Estimated Time:** 5-10 minutes for all 6 screenshots  
**Status:** Ready to begin!
