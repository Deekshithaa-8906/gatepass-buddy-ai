# PassNTrack Setup Guide - Complete Database & Authentication Flow

## Overview
This guide covers the complete setup for PassNTrack's authentication system with Supabase and the admin approval workflow.

---

## STEP 1: Supabase Database Setup

### 1.1 Run the Migration Script

Copy the entire content from `SUPABASE_MIGRATION.sql` and execute it in your Supabase SQL Editor:

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the entire content of `SUPABASE_MIGRATION.sql`
5. Click **Run**

This will:
- ✅ Create/update `user_directory` table with all required columns
- ✅ Set up Row Level Security (RLS) policies
- ✅ Enable Realtime broadcasting for live admin dashboard updates

**Result columns in `user_directory`:**
```
- id (UUID)
- email (TEXT, UNIQUE)
- role (TEXT)
- status (TEXT) - 'pending', 'approved', 'active'
- password_created (BOOLEAN)
- full_name, mobile_number, register_number, class_details
- parent_name, parent_mobile, gender, institute
- year_of_study, hostel_block, room_number
- onboarding_complete (BOOLEAN)
- created_at, updated_at (TIMESTAMPS)
```

### 1.2 Verify the Schema

Run this query in SQL Editor to confirm all columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_directory'
ORDER BY ordinal_position;
```

---

## STEP 2: Environment Configuration

### 2.1 Update `.env.local`

Ensure your `.env.local` file has:
```env
VITE_SUPABASE_URL=https://djgcwadvgnhzoezdaojo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Get these from Supabase:
- **URL**: Project Settings → API → Project URL
- **Anon Key**: Project Settings → API → Project API Key (anon/public)

---

## STEP 3: Authentication Flow

### 3.1 Registration Flow
```
User Email → Client Validation → Check Duplicate → Send OTP → User Receives Email
     ↓
User enters OTP → Verify OTP → Create user_directory record → Navigate to Pending Approval
     ↓
Admin Reviews → Approves/Rejects → User Notified
     ↓
User Completes Onboarding → Status = 'active'
```

### 3.2 Each Page's Responsibility

**Register.tsx** (`/register`)
- Email input with validation
- Checks for duplicate emails in `user_directory`
- Sends OTP via `supabase.auth.signInWithOtp()`
- Shows error/success messages
- Navigates to `/verify-otp` on success

**VerifyOTP.tsx** (`/verify-otp`)
- Receives email from navigation state
- User enters OTP code
- Verifies OTP via `supabase.auth.verifyOtp()`
- Creates/updates `user_directory` with `status: 'pending'`
- Navigates to `/pending-approval` on success

**PendingApproval.tsx** (`/pending-approval`)
- Shows waiting message
- Displays "Your account is pending admin approval"
- Link to check inbox for approval email
- "Back to Home" button

**AdminAccess.tsx** (`/admin`)
- Account Requests tab shows all `status: 'pending'` records
- Refreshes every 5 seconds for live updates
- Approve button: Sets `status: 'approved'`
- Reject button: Deletes record from `user_directory`
- Shows count badge of pending requests

### 3.3 Supabase Email Templates to Fill In

Use these exact messages in **Supabase Dashboard → Authentication → Email Templates**:

**Confirm signup**
- Subject: `PassNTrack: Verify Your Email`
- Body: `Your PassNTrack verification code is: {{ .Token }}. Enter this code in the app to continue.`

**Invite user / Magic link**
- Subject: `PassNTrack: Create Your Password`
- Body: `Your account has been approved. Click the button below to create your password and continue onboarding.`

**Reset password**
- Subject: `PassNTrack: Reset Your Password`
- Body: `We received a request to reset your PassNTrack password. Use the link below to create a new password.`

**Recommended redirect URLs**
- Confirm signup: `/verify-otp`
- Invite / create password: `/create-password`
- Reset password: `/reset-password`

---

## STEP 4: Console Error Resolution

### Error 1: "column user_directory.phone does not exist"
**Cause**: Code queries `phone` column but column is named `mobile_number`
**Fix**: ✅ Updated in AuthContext.tsx (already fixed)

### Error 2: "400 Bad Request" on select queries
**Cause**: Querying columns that don't exist or RLS policy issues
**Fix**: ✅ All column names updated to match schema

