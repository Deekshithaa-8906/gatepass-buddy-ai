# Database Reorganization - Deployment & Validation Guide

## Pre-Deployment Checklist

- [ ] All previous migrations already applied (OTP, RLS, split profiles, pass requests)
- [ ] Backup taken of Supabase database
- [ ] Team notified of maintenance window (if any)
- [ ] Edge functions ready for deployment

---

## Step 1: Deploy Migration in Supabase

### Method A: Via Supabase Dashboard (Recommended for Non-Production)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy entire content from: `supabase/migrations/20260407_database_reorganization.sql`
6. Paste and execute
7. Watch for errors in the output panel
8. Confirm all phases completed:
   ```
   ✓ Phase 1: Drop Redundant Tables
   ✓ Phase 2: Create Missing Core Request Management Tables
   ✓ Phase 3: Create Missing Complaint Management Table
   ✓ Phase 4: Create Notifications Table
   ✓ Phase 5: Create Account Approval Requests Table
   ✓ Phase 6: Enhance Pass Request Tables
   ✓ Phase 7: Create Unified View for Request Management
   ✓ Phase 8: Ensure RLS is Enabled
   ✓ Phase 9: Create RLS Policies for New Tables
   ✓ Phase 10: Backfill Pass Requests with Student IDs
   ✓ Phase 11: Add Constraints to Pass Tables
   ✓ Phase 12: Create Audit Triggers
   ✓ Phase 13: Create Helper Functions
   ```

### Method B: Via CLI (For Production / Version Control)

```bash
# Install Supabase CLI if not already done
npm install -g supabase

# Login to your Supabase account
supabase login

# Link to project
supabase link --project-id your-project-id

# Apply migration (Supabase will track it)
supabase db pull  # Updates local schema from remote
supabase db push  # Pushes migrations to remote

# Or manually:
psql "postgresql://..." -f supabase/migrations/20260407_database_reorganization.sql
```

---

## Step 2: Validation Queries

Run these queries in Supabase SQL Editor to verify successful deployment:

### Check 1: Tables Created
```sql
-- Should return all 13 core tables
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_directory',
    'registration_otp_challenges',
    'students_details',
    'staff_details',
    'hod_details',
    'principal_details',
    'warden_details',
    'leave_requests',
    'outing_requests',
    'requests',
    'request_approvals',
    'complaints',
    'notifications',
    'approval_requests'
  )
ORDER BY tablename;

-- Expected: 14 rows (all tables present)
```

### Check 2: Removed Redundant Table
```sql
-- Should return 0 rows (profiles table removed)
SELECT count(*)
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Expected: 0
```

### Check 3: Foreign Keys Added to Pass Requests
```sql
-- Check leave_requests has new foreign key columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leave_requests'
  AND column_name IN ('student_id', 'mentor_id', 'advisor_id', 'hod_id')
ORDER BY ordinal_position;

-- Expected: 4 rows with uuid type
```

### Check 4: Backfill Verification
```sql
-- Check how many leave_requests have student_id populated
SELECT 
  count(*) as total_leave_requests,
  count(student_id) as with_student_id,
  count(student_id) filter (where student_id is null) as missing_student_id
FROM public.leave_requests;

-- Expected: missing_student_id = 0 (or minimal)

-- Same for outing_requests
SELECT 
  count(*) as total_outing_requests,
  count(student_id) as with_student_id,
  count(student_id) filter (where student_id is null) as missing_student_id
FROM public.outing_requests;
```

### Check 5: Indexes Created
```sql
-- Should return all new indexes
SELECT 
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Expected: 40+ indexes (existing + new)
```

### Check 6: Views Created
```sql
-- Check views exist
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
  AND table_name IN ('user_profile_view', 'all_requests_view')
ORDER BY table_name;

-- Expected: 2 rows
```

### Check 7: RLS Enabled
```sql
-- Verify RLS is enabled on all tables
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'requests',
    'request_approvals',
    'complaints',
    'notifications',
    'approval_requests'
  )
ORDER BY tablename;

-- Expected: all 'rowsecurity' = true
```

### Check 8: Functions Created
```sql
-- Check helper functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_current_user_id',
    'get_current_user_role',
    'update_updated_at_column',
    'is_current_user_admin'
  )
ORDER BY routine_name;

-- Expected: 4 rows (all functions present)
```

### Check 9: Triggers Created
```sql
-- Check update_updated_at triggers
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'update_%'
ORDER BY event_object_table;

-- Expected: 5 triggers (requests, request_approvals, complaints, notifications, approval_requests)
```

### Check 10: Data Integrity
```sql
-- Check no orphaned records in leave_requests
SELECT count(*)
FROM public.leave_requests
WHERE student_id not in (select id from public.user_directory);

-- Expected: 0

-- Check no orphaned mentor references
SELECT count(*)
FROM public.leave_requests
WHERE mentor_id is not null
  AND mentor_id not in (select id from public.user_directory);

-- Expected: 0
```

---

## Step 3: Data Integrity Fixes (If Needed)

If any orphaned records exist, run these cleanup queries:

```sql
-- Fix: Add missing student_id references (for email-based lookup)
UPDATE public.leave_requests lr
SET student_id = ud.id
FROM public.user_directory ud
WHERE lower(lr.student_email) = lower(ud.email)
  AND lr.student_id is null;

UPDATE public.outing_requests or_
SET student_id = ud.id
FROM public.user_directory ud
WHERE lower(or_.student_email) = lower(ud.email)
  AND or_.student_id is null;
```

