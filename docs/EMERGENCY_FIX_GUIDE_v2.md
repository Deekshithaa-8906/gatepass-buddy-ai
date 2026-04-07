# Emergency Fix Guide - Comprehensive Database Recovery

## Issues Identified

### ❌ Issue 1: Missing Profile Tables
```
ERROR: 42P01: relation "public.students_details" does not exist
```
**Root Cause**: Previous migrations (split_user_profiles.sql) didn't run, so profile tables don't exist.

### ❌ Issue 2: Missing Request Tables
Some request tables may not have been created properly.

### ❌ Issue 3: user_profile_view Not Created
```
Could not find the table 'public.user_profile_view' in the schema cache
```

### ❌ Issue 4: Frontend Query Failure
App was querying for columns that don't exist (legacy field names).

---

## Fix Steps (Order Matters!)

### Step 1: Run Comprehensive Fix Migration in Supabase SQL Editor

1. Open [Supabase SQL Editor](https://app.supabase.com)
2. Select your project
3. Click **New Query**
4. Copy the entire content from:
   ```
   supabase/migrations/20260407_fix_partial_deployment.sql
   ```
5. **Paste** and **Execute**
6. ✅ Wait for success message (should say "Command completed successfully")

**This migration will:**
- ✅ Create all missing profile tables (students_details, staff_details, hod_details, principal_details, warden_details)
- ✅ Create requests and request_approvals tables  
- ✅ Create user_profile_view (unified profile reads)
- ✅ Create all helper functions
- ✅ Set up RLS policies
- ✅ Fix all column names and relationships

---

### Step 2: Update LocalHost App

The AuthContext has been fixed to use correct column names.

1. **Close** dev server (Ctrl+C if running)
2. **Clean** npm cache:
   ```bash
   cd "d:\Project\Hostel_Management(Deekshi)"
   npm cache clean --force
   del node_modules
   npm install
   ```
3. **Start** dev server again:
   ```bash
   npm run dev
   ```

---

### Step 3: Verify in Browser

1. Open browser DevTools (**F12**)
2. Go to **Console** tab
3. **Refresh** page (Ctrl+R)
4. ✅ Should see **NO errors** about tables missing
5. ✅ Should see **NO errors** about columns missing
6. ✅ Page should load normally

**Expected**: Landing page loads without auth errors

---

## What the Fix Does

### Migration: `20260407_fix_partial_deployment.sql` (Comprehensive)

✅ **Creates all missing profile tables** (Step 0):
- `students_details` - with all required columns and foreign keys
- `staff_details` - staff profile data
- `hod_details` - head of department profile
- `principal_details` - principal profile
- `warden_details` - warden profile

✅ **Creates request management tables** (Steps 2-3):
- `requests` - unified request storage
- `request_approvals` - approval workflow tracking (with `approver_role` column)

✅ **Recreates `user_profile_view`** (Step 1):
- Joins all role-specific profile tables
- Includes mentor/advisor/hod/principal joined data
- Provides backward-compatible column names
- Uses LEFT JOINs so it works even if tables are empty

✅ **Ensures core functions exist** (Step 8):
- `update_updated_at_column()` - auto-update timestamps
- `get_current_user_id()` - get current user's ID
- `get_current_user_role()` - get current user's role
- `is_current_user_admin()` - check if admin

✅ **Sets up RLS policies** (Step 5):
- Approvers can see assigned requests
- Admins have full access
- Properly secured

✅ **Grants database permissions** (Step 9):
- Authenticated users can read views
- Authenticated users can execute functions

### React: Updated AuthContext.tsx

✅ **Queries only columns that exist**:
- `parent_number` instead of `parent_mobile`
- `year` instead of `year_of_study`
- Joined names: `mentor_name`, `advisor_name`, etc.

✅ **Maps to Profile interface** for backward compatibility

---

## Verification Queries

After running the fix migration, run these in Supabase SQL Editor:

### Check 1: All Profile Tables Exist
```sql
select table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_name in ('students_details', 'staff_details', 'hod_details', 'principal_details', 'warden_details')
order by table_name;
```
✅ Should return 5 rows

### Check 2: View Exists and Works
```sql
select * from public.user_profile_view limit 1;
```
✅ Should work with no error

### Check 3: request_approvals Has approver_role
```sql
select column_name 
from information_schema.columns 
where table_name = 'request_approvals'
  and column_name = 'approver_role';
```
✅ Should return 1 row

### Check 4: All Functions Exist
```sql
select routine_name 
from information_schema.routines 
where routine_schema = 'public'
  and routine_name in ('get_current_user_id', 'get_current_user_role', 'is_current_user_admin')
order by routine_name;
```
✅ Should return 3 rows

---

## Troubleshooting

### Still Seeing Errors?

**1. Verify migration ran**:
```sql
select count(*) as tables_count
from information_schema.tables 
where table_schema = 'public' 
  and table_name in ('students_details', 'staff_details', 'hod_details', 'principal_details', 'warden_details');
```
Should return 5. If not, re-run the migration.

**2. Clear browser cache**:
```
Ctrl+Shift+Delete → Clear Cache and select "All time"
```

**3. Hard restart**:
```bash
npm cache clean --force
npm run dev
# Hard refresh in browser: Ctrl+Shift+R
```

---

## Migration Safety

✅ **Safe to run multiple times**:
- Uses `create table if not exists` - won't fail if tables exist
- Uses `create or replace view` - safely updates views
- Uses `drop if exists` only where needed

✅ **No data loss**:
- All tables and views created/updated
- Existing data untouched
- Can be run against any database state

---

**Status**: Database recovery in progress

Run the migration to get your app back online!
