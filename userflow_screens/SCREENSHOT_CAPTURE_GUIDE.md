# CareBridge Connect - User Flow Screenshot Capture Guide

## Overview
This guide provides detailed instructions for capturing 24 user flow screenshots (6 per role) documenting the CareBridge Connect MVP across all 4 account types.

## Environment Setup

### Dev Server Status
- **URL:** http://localhost:3000
- **Status:** Ready (Next.js with Turbopack)
- **Expected Response Time:** <1 second per page
- **Local Network:** http://192.168.0.4:3000

### Test Credentials
All test accounts use the password: **`password123`**

| Role | Email | Account Type |
|------|-------|--------------|
| Professional | prof@example.com | professional |
| Private Client | client@example.com | private_client |
| Organisation | org@example.com | organisation |
| Admin | admin@example.com | admin |

**Important:** Password is `password123` (NOT TestPass123!)

### Database Status
- All migrations applied (0000-0016 completed)
- Test users created and verified
- User profiles populated
- RLS policies active
- Compliance documents seeded (Professional role)

---

## Quick Start Checklist

Before you begin capturing screenshots:

- [ ] Dev server running (`npm run dev`)
- [ ] http://localhost:3000 is accessible in your browser
- [ ] Create empty folders if needed (01_professional/, 02_private_client/, etc.)
- [ ] Have a screenshot tool ready (Windows: Win+Shift+S, Mac: Cmd+Shift+4, or browser built-in)
- [ ] Use each role's INSTRUCTIONS.md for step-by-step guidance

---

## Folder Structure

```
userflow_screens/
├── SCREENSHOT_CAPTURE_GUIDE.md (this file)
├── SETUP_COMPLETE.md
├── 01_professional/
│   ├── INSTRUCTIONS.md
│   ├── 01_login.png
│   ├── 02_dashboard_overview.png
│   ├── 03_job_board.png
│   ├── 04_job_details.png
│   ├── 05_profile_settings.png
│   └── 06_documents.png
├── 02_private_client/
│   ├── INSTRUCTIONS.md
│   ├── 01_login.png
│   ├── 02_dashboard_overview.png
│   ├── 03_find_professionals.png
│   ├── 04_professional_profile.png
│   ├── 05_bookings_list.png
│   └── 06_settings.png
├── 03_organisation/
│   ├── INSTRUCTIONS.md
│   ├── 01_login.png
│   ├── 02_dashboard_overview.png
│   ├── 03_job_listing.png
│   ├── 04_candidate_pool.png
│   ├── 05_team_management.png
│   └── 06_reports.png
└── 04_admin/
    ├── INSTRUCTIONS.md
    ├── 01_login.png
    ├── 02_admin_dashboard.png
    ├── 03_user_management.png
    ├── 04_compliance_monitoring.png
    ├── 05_system_settings.png
    └── 06_analytics.png
```

---

## Screenshot Capture Process

### For Each Screenshot:

1. **Navigate to the specified URL/route**
2. **Wait for page to fully load** (watch for spinning loaders to stop)
3. **Verify all content is visible** (scroll if needed to see key elements)
4. **Capture the entire viewport** using:
   - **Windows:** Win + Shift + S (Snip & Sketch)
   - **Mac:** Cmd + Shift + 4 then Space
   - **Browser:** Right-click → Screenshot (some browsers)
5. **Save to the exact path** specified in INSTRUCTIONS.md
6. **Verify file saved** before moving to next screenshot

### Quality Checklist for Each Screenshot:

- [ ] Page fully loaded (no spinners/loaders)
- [ ] All text readable and visible
- [ ] No error messages or warnings
- [ ] Proper color scheme and branding applied
- [ ] Form fields visible (if applicable)
- [ ] Buttons and navigation clear
- [ ] File format: PNG with descriptive name

---

## General Navigation Tips

### Login Flow (all roles):
1. Start at http://localhost:3000
2. You should see the login page
3. Enter email and password
4. Click "Sign In" button
5. Wait for redirect to role dashboard

### After Login:
- Each role has a different home dashboard
- Use the sidebar/navigation to access other sections
- URLs are role-specific (e.g., `/professional/...`, `/organisation/...`)
- Session timeout: No timeout for dev environment

