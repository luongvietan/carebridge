# CareBridge Connect - User Flow Documentation Index

## Quick Navigation

This index provides an overview of all documentation and guides in the userflow_screens directory.

---

## START HERE

**→ [START_HERE.md](START_HERE.md)** - Quick orientation guide  
Read this first (5 minutes). It explains the entire process and reading order.

---

## Main Documentation Files

### 1. [README.md](README.md) - Complete Project Overview
**Time:** 5-10 minutes to read

Covers:
- Project overview and status
- Test credentials table
- Complete folder structure
- Dev environment details
- How to use all documentation
- Troubleshooting guide
- Expected deliverables
- Important security and privacy notes

**Best for:** Understanding the full scope and getting a complete reference

---

### 2. [SCREENSHOT_CAPTURE_GUIDE.md](SCREENSHOT_CAPTURE_GUIDE.md) - How to Capture Screenshots
**Time:** 5 minutes to read

Covers:
- OS-specific screenshot methods (Windows, Mac, Linux)
- Browser recommendations
- Screenshot quality tips
- Troubleshooting common capture issues
- Data privacy notes

**Best for:** Learning how to take and save screenshots before starting

---

### 3. [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - Environment Verification
**Time:** 3 minutes to read

Confirms:
- Dev server status and URL
- Database status and migrations
- Test account credentials
- System verification checklist

**Best for:** Verifying everything is ready before capturing

---

### 4. [CAPTURE_CHECKLIST.md](CAPTURE_CHECKLIST.md) - Progress Tracking
**Time:** Use while capturing

Contains:
- Checklist for all 24 screenshots (6 per role)
- Space to record notes
- Issue tracking
- Verification marks

**Best for:** Tracking progress while capturing screenshots

---

## Role-Specific Instructions

Each role has a dedicated INSTRUCTIONS.md file with step-by-step guides.

### Professional Role - Jane Smith (Nurse)
**File:** [01_professional/INSTRUCTIONS.md](01_professional/INSTRUCTIONS.md)

**Screenshots to capture (6 total):**
1. Login page
2. Dashboard overview
3. Job board
4. Job details
5. Profile settings
6. Compliance documents

**Email:** prof@example.com  
**Password:** password123  
**Dashboard URL:** http://localhost:3000/professional/dashboard

---

### Private Client Role - John Brown
**File:** [02_private_client/INSTRUCTIONS.md](02_private_client/INSTRUCTIONS.md)

**Screenshots to capture (6 total):**
1. Login page
2. Dashboard overview
3. Find professionals
4. Professional profile
5. Bookings list
6. Settings

**Email:** client@example.com  
**Password:** password123  
**Dashboard URL:** http://localhost:3000/private-client/dashboard

---

### Organisation Role - Sunnyhill Care Ltd
**File:** [03_organisation/INSTRUCTIONS.md](03_organisation/INSTRUCTIONS.md)

**Screenshots to capture (6 total):**
1. Login page
2. Dashboard overview
3. Job listing
4. Candidate pool
5. Team management
6. Reports

**Email:** org@example.com  
**Password:** password123  
**Dashboard URL:** http://localhost:3000/organisation/dashboard

---

### Admin Role - System Administrator
**File:** [04_admin/INSTRUCTIONS.md](04_admin/INSTRUCTIONS.md)

**Screenshots to capture (6 total):**
1. Login page
2. Admin dashboard
3. User management
4. Compliance monitoring
5. System settings
6. Analytics

**Email:** admin@example.com  
**Password:** password123  
**Dashboard URL:** http://localhost:3000/admin/dashboard

---

## Quick Reference - Test Credentials

All accounts use password: **password123**

| # | Role | Email | Dashboard |
|---|------|-------|-----------|
| 1 | Professional | prof@example.com | /professional/dashboard |
| 2 | Private Client | client@example.com | /private-client/dashboard |
| 3 | Organisation | org@example.com | /organisation/dashboard |
| 4 | Admin | admin@example.com | /admin/dashboard |

---

## Recommended Reading Order

1. **START_HERE.md** (this is your orientation)
2. **README.md** (complete overview)
3. **SCREENSHOT_CAPTURE_GUIDE.md** (learn how to capture)
4. **SETUP_COMPLETE.md** (verify everything is ready)
5. **01_professional/INSTRUCTIONS.md** (start capturing)
6. **02_private_client/INSTRUCTIONS.md** (continue)
7. **03_organisation/INSTRUCTIONS.md** (continue)
8. **04_admin/INSTRUCTIONS.md** (finish)
9. **CAPTURE_CHECKLIST.md** (use while capturing to track progress)

---

## Folder Structure

