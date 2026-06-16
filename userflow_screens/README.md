# CareBridge Connect - User Flow Screenshots

## Project Overview

This directory contains comprehensive user flow documentation for the CareBridge Connect MVP across all 4 user roles. The documentation guides you through capturing 24 key screenshots (6 per role) that demonstrate the complete user journey for each account type.

## Status: Ready for Capture

- ✅ Dev server ready at http://localhost:3000
- ✅ Database seeded with 4 test accounts
- ✅ All migrations applied
- ✅ Test users verified and configured
- ✅ Documentation complete

## Quick Start

1. **Start with:** `SCREENSHOT_CAPTURE_GUIDE.md` (overview and checklist)
2. **Then read:** `SETUP_COMPLETE.md` (verify environment and credentials)
3. **Follow:** Role-specific `INSTRUCTIONS.md` in each folder (01, 02, 03, 04)
4. **Capture:** 6 screenshots per role using the detailed step-by-step guides

## Directory Structure

```
userflow_screens/
├── README.md (this file)
├── SCREENSHOT_CAPTURE_GUIDE.md (complete overview and guidance)
├── SETUP_COMPLETE.md (environment verification and credentials)
├── 01_professional/
│   ├── INSTRUCTIONS.md (step-by-step for Professional role)
│   ├── 01_login.png (to be captured)
│   ├── 02_dashboard_overview.png
│   ├── 03_job_board.png
│   ├── 04_job_details.png
│   ├── 05_profile_settings.png
│   └── 06_documents.png
├── 02_private_client/
│   ├── INSTRUCTIONS.md (step-by-step for Private Client role)
│   ├── 01_login.png (to be captured)
│   ├── 02_dashboard_overview.png
│   ├── 03_find_professionals.png
│   ├── 04_professional_profile.png
│   ├── 05_bookings_list.png
│   └── 06_settings.png
├── 03_organisation/
│   ├── INSTRUCTIONS.md (step-by-step for Organisation role)
│   ├── 01_login.png (to be captured)
│   ├── 02_dashboard_overview.png
│   ├── 03_job_listing.png
│   ├── 04_candidate_pool.png
│   ├── 05_team_management.png
│   └── 06_reports.png
└── 04_admin/
    ├── INSTRUCTIONS.md (step-by-step for Admin role)
    ├── 01_login.png (to be captured)
    ├── 02_admin_dashboard.png
    ├── 03_user_management.png
    ├── 04_compliance_monitoring.png
    ├── 05_system_settings.png
    └── 06_analytics.png
```

## Test Credentials

All test accounts use password: **`password123`**

| # | Role | Email | Dashboard Route |
|---|------|-------|-----------------|
| 1 | Professional | prof@example.com | /professional/dashboard |
| 2 | Private Client | client@example.com | /private-client/dashboard |
| 3 | Organisation | org@example.com | /organisation/dashboard |
| 4 | Admin | admin@example.com | /admin/dashboard |

## Key Files

### Main Documentation
- **SCREENSHOT_CAPTURE_GUIDE.md** - Complete guide with browser tips, troubleshooting, and best practices
- **SETUP_COMPLETE.md** - Environment verification, database status, and account details

### Role Instructions
- **01_professional/INSTRUCTIONS.md** - Professional (Jane Smith, Registered Nurse)
- **02_private_client/INSTRUCTIONS.md** - Private Client (John Brown)
- **03_organisation/INSTRUCTIONS.md** - Organisation (Sunnyhill Care Ltd)
- **04_admin/INSTRUCTIONS.md** - Admin (System Administrator)

Each INSTRUCTIONS.md includes:
- Login credentials
- Step-by-step navigation for each screenshot
- Exact URLs to visit
- What content to look for
- Verification checklists
- Troubleshooting tips

## Dev Environment

### Server Information
- **URL:** http://localhost:3000
- **Network:** http://192.168.0.4:3000
- **Framework:** Next.js 16.2.9 (Turbopack)
- **Status:** Running (ready in 368ms)
- **Environment:** .env.local loaded

### Database
- **Type:** PostgreSQL via Supabase
- **Status:** All migrations applied (0000-0016)
- **Test Data:** Fully seeded
- **RLS:** Active and verified

## How to Use This Documentation

### Step 1: Read the Overview
Start with `SCREENSHOT_CAPTURE_GUIDE.md` to understand:
- How to capture screenshots
- Browser recommendations
- Troubleshooting tips
- Data privacy notes

### Step 2: Verify Setup
Read `SETUP_COMPLETE.md` to confirm:
- Dev server is running
- Database is seeded
- Test accounts are configured
- All credentials are correct

