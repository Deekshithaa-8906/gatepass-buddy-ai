# 🔐 Test Accounts Quick Reference

## Admin & Dashboard Login Credentials

| Role | Email | Password | Dashboard URL |
|------|-------|----------|---|
| **Admin** | `admin@snsgroups.com` | `Admin@12345` | `/admin-login` then `/admin` |
| **Student** | `student@snsgroups.com` | `Student@12345` | `/student` |
| **Warden** | `warden@snsgroups.com` | `Warden@12345` | `/warden` |
| **Principal** | `principal@snsgroups.com` | `Principal@12345` | `/principal` |
| **Staff** | `staff@snsgroups.com` | `Staff@12345` | `/staff` |
| **Mentor** | `mentor@snsgroups.com` | `Mentor@12345` | (Faculty - no direct dashboard) |
| **Advisor** | `advisor@snsgroups.com` | `Advisor@12345` | (Faculty - no direct dashboard) |
| **HOD** | `hod@snsgroups.com` | `Hod@12345` | (Faculty - no direct dashboard) |

## 🚀 Quick Setup Checklist

- [ ] Supabase Auth users created (7-8 accounts)
- [ ] user_directory entries created via SQL
- [ ] All accounts have `access_status = 'approved'`
- [ ] All accounts have `account_status = 'active'`
- [ ] Admin login works at `/admin-login`
- [ ] Test all dashboards with respective accounts
- [ ] Faculty account filtering works in student profile
- [ ] DB migration for faculty columns executed

## 📋 Test Scenarios

### Admin Portal
1. Login: `admin@snsgroups.com` / `Admin@12345`
2. Should see: Pending Approvals, User Management, Staff Management
3. Test Resend button for create-password emails

### Student Dashboard
1. Login: `student@snsgroups.com` / `Student@12345`
2. Should see: Profile Settings, Outing Requests, Leave Requests, Complaints
3. Go to Profile → Faculty Incharge Details
4. Should see dropdowns populated with Mentor, Advisor, HOD from user_directory
5. Principal field should be auto-filled based on institute

### Faculty Accounts
- Should appear in student's faculty dropdown when:
  - Role matches (mentor/advisor/hod)
  - Institute matches student's institute
  - Department matches student's department
  - access_status = 'approved'

## ⚙️ Institute Configuration

All test accounts use:
- **Institute:** `'SNS Institution'`
- **Department (varies by role):**
  - Student, Mentor, Advisor, HOD: `'Computer Science'`
  - Warden: `'Hostel Management'`
  - Principal, Staff, Admin: `'Administration'`

Update these values in the SQL script if your institution names are different.

## 🔧 Common Commands

### Check Current state
```bash
# Run this SQL in Supabase SQL Editor
SELECT email, role, access_status, account_status 
FROM user_directory 
WHERE email LIKE '%@snsgroups.com%'
ORDER BY role;
```

### Quick Fix: Activate Admin
```sql
UPDATE user_directory 
SET access_status = 'approved', account_status = 'active'
WHERE email = 'admin@snsgroups.com' AND role = 'admin';
```

### Delete All Test Accounts
```sql
DELETE FROM user_directory 
WHERE email IN (
  'admin@snsgroups.com',
  'student@snsgroups.com',
  'mentor@snsgroups.com',
  'advisor@snsgroups.com',
  'hod@snsgroups.com',
  'warden@snsgroups.com',
  'principal@snsgroups.com',
  'staff@snsgroups.com'
);
```

## 🎯 Features to Test with Dummy Accounts

- [x] Admin authentication with role verification
- [x] Student profile with faculty incharge assignment
- [x] Faculty dropdown filtering by institute & department
- [x] Create password email resend flow
- [x] OTP-based authentication fallback
- [x] Password strength meter on create password page
- [x] Role-based dashboard access
- [x] Faculty account editable fields
- [ ] Principal auto-fill from institute
- [ ] Approval workflow for new accounts

## 📞 Troubleshooting

**"This account does not have admin access"**
→ Check user_directory has role='admin' with access_status='approved'

**"Unable to sign in"**
→ Verify Supabase Auth user exists with correct email/password

**Faculty dropdowns are empty**
→ Create faculty accounts with matching institute/department first

**Resend email not working**
→ Check edge-function logs in Supabase dashboard