```
userflow_screens/
├── INDEX.md (this file)
├── START_HERE.md
├── README.md
├── SCREENSHOT_CAPTURE_GUIDE.md
├── SETUP_COMPLETE.md
├── CAPTURE_CHECKLIST.md
├── DOCUMENTATION_SUMMARY.md
├── COMPLETION_REPORT.txt
│
├── 01_professional/
│   ├── INSTRUCTIONS.md
│   └── (screenshots will be saved here)
├── 02_private_client/
│   ├── INSTRUCTIONS.md
│   └── (screenshots will be saved here)
├── 03_organisation/
│   ├── INSTRUCTIONS.md
│   └── (screenshots will be saved here)
└── 04_admin/
    ├── INSTRUCTIONS.md
    └── (screenshots will be saved here)
```

---

## Documentation Overview Table

| File | Purpose | Read When | Time |
|------|---------|-----------|------|
| START_HERE.md | Quick orientation | First | 5 min |
| INDEX.md | Navigation guide (this file) | For reference | 3 min |
| README.md | Complete overview & reference | Second | 5-10 min |
| SCREENSHOT_CAPTURE_GUIDE.md | How to capture screenshots | Before capturing | 5 min |
| SETUP_COMPLETE.md | Verify environment is ready | Before capturing | 3 min |
| CAPTURE_CHECKLIST.md | Track progress | While capturing | ongoing |
| 01_professional/INSTRUCTIONS.md | Professional role guide | When capturing role 1 | 2-3 min |
| 02_private_client/INSTRUCTIONS.md | Private client role guide | When capturing role 2 | 2-3 min |
| 03_organisation/INSTRUCTIONS.md | Organisation role guide | When capturing role 3 | 2-3 min |
| 04_admin/INSTRUCTIONS.md | Admin role guide | When capturing role 4 | 2-3 min |

---

## Environment Status

- **Dev Server:** Running at http://localhost:3000
- **Database:** PostgreSQL via Supabase (all migrations applied)
- **Test Data:** Fully seeded with 4 test accounts
- **Status:** Ready for screenshot capture

---

## Total Deliverables

- **Total Screenshots:** 24 (6 per role × 4 roles)
- **PNG Format:** All screenshots should be saved as PNG files
- **File Naming:** Follow the exact naming convention in each INSTRUCTIONS.md
- **Organization:** Files are organized by role (01_professional, 02_private_client, etc.)

---

## Estimated Timeline

- **Preparation (reading docs):** 15-20 minutes
- **Screenshot capture:** 30-45 minutes (5-10 minutes per role)
- **Total estimated time:** 45-65 minutes

---

## Next Steps

1. Start with **START_HERE.md**
2. Read **README.md** for complete overview
3. Read **SCREENSHOT_CAPTURE_GUIDE.md** for technical instructions
4. Read **SETUP_COMPLETE.md** to verify setup
5. Open the first role's INSTRUCTIONS.md (01_professional)
6. Begin capturing screenshots!

---

## Support & Troubleshooting

**For general questions:**
- Check README.md (comprehensive reference)

**For screenshot technical issues:**
- Check SCREENSHOT_CAPTURE_GUIDE.md

**For environment/login issues:**
- Check SETUP_COMPLETE.md

**For specific role issues:**
- Check the role-specific INSTRUCTIONS.md (01, 02, 03, or 04)

---

## Document Information

- **Created:** 2026-06-16
- **Project:** CareBridge Connect MVP
- **Documentation Type:** User Flow Screenshots & Guides
- **Status:** Complete and ready for use
- **Total Screenshots to Capture:** 24

---

## Quick Links

- 📖 [START_HERE.md](START_HERE.md) - Start here!
- 📋 [README.md](README.md) - Full overview
- 📸 [SCREENSHOT_CAPTURE_GUIDE.md](SCREENSHOT_CAPTURE_GUIDE.md) - How to capture
- ✅ [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - Verify environment
- ☑️ [CAPTURE_CHECKLIST.md](CAPTURE_CHECKLIST.md) - Track progress
- 👨‍⚕️ [01_professional/INSTRUCTIONS.md](01_professional/INSTRUCTIONS.md) - Professional role
- 👤 [02_private_client/INSTRUCTIONS.md](02_private_client/INSTRUCTIONS.md) - Private client role
- 🏢 [03_organisation/INSTRUCTIONS.md](03_organisation/INSTRUCTIONS.md) - Organisation role
- 👨‍💼 [04_admin/INSTRUCTIONS.md](04_admin/INSTRUCTIONS.md) - Admin role

---

**Ready to start? → [START_HERE.md](START_HERE.md)**
