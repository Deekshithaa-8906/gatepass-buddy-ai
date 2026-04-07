# Admin & Test Accounts Setup Guide

## Overview
This guide will help you:
1. Fix the admin account issue
2. Create dummy test accounts for all roles to access all dashboards

## Step 1: Create Admin & Test Accounts in Supabase Auth

### Go to Supabase Dashboard:
1. Navigate to: `https://supabase.com/dashboard`
2. Select your project
3. Go to **Authentication** → **Users**
4. Click **"Add user"** or **"Invite"**

### Create these accounts via Auth UI:

#### Admin Account
- **Email:** `admin@snsgroups.com`
- **Password:** `Admin@12345` (or your preferred secure password)
- **Auto confirm:** Toggle ON to approve immediately

#### Test Accounts (create one for each role):
1. **Student**
   - Email: `student@snsgroups.com`
   - Password: `Student@12345`

2. **Mentor**
   - Email: `mentor@snsgroups.com`
   - Password: `Mentor@12345`

3. **Advisor**
   - Email: `advisor@snsgroups.com`
   - Password: `Advisor@12345`

4. **HOD (Head of Department)**
   - Email: `hod@snsgroups.com`
   - Password: `Hod@12345`

5. **Warden**
   - Email: `warden@snsgroups.com`
   - Password: `Warden@12345`

6. **Principal**
   - Email: `principal@snsgroups.com`
   - Password: `Principal@12345`

7. **Staff**
   - Email: `staff@snsgroups.com`
   - Password: `Staff@12345`

---

## Step 2: Add Accounts to user_directory Table

After creating all auth accounts, go to **Supabase Dashboard** → **SQL Editor** and execute this script:

```sql
-- Insert Admin Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department)
VALUES 
('admin@snsgroups.com', 'Admin User', 'admin', 'approved', 'active', 'SNS Institution', 'Administration')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Admin User',
  role = 'admin',
  access_status = 'approved',
  account_status = 'active';

-- Insert Student Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, register_number, year_of_study, class_details)
VALUES 
('student@snsgroups.com', 'Test Student', 'student', 'approved', 'active', 'SNS Institution', 'Computer Science', 'CS001', '3', 'B.Tech - III Year')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Test Student',
  role = 'student',
  access_status = 'approved',
  account_status = 'active',
  register_number = 'CS001',
  year_of_study = '3',
  class_details = 'B.Tech - III Year';

-- Insert Mentor Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, mobile_number)
VALUES 
('mentor@snsgroups.com', 'Dr. Mentor', 'mentor', 'approved', 'active', 'SNS Institution', 'Computer Science', '9876543210')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Dr. Mentor',
  role = 'mentor',
  access_status = 'approved',
  account_status = 'active';

-- Insert Advisor Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, mobile_number)
VALUES 
('advisor@snsgroups.com', 'Prof. Advisor', 'advisor', 'approved', 'active', 'SNS Institution', 'Computer Science', '9876543211')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Prof. Advisor',
  role = 'advisor',
  access_status = 'approved',
  account_status = 'active';

-- Insert HOD Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, mobile_number)
VALUES 
('hod@snsgroups.com', 'Dr. HOD', 'hod', 'approved', 'active', 'SNS Institution', 'Computer Science', '9876543212')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Dr. HOD',
  role = 'hod',
  access_status = 'approved',
  account_status = 'active';

-- Insert Warden Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, mobile_number)
VALUES 
('warden@snsgroups.com', 'Mr. Warden', 'warden', 'approved', 'active', 'SNS Institution', 'Hostel Management', '9876543213')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Mr. Warden',
  role = 'warden',
  access_status = 'approved',
  account_status = 'active';

-- Insert Principal Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, mobile_number)
VALUES 
('principal@snsgroups.com', 'Dr. Principal', 'principal', 'approved', 'active', 'SNS Institution', 'Administration', '9876543214')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Dr. Principal',
  role = 'principal',
  access_status = 'approved',
  account_status = 'active';

-- Insert Staff Account
INSERT INTO public.user_directory 
(email, full_name, role, access_status, account_status, institute, department, mobile_number)
VALUES 
('staff@snsgroups.com', 'Mr. Staff', 'staff', 'approved', 'active', 'SNS Institution', 'Support', '9876543215')
ON CONFLICT (email) DO UPDATE SET 
  full_name = 'Mr. Staff',
  role = 'staff',
  access_status = 'approved',
  account_status = 'active';

-- Verify all accounts were inserted
SELECT email, full_name, role, access_status, account_status FROM public.user_directory 
WHERE email IN ('admin@snsgroups.com', 'student@snsgroups.com', 'mentor@snsgroups.com', 'advisor@snsgroups.com', 'hod@snsgroups.com', 'warden@snsgroups.com', 'principal@snsgroups.com', 'staff@snsgroups.com')
ORDER BY role;
```

---

## Step 3: Verify Setup

### Check in Supabase:
1. Go to **Table Editor** → **user_directory**
2. Filter by the test emails above
3. Confirm all rows are present with:
   - ✅ `access_status = 'approved'`
   - ✅ `account_status = 'active'`
   - ✅ Correct `role` value

### Test Admin Login:
1. Open your app at: `http://localhost:5173/admin-login`
2. Enter credentials:
   - **Email:** `admin@snsgroups.com`
   - **Password:** `Admin@12345`
3. Should redirect to `/admin` dashboard

### Test Other Dashboards:
- **Student Dashboard:** `http://localhost:5173/student` | Email: `student@snsgroups.com`
- **Warden Dashboard:** `http://localhost:5173/warden` | Email: `warden@snsgroups.com`
- **Principal Dashboard:** `http://localhost:5173/principal` | Email: `principal@snsgroups.com`
- **Staff Dashboard:** `http://localhost:5173/staff` | Email: `staff@snsgroups.com`

---

## Admin Account Troubleshooting

### Issue: "This account does not have admin access"
**Solution:** Ensure in `user_directory`:
1. Role = `'admin'` (exactly)
2. access_status = `'approved'`
3. account_status = `'active'`

### Issue: "Unable to sign in as admin"
**Solution:** 
1. Verify auth user exists in Supabase **Authentication → Users**
2. Check password is correct
3. Ensure user email matches exactly (case-insensitive)

### Issue: Auth account exists but no user_directory entry
**Solution:** Run the SQL INSERT script above for that specific role

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "This account does not have admin access" | Role != 'admin' in user_directory | Update role column to 'admin' |
| "Unable to sign in as admin" | Password incorrect or auth user not found | Verify auth credentials in dashboard |
| Access denied to dashboard | access_status != 'approved' or account_status != 'active' | Update both statuses in SQL |
| "User not found" on Resend emails | user_directory entry missing | Insert entry with SQL script |

---

## Next Steps After Setup

1. ✅ Log in to all dashboards with test accounts
2. ✅ Test faculty assignment flow (Student Dashboard → Profile → Faculty Incharge)
3. ✅ Test admin approval workflow (Admin → Pending Approvals)
4. ✅ Test resend create-password email (Admin → Resend)
5. ✅ Verify all role-based features work correctly

---

## Notes

- All test passwords follow format: `{Role}@12345`
- Institute field is set to `'SNS Institution'` for all (update as needed)
- Departments are role-specific for filtering faculty in student profile
- For student, register_number & year_of_study are populated; faculty accounts have role-specific fields
- All accounts start in `'approved'` and `'active'` status for immediate testing
