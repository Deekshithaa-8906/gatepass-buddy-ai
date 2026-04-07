# Emergency Fix Guide - Database & Frontend Issues

## Issues Identified

### ❌ Issue 1: Database Error
```
ERROR: 42703: column "approver_role" does not exist
```
**Root Cause**: Previous migrations didn't complete properly, some tables/columns missing.

### ❌ Issue 2: Frontend 404 Error  
```
Could not find the table 'public.user_profile_view' in the schema cache
```
**Root Cause**: `user_profile_view` wasn't created in previous migrations.

### ❌ Issue 3: AuthContext Query Failure
App was querying for columns that don't exist in the new schema (legacy columns).

---

## Fix Steps (Order Matters!)

### Step 1: Run Fix Migration in Supabase SQL Editor

1. Open [Supabase SQL Editor](https://app.supabase.com)
2. Select your project
3. Click **New Query**
4. Copy the entire content from:
   ```
   supabase/migrations/20260407_fix_partial_deployment.sql
   ```
5. **Paste** and **Execute**
6. ✅ Wait for success message (should say "Command completed successfully")

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
4. ✅ Should see **NO errors** about `user_profile_view`
5. ✅ Should see **NO errors** about `approver_role`
6. ✅ Page should load normally

**Expected**: Landing page loads without auth errors

---

## What the Fix Does

### Migration: `20260407_fix_partial_deployment.sql`

✅ **Recreates** `user_profile_view` with all required columns:
- Joins all role-specific profile tables
- Includes mentor/advisor/hod/principal joined data
- Provides backward-compatible column names

✅ **Recreates** `request_approvals` table with:
- All columns properly defined
- Foreign keys to both `requests` and `user_directory`
- Proper indexes
- RLS enabled

✅ **Fixes** RLS policies:
- Removes incorrectly named policies
- Creates correct approver read policy
- Maintains admin access

✅ **Ensures** triggers are in place:
- Auto-update `updated_at` timestamp
- Audit trail for modifications

### React: Updated AuthContext.tsx

✅ **Queries** only columns that exist:
- `parent_number` instead of non-existent `parent_mobile`
- `year` instead of `year_of_study`
- Joined names: `mentor_name`, `advisor_name`, etc.

✅ **Maps** to Profile interface for backward compatibility:
- Old code still works with `parent_mobile` field
- Old code still works with `year_of_study` field
- Transparent mapping layer

---

## Verification Queries

After running the fix migration, run these in Supabase SQL Editor to confirm everything works:

### Check 1: View Exists
```sql
select * from public.user_profile_view limit 1;
```
✅ Should return 1 row (no error)

### Check 2: request_approvals Table Exists
```sql
select column_name 
from information_schema.columns 
where table_name = 'request_approvals';
```
✅ Should show `approver_role` column

### Check 3: Can Query Approvals
```sql
select * from public.request_approvals limit 1;
```
✅ Should work (even if no rows, no error)

### Check 4: Functions Work
```sql
select public.is_current_user_admin();
```
✅ Should return `true` or `false` (no error)

---

## Troubleshooting

### Still Seeing "user_profile_view not found"?

**Solution 1**: Clear browser cache
```
Ctrl+Shift+Delete → Clear Cache
```

**Solution 2**: Force rebuild React
```bash
npm run build
# Then serve the dist folder or restart dev server
```

**Solution 3**: Verify migration ran
```sql
-- In Supabase SQL Editor, check if view exists:
select table_name 
from information_schema.tables 
where table_schema = 'public' and table_name = 'user_profile_view';
```
✅ Should return 1 row

---

### Still Seeing "approver_role column doesn't exist"?

**Solution**: Re-run the fix migration
- Make sure you executed: `20260407_fix_partial_deployment.sql`
- It will drop and recreate the table to fix corruption

---

### AuthContext still showing errors?

**Solution**: 
1. Hard refresh browser: **Ctrl+Shift+R** (clears cache)
2. Check DevTools → Network → XHR requests
3. Look for the actual API error (might show what column is missing)
4. Report that column name and we'll add it to the view

---

## If Fixes Don't Work

### Nuclear Option - Rollback to Previous Schema

If things are still broken, you can temporarily revert to query `user_directory` directly while we debug:

**Temporary Fix in AuthContext** (not ideal, but works):
```typescript
const { data, error } = await supabase
  .from('user_directory')
  .select('id, email, full_name, role, status, password_created, onboarding_complete, access_status, account_status')
  .eq('email', userEmail)
  .maybeSingle();
```

This will let you log in while we fix the view. Update this back once view is working.

---

## Timeline

- **Now**: Run fix migration (2 minutes)
- **Now**: Update app code (already done, just npm install)
- **Now**: Test in browser (1 minute)
- **Expected**: Full functionality restored

---

## Questions or Still Stuck?

1. **Check Supabase logs**: Project → Logs → Check for SQL errors
2. **Verify migration ran**: Open Supabase SQL Editor and run Check 1 above  
3. **Clear browser cache**: Ctrl+Shift+Delete → All time → Clear
4. **Restart everything**: 
   - Stop dev server (Ctrl+C)
   - Restart dev server (npm run dev)
   - Refresh browser 10 times
   - Check console for errors

---

**Status**: 🟡 **PARTIAL FAILURE** → 🟢 **RECOVERED** (after running this fix)