### Error 3: "CORS policy: No 'Access-Control-Allow-Origin'"
**Cause**: Browser extension (extension.flash.co) trying to access API
**Fix**: This is harmless - just ignore. It's your browser extensions trying to access external APIs, not your app's fault

### Error 4: "429 Too Many Requests" on OTP
**Cause**: Spam protection from Supabase
**Fix**: Wait 60 seconds before trying again

---

## STEP 5: Testing the Complete Flow

### Test 1: Register Flow
1. Go to `http://localhost:5173/register`
2. Enter email: `test.user@example.com`
3. Click "Verify Email"
4. Expected: ✅ Success message → Navigate to OTP verification page
5. Check browser console: ❌ NO error about missing columns

### Test 2: OTP Verification
1. Check your email (Supabase sends OTP)
2. Copy OTP code
3. On verification page, enter OTP
4. Click "Verify Email"
5. Expected: ✅ User added to `user_directory` → Navigate to Pending Approval

### Test 3: Admin Dashboard
1. Open new tab: `http://localhost:5173/admin`
2. Expected: ✅ Shows your pending registration request
3. Count badge shows: `1` request
4. Click green checkmark: Approve
5. Expected: ✅ Record removed from pending list, status updated to 'approved'

### Test 4: Duplicate Email Check
1. Try registering with same email again
2. Expected: ✅ Error message: "This email is already registered and approved. Please log in instead."

---

## STEP 6: Column Mapping Reference

**Frontend Code Uses** → **Database Column**
- `mobile_number` → `mobile_number` ✅
- `role` → `role` ✅
- `status` → `status` ✅
- `full_name` → `full_name` ✅
- `email` → `email` ✅
- `created_at` → `created_at` ✅

**Removed (Don't Use):**
- `phone` ❌ (use `mobile_number` instead)
- `profile_photo` ❌ (not yet in schema)

---

## STEP 7: Database Maintenance

### View All Pending Requests
```sql
SELECT email, role, status, created_at 
FROM user_directory 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### View All Approved Users
```sql
SELECT email, role, status, full_name 
FROM user_directory 
WHERE status = 'approved'
ORDER BY created_at DESC;
```

### Delete Testing Records
```sql
DELETE FROM user_directory 
WHERE email LIKE '%test%' OR email LIKE '%example%';
```

### Reset Status
```sql
UPDATE user_directory 
SET status = 'pending' 
WHERE email = 'specific.email@example.com';
```

---

## STEP 8: Troubleshooting Checklist

- [ ] ✅ Ran `SUPABASE_MIGRATION.sql` in SQL Editor
- [ ] ✅ All columns visible in schema verification query
- [ ] ✅ `.env.local` has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [ ] ✅ Built project: `npm run build` (should show 1717 modules transformed, 0 errors)
- [ ] ✅ Started dev server: `npm run dev`
- [ ] ✅ No "column does not exist" errors in console
- [ ] ✅ Can register with new email (gets OTP email)
- [ ] ✅ Can verify OTP (appears in pending requests)
- [ ] ✅ Admin dashboard shows pending requests in real-time
- [ ] ✅ Can approve/reject requests

---

## STEP 9: Build & Deploy

### Development
```bash
npm run dev
# http://localhost:5173
```

### Production Build
```bash
npm run build
# Creates dist/ folder
```

### Verify Build
```bash
npm run preview
# Preview production build locally
```

---

## Summary: What's Fixed

✅ **Database Schema**: `SUPABASE_MIGRATION.sql` creates all required columns
✅ **AuthContext**: Fixed to query only existing columns (`mobile_number` not `phone`)
✅ **Register.tsx**: Uses correct column names and error handling
✅ **VerifyOTP.tsx**: Inserts correct database fields
✅ **AdminAccess.tsx**: Queries from correct columns
✅ **Build**: All 1717 modules compile with zero errors

---

## Next Steps

1. ✅ **Run the SQL migration** in Supabase
2. ✅ **Verify the schema** exists
3. ✅ **Start dev server**: `npm run dev`
4. ✅ **Test the complete flow** (Register → OTP → Admin Approval)
5. ✅ **Deploy to production** when ready

**All console errors should be fixed!** 🚀
