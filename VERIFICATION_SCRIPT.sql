-- VERIFICATION & DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose admin/account issues

-- 1. Check all accounts in user_directory
SELECT 'All Accounts in user_directory:' as info;
SELECT 
  email, 
  full_name, 
  role, 
  access_status, 
  account_status,
  created_at
FROM public.user_directory
ORDER BY role, created_at DESC;

-- 2. Check for admin accounts specifically
SELECT '--- ADMIN ACCOUNTS ---' as section;
SELECT 
  email, 
  role, 
  access_status, 
  account_status
FROM public.user_directory
WHERE role = 'admin';

-- 3. Count by role
SELECT '--- ACCOUNTS BY ROLE ---' as section;
SELECT 
  role, 
  COUNT(*) as count,
  COUNT(CASE WHEN access_status = 'approved' THEN 1 END) as approved_count
FROM public.user_directory
GROUP BY role
ORDER BY role;

-- 4. Check for any pending accounts that should be approved
SELECT '--- PENDING ACCOUNTS (need approval) ---' as section;
SELECT 
  email, 
  full_name, 
  role, 
  access_status
FROM public.user_directory
WHERE access_status != 'approved'
ORDER BY created_at DESC;

-- 5. Check test accounts status
SELECT '--- TEST ACCOUNTS STATUS ---' as section;
SELECT 
  email, 
  full_name, 
  role, 
  access_status, 
  account_status
FROM public.user_directory
WHERE email IN (
  'admin@snsgroups.com',
  'student@snsgroups.com',
  'mentor@snsgroups.com',
  'advisor@snsgroups.com',
  'hod@snsgroups.com',
  'warden@snsgroups.com',
  'principal@snsgroups.com',
  'staff@snsgroups.com'
)
ORDER BY role;

-- 6. Quick fix - If admin exists but inactive, activate it
-- UNCOMMENT AND RUN ONLY IF NEEDED:
-- UPDATE public.user_directory 
-- SET access_status = 'approved', account_status = 'active'
-- WHERE email = 'admin@snsgroups.com';

-- 7. Show database schema of user_directory
SELECT '--- user_directory TABLE SCHEMA ---' as section;
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_directory'
ORDER BY ordinal_position;