---

## Step 4: Application Testing

### Test 1: Student Dashboard - Create Leave Request
1. Login as student
2. Go to Dashboard → Outing/Leave Pass
3. Select mentor (should require selection)
4. Fill form and submit
5. **Verify**: 
   - Row created in `leave_requests` with `student_id`, `mentor_id` populated
   - `status` = 'pending'
   - `current_approver` = 'mentor'

### Test 2: Staff Dashboard - Approve Request
1. Login as mentor
2. Go to Staff Dashboard → Pending Leave
3. Click "Approve"
4. **Verify**:
   - `leave_requests.status` = 'approved'
   - `leave_requests.current_approver` = null (or next in chain)
   - `request_approvals` row created (if using new system)
   - Student receives notification

### Test 3: Admin Dashboard
1. Login as admin
2. Go to Admin Access → Recently Verified Users
3. Should show all pending accounts
4. Click "Approve" on one account
5. **Verify**:
   - `user_directory.access_status` = 'approved'
   - `approval_requests.status` = 'approved'
   - Email sent to user with password setup link

### Test 4: Student Complaint
1. Login as student
2. Create a complaint
3. **Verify**:
   - Row created in `complaints` table
   - `student_id`, `category`, `description` populated
   - `status` = 'open'
   - Student can see it in profile

### Test 5: Query New Views
```sql
-- Test user_profile_view
SELECT * FROM public.user_profile_view 
LIMIT 5;

-- Test all_requests_view
SELECT * FROM public.all_requests_view 
WHERE status = 'pending'
LIMIT 10;
```

---

## Step 5: Helper Functions Usage

### In TypeScript / React Components

```typescript
// Get current user's ID
const { data: userId } = await supabase.rpc('get_current_user_id');

// Get current user's role
const { data: userRole } = await supabase.rpc('get_current_user_role');

// Example: Query requests for current user
const { data: requests } = await supabase
  .from('leave_requests')
  .select('*')
  .eq('student_id', userId);
```

---

## Rollback Plan (If Issues Occur)

### Immediate Rollback
```bash
# Restore from backup (via Supabase dashboard)
# Or point to previous migration point
```

### Targeted Rollback (SQL)
```sql
-- Drop only new tables (if migration failed partially)
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.request_approvals CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.approval_requests CASCADE;

-- Drop views
DROP VIEW IF EXISTS public.all_requests_view;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Restore legacy tables (if needed)
ALTER TABLE public.leave_requests DROP COLUMN IF EXISTS student_id CASCADE;
```

---

## Post-Deployment Checklist

- [ ] All validation queries passed (Check 1-10)
- [ ] No error logs in Supabase
- [ ] Student dashboard create request works
- [ ] Staff dashboard approve/reject works
- [ ] Admin dashboard shows pending approvals
- [ ] Notifications working
- [ ] No unexplained data loss
- [ ] Performance acceptable (no slow queries on new tables)
- [ ] Team trained on new schema
- [ ] Documentation updated
- [ ] Backup of current schema taken

---

## Monitoring & Maintenance

### Query Performance Monitoring
```sql
-- See slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Data Growth Tracking
```sql
-- See table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Future Cleanup (30 days after deployment)
```sql
-- Remove old 'profiles' table entries if any remain
-- Delete old registration OTP entries (older than 30 days)
DELETE FROM public.registration_otp_challenges
WHERE created_at < now() - interval '30 days';
```

---

## Troubleshooting

### Issue: "permission denied" when running migration
**Solution**: Ensure your Supabase service role has superuser or schema owner permissions. Run migration as postgres user.

### Issue: Backfill didn't populate student_id
**Solution**: Manually run backfill queries:
```sql
UPDATE public.leave_requests lr
SET student_id = ud.id
FROM public.user_directory ud
WHERE lower(lr.student_email) = lower(ud.email);
```

### Issue: RLS policies not working / "new row violates row level security policy"
**Solution**: 
1. Check user's email in JWT vs user_directory email (case-sensitive!)
2. Run: `SELECT auth.jwt() ->> 'email'` to see what email is in token
3. Verify user_directory row exists with matching email

### Issue: Foreign key constraint violation
**Solution**: 
1. Identify orphaned records
2. Either delete them or create corresponding user_directory rows
3. Run validation Check 10

---

## Performance Optimization (Done)

✓ Proper indexes on all foreign keys
✓ Composite indexes on (status, created_at) for range queries
✓ Separate tables by role (avoids full table scans)
✓ Unified views for app-level queries (not materialized to reduce storage)
✓ RLS push-down (filtered at DB level, not app level)
✓ Denormalized emails for fast filtering (trade-off: requires update triggers for email changes)

---

## Next Steps After Successful Deployment

1. **Monitor** for 1-2 days for any issues
2. **Collect feedback** from staff/students
3. **Optimize** queries if slow (create materialized views if needed)
4. **Plan** future features:
   - Document/PDF generation for approved requests
   - SMS notifications
   - Request reschedule/modify functionality
   - Bulk acceptance for multiple students
5. **Archive** old migrations and update development docs

---

**Questions?** Check DATABASE_SCHEMA.md for detailed table documentation.