### Troubleshooting:
- **Page not loading:** Check that dev server is running (`npm run dev`)
- **Login fails:** Verify password is exactly `password123`
- **Redirects to login:** Session may have expired; just log in again
- **Profile setup page:** Some roles may require profile setup; capture this screen if it appears

---

## Role-Specific Instructions

See the detailed INSTRUCTIONS.md file in each role folder:

1. **01_professional/** → [Professional User Flow](./01_professional/INSTRUCTIONS.md)
2. **02_private_client/** → [Private Client Flow](./02_private_client/INSTRUCTIONS.md)
3. **03_organisation/** → [Organisation Flow](./03_organisation/INSTRUCTIONS.md)
4. **04_admin/** → [Admin Flow](./04_admin/INSTRUCTIONS.md)

Each includes:
- Step-by-step login instructions
- Exact URLs for each screenshot
- What content to look for
- How to verify you're on the right screen
- File naming conventions

---

## Expected User Interfaces

### Professional Dashboard
- Job listings and search
- Calendar for bookings
- Document/compliance section
- Profile and account settings
- Notification center

### Private Client Dashboard
- Browse professionals
- Manage bookings
- Payment methods
- Communications/messages
- Settings and profile

### Organisation Dashboard
- Post and manage jobs
- View candidate applications
- Team member management
- Billing and reports
- Settings

### Admin Dashboard
- User management
- Compliance monitoring
- System settings and configuration
- Analytics and reporting
- Support tools

---

## Browser Recommendations

- **Chrome/Chromium:** Best compatibility (used for dev)
- **Firefox:** Fully supported
- **Safari:** Supported (Mac users)
- **Edge:** Supported

Recommended: Use the same browser you tested with during dev.

---

## Important Notes

### Data Privacy
- These are test/demo accounts with sample data
- Screenshots may contain sample names, emails, etc.
- Safe for internal documentation use
- Do not share with external parties without review

### File Naming Convention
All screenshots follow the pattern:
```
01_name_of_screen.png
02_next_screen.png
03_and_so_on.png
```

This ensures proper alphabetical ordering in file explorers.

### Resolution & Quality
- Capture at your native resolution
- Minimum recommended: 1280x720
- Maximum recommended: 1920x1080
- Ensure text is readable (no tiny fonts)

### Login Session Management
- Don't log out between screenshots for the same role
- Session persists across page navigation
- If you need to switch roles, log out completely
- Clear cookies/session if login fails repeatedly

---

## Completion Checklist

- [ ] All 24 screenshots captured
- [ ] 6 for each role (01, 02, 03, 04)
- [ ] Filenames match INSTRUCTIONS.md exactly
- [ ] All PNG files are readable images
- [ ] No error messages visible in screenshots
- [ ] All key content visible (may need scrolling verification)

---

## Support & Troubleshooting

### If dev server stops responding:
```bash
# From project root
npm run dev
```

### If login fails for a user:
1. Verify email: prof@example.com (etc.)
2. Verify password: password123 (exact)
3. Check that user exists in database (see SETUP_COMPLETE.md)
4. Clear browser cache and try again

### If a page won't load:
1. Check browser console for errors (F12)
2. Verify URL is correct (copy from INSTRUCTIONS.md)
3. Wait 5 seconds for page to load
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### If screenshots don't save:
1. Check folder exists and is writable
2. Use full file path when saving
3. Don't use special characters in filenames
4. Ensure PNG format is selected

---

## Next Steps

1. Read the role-specific INSTRUCTIONS.md in each folder
2. Start with 01_professional (simplest flow to verify setup works)
3. Follow each step carefully and save to exact paths
4. Use the SETUP_COMPLETE.md file as reference for account details
5. Check off items as you complete them

---

## Questions or Issues?

If you encounter problems:
1. Check this guide's Troubleshooting section
2. Verify dev server is running and accessible
3. Confirm test account credentials in SETUP_COMPLETE.md
4. Check browser console (F12) for any JavaScript errors
5. Try a different browser if issues persist

Good luck with your screenshot capture! This documentation will serve as a valuable reference for the CareBridge Connect MVP user flows.