### Step 3: Capture Screenshots - One Role at a Time

For each role (start with Professional):

1. Open the role's `INSTRUCTIONS.md` file
2. Follow the login instructions
3. Capture each of the 6 screenshots in order
4. Verify each file is saved to the correct folder
5. Proceed to next role

### Step 4: Organize and Review

Once all 24 screenshots are captured:
- Verify all files are PNG format
- Check all filenames match exactly
- Ensure no error messages are visible
- Confirm all content is fully loaded
- Create summary documentation if needed

## Screenshot Workflow

### For Each Screenshot:
1. Navigate to the specified URL (from INSTRUCTIONS.md)
2. Wait for page to fully load (no spinners/loaders)
3. Scroll if needed to verify all content is visible
4. Capture entire viewport using:
   - **Windows:** Win + Shift + S
   - **Mac:** Cmd + Shift + 4, then Space
   - **Browser:** Right-click → Screenshot
5. Save to exact path specified in INSTRUCTIONS.md
6. Verify file saved before moving to next screenshot

## Expected Deliverables

### By Role
- **Professional:** 6 screenshots documenting nurse workflow
- **Private Client:** 6 screenshots documenting client experience
- **Organisation:** 6 screenshots documenting org admin workflow
- **Admin:** 6 screenshots documenting system administration

### Total: 24 Screenshots
- All PNG format
- All properly named and organized
- All folders complete
- All content clearly visible
- No error messages

## Estimated Time

- Professional role: 5-10 minutes
- Private Client role: 5-10 minutes
- Organisation role: 5-10 minutes
- Admin role: 5-10 minutes

**Total estimated time:** 30-45 minutes for all 24 screenshots

## Troubleshooting

### Common Issues

**Login fails:**
- Check email is exactly: prof@example.com (or the specific role email)
- Check password is exactly: password123
- Try incognito/private window

**Page won't load:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Verify dev server is running: `npm run dev`
- Check URL spelling

**Screenshots won't save:**
- Verify folder exists: userflow_screens/[role]/
- Use PNG format
- Check full file path doesn't exceed 260 characters
- Ensure folder is writable

**Content not visible:**
- Wait for spinners/loaders to stop
- Scroll to verify all content is visible
- Check zoom is 100% (Ctrl+0)
- Try different browser if needed

For more troubleshooting, see SCREENSHOT_CAPTURE_GUIDE.md

## Important Notes

### Security
- These are test accounts with demo data
- Safe for internal documentation
- Don't share publicly without review
- All data resets when database is refreshed

### Session Management
- Don't need to log out between screenshots for same role
- Log out completely to switch roles
- Session persists in browser
- Clear cookies if login fails repeatedly

### Data Privacy
- Sample names and emails in screenshots
- No real user data
- Safe for development documentation
- Suitable for team review

## Support

If you encounter issues:

1. Check the troubleshooting sections in:
   - SCREENSHOT_CAPTURE_GUIDE.md
   - SETUP_COMPLETE.md
   - Role-specific INSTRUCTIONS.md

2. Verify:
   - Dev server is running and responsive
   - Database has valid test data
   - Browser has JavaScript enabled
   - Firewall/VPN not blocking localhost

3. Try:
   - Different browser (Chrome, Firefox, Safari, Edge)
   - Incognito/private window
   - Hard refresh (Ctrl+Shift+R)
   - Clear all cookies and cache

## Next Steps

1. **Ready to start?** Open SCREENSHOT_CAPTURE_GUIDE.md
2. **Want to verify setup?** Open SETUP_COMPLETE.md
3. **Ready to capture?** Start with 01_professional/INSTRUCTIONS.md
4. **Need help?** Check troubleshooting in SCREENSHOT_CAPTURE_GUIDE.md

---

## Summary

This comprehensive documentation provides everything needed to capture user flow screenshots for the CareBridge Connect MVP. The dev environment is ready, test accounts are configured, and detailed step-by-step instructions are provided for each role.

**Status:** ✅ Ready for screenshot capture

**Dev Server:** ✅ Running at http://localhost:3000

**Test Accounts:** ✅ Verified and configured

**Documentation:** ✅ Complete and detailed

Begin with the SCREENSHOT_CAPTURE_GUIDE.md to get started!

---

**Created:** 2026-06-16  
**Project:** CareBridge Connect MVP  
**Documentation Type:** User Flow Screenshots  
**Total Screenshots to Capture:** 24 (6 per role × 4 roles)
