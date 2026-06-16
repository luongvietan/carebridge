# Professional User Flow - Screenshot Instructions

## Role Overview
**Account:** Jane Smith (Registered Nurse)  
**Email:** prof@example.com  
**Password:** password123  
**Account Type:** professional

## Login Instructions

1. Open http://localhost:3000 in your browser
2. You should see the CareBridge Connect login page
3. Enter email: `prof@example.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for redirect to professional dashboard (usually <1 second)
7. You should see "Jane Smith" or nurse profile information

---

## Screenshots to Capture (6 Total)

### Screenshot 1: Login Page
**File Name:** `01_login.png`

**URL:** http://localhost:3000/login (or just http://localhost:3000)

**What to Capture:**
- Login form with email and password fields
- Sign In button
- Any branding or header/footer
- Logo and page title

**Verification Checklist:**
- [ ] Email field is visible
- [ ] Password field is visible
- [ ] Sign In button is visible
- [ ] No error messages (we're capturing the clean login page)
- [ ] CareBridge branding is visible

**Navigation:**
- If already logged in, log out first via Settings menu
- Then navigate to /login or http://localhost:3000

---

### Screenshot 2: Professional Dashboard Overview
**File Name:** `02_dashboard_overview.png`

**URL:** http://localhost:3000/professional/dashboard

**What to Capture:**
- Main dashboard with key metrics or cards
- Navigation sidebar
- Welcome message or user name
- Quick action buttons/links
- Any calendar or upcoming bookings section
- Profile summary

**Verification Checklist:**
- [ ] User name "Jane Smith" visible or role "Nurse" visible
- [ ] Dashboard title or heading visible
- [ ] Sidebar navigation menu present
- [ ] Multiple dashboard cards/sections visible
- [ ] No error messages or warnings
- [ ] Page fully loaded (no spinners)

**Navigation:**
1. From login page (screenshot 1), click Sign In
2. System automatically redirects to /professional/dashboard
3. Wait for page to fully load

---

### Screenshot 3: Job Board / Job Search
**File Name:** `03_job_board.png`

**URL:** http://localhost:3000/professional/jobs (or similar jobs listing route)

**What to Capture:**
- List of available jobs/booking opportunities
- Search/filter controls
- Job cards showing details (title, location, pay rate, etc.)
- Pagination or load more button
- Sidebar still visible

**Verification Checklist:**
- [ ] List of jobs is visible
- [ ] Each job shows key information (title, details)
- [ ] Search or filter controls present
- [ ] Navigation sidebar still visible
- [ ] Page title indicates "Jobs" or similar
- [ ] No error messages

**Navigation:**
1. From dashboard, look for "Jobs" or "Job Board" in sidebar menu
2. Click that menu item
3. Wait for jobs list to load
4. You should see multiple job listings

**Alternative Routes to Try:**
- /professional/available-jobs
- /professional/jobs
- Look in sidebar for "Browse Jobs" or "Job Board"

---

### Screenshot 4: Job Details / Job Application View
**File Name:** `04_job_details.png`

**URL:** http://localhost:3000/professional/jobs/[id] (click a job from previous screenshot)

**What to Capture:**
- Full job details including:
  - Job title
  - Description
  - Requirements
  - Pay rate
  - Location/address
  - Duration or shift times
- Apply button or application form
- Back to list button
- Job metadata (posted date, number of applicants, etc.)

**Verification Checklist:**
- [ ] Job title prominently displayed
- [ ] Full job description visible
- [ ] Requirements/qualifications listed
- [ ] Pay rate shown
- [ ] Apply or similar action button visible
- [ ] Back button to return to job list
- [ ] No error messages

**Navigation:**
1. From job board (screenshot 3)
2. Click on any job listing to view details
3. Wait for job detail page to load
4. Verify all information is visible (scroll if needed)

---

### Screenshot 5: Professional Profile & Settings
**File Name:** `05_profile_settings.png`

**URL:** http://localhost:3000/professional/profile (or /professional/settings)

**What to Capture:**
- User profile information:
  - Name: Jane Smith
  - Role/Title: Registered Nurse
  - Qualifications
  - Bio/Summary
- Profile edit button or form fields
- Settings options
- Preferences/notifications settings
- Any profile picture

**Verification Checklist:**
- [ ] Profile name "Jane Smith" visible
- [ ] Professional role/title visible
- [ ] Qualifications or training listed
- [ ] Edit profile button or form present
- [ ] Settings options/form fields visible
- [ ] Profile section clearly labeled
- [ ] No error messages

**Navigation:**
1. From dashboard or any page
2. Look in sidebar for "Profile" or click user menu (usually top right)
3. Click "Profile" or "Settings"
4. If multiple options, select "Profile"
5. Wait for profile page to load

**Alternative Routes:**
- /professional/profile
- /professional/account
- Settings menu → Profile

---

### Screenshot 6: Compliance Documents
**File Name:** `06_documents.png`

**URL:** http://localhost:3000/professional/compliance (or /documents, /certifications)

**What to Capture:**
- Document list showing:
  - Enhanced DBS (status: Verified ✅)
  - Professional Registration/NMC (status: Verified ✅)
  - Mandatory Training Certificate (status: Pending Review ⏳)
- Each document showing:
  - Document type/name
  - Expiration date (if applicable)
  - Current status
  - Date uploaded
- Upload document button
- Document verification timeline

**Verification Checklist:**
- [ ] At least 3 compliance documents listed
- [ ] Document names/types visible
- [ ] Status indicators visible (Verified, Pending, etc.)
- [ ] Dates shown for each document
- [ ] Section clearly labeled "Documents", "Compliance", or similar
- [ ] Upload or action buttons visible
- [ ] No error messages

**Navigation:**
1. From sidebar menu, look for "Documents", "Compliance", or "Certifications"
2. Click that menu item
3. Wait for documents page to load
4. Should see list of uploaded documents with statuses

**Alternative Routes:**
- /professional/documents
- /professional/certifications
- /professional/compliance
- Look in sidebar for "My Documents" or similar

---

## Completion Checklist

- [ ] Screenshot 1: Login page (01_login.png)
- [ ] Screenshot 2: Dashboard (02_dashboard_overview.png)
- [ ] Screenshot 3: Job board (03_job_board.png)
- [ ] Screenshot 4: Job details (04_job_details.png)
- [ ] Screenshot 5: Profile settings (05_profile_settings.png)
- [ ] Screenshot 6: Documents (06_documents.png)

All files should be in: `01_professional/`

---

## Tips & Troubleshooting

### Page Won't Load
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check dev server is running (`npm run dev`)
3. Check URL is correct (copy from above)

### Login Fails
1. Verify email is exactly: `prof@example.com`
2. Verify password is exactly: `password123`
3. Try incognito/private browser window
4. Clear cookies in Settings → Clear Browsing Data

### Can't Find Menu Items
1. Check sidebar - may be collapsed on smaller screens
2. Scroll down in sidebar if list is long
3. Look for hamburger menu (☰) if on mobile view
4. Maximize browser window to full screen

### Screenshots Aren't Saving
1. Verify folder path: `C:\Users\admin\Desktop\CareBridge Connect\userflow_screens\01_professional\`
2. Use PNG format
3. Use exact filenames from above
4. Ensure folder is writable

### Something Looks Wrong
1. Check zoom level is 100% (Ctrl+0)
2. Check browser isn't in dark mode (may affect colors)
3. Try a different browser (Chrome, Firefox, etc.)
4. Clear cache: F12 → Application → Cache → Clear All

---

## Expected User Experience

### Dashboard (Screenshot 2)
- Should feel welcoming and professional
- Quick overview of current status
- Links to main features (jobs, bookings, documents)
- Professional branding

### Job Board (Screenshot 3)
- Clean list of available jobs
- Easy to scan and compare
- Search/filter to narrow down options
- Shows key details at a glance

### Job Details (Screenshot 4)
- Full information about the opportunity
- Clear CTA (Call to Action) to apply
- Easy to read formatting
- Mobile-friendly layout

### Profile (Screenshot 5)
- Clear display of professional qualifications
- Ability to update information
- Professional appearance

### Documents (Screenshot 6)
- Compliance status at a glance
- Clear visual indicators (✅ Verified, ⏳ Pending, etc.)
- Easy to understand what's needed

---

## Notes

- Session persists while logged in
- Don't need to log out between screenshots
- Navigate using sidebar menu items
- All pages should load quickly (<1 second)
- No special permissions needed

When finished with all 6 screenshots for Professional role, move on to the next role (02_private_client/).

---

**Role:** Professional (Nurse)  
**Estimated Time:** 5-10 minutes for all 6 screenshots  
**Status:** Ready to begin!
