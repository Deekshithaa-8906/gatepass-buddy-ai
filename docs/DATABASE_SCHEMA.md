# Hostel Management System - Database Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Authentication & Status](#core-authentication--status)
3. [Profile Tables](#profile-tables)
4. [Request Management](#request-management)
5. [Workflow & Approvals](#workflow--approvals)
6. [User Engagement](#user-engagement)
7. [Views](#views)
8. [RLS Security Model](#rls-security-model)
9. [Query Examples](#query-examples)

---

## Overview

The database is organized into logical layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication & Status                  │
│  (user_directory, registration_otp_challenges)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      User Profiles                           │
│  (students_details, staff_details, hod_details, etc.)       │
│  └─ Unified View: user_profile_view                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               Requests & Approvals                          │
│  (requests, leave_requests, outing_requests,                │
│   request_approvals, approval_requests, complaints)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Notifications & Engagement                      │
│  (notifications)                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Authentication & Status

### user_directory
**Purpose**: Central user registry with auth status and role

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| email | text | Unique, normalized lowercase |
| role | USER-DEFINED | admin, student, mentor, advisor, hod, principal, warden |
| access_status | USER-DEFINED | pending_approval, approved, rejected, active |
| account_status | USER-DEFINED | active, inactive, suspended |
| status | text | Legacy compatibility (mirrors access_status) |
| password_created | boolean | Tracks if password set after email verification |
| onboarding_complete | boolean | Tracks student onboarding status |
| full_name | text | User's display name |
| register_number | text | For students (legacy field) |
| created_at | timestamp | Account creation time |
| updated_at | timestamp | Last status update |

**Indexes**:
- `idx_user_directory_email` (email)
- `idx_user_directory_role` (role)

**RLS**:
- Users see their own row
- Admins see all rows
- Admin function: `is_current_user_admin()`

---

### registration_otp_challenges
**Purpose**: Temporary storage for email verification codes

| Column | Type | Notes |
|--------|------|-------|
| email | text | Primary key (unique per registration attempt) |
| role | text | Expected role for this registration |
| otp_hash | text | Hashed OTP (bcrypt or SHA256) |
| otp_salt | text | Salt for hash |
| expires_at | timestamp | 10-minute TTL |
| verified_at | timestamp | When code was verified (if any) |
| created_at | timestamp | Code generation time |
| updated_at | timestamp | Last status change |

**Lifecycle**:
1. User enters email in Register form
2. Edge function `registration-otp` creates row with hashed OTP
3. Email sent to user with 6-digit code
4. User enters code in VerifyOTP component
5. Edge function validates hash matches input
6. If valid: verified_at set, user_directory row created, row marked verified
7. If invalid or expired: error shown, row not verified (can retry)

**Indexes**:
- `idx_registration_otp_challenges_expires_at` (for cleanup)

---

## Profile Tables

Each role has a dedicated profile table to keep `user_directory` minimal.

### students_details
**Purpose**: Student profile data and faculty assignments

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to user_directory (1:1, unique) |
| full_name | text | Student name |
| mobile_number | text | Contact number |
| parent_name | text | Parent/guardian name |
| parent_number | text | Parent contact |
| gender | USER-DEFINED | M, F, Other |
| institute | text | College/institute name |
| year | text | Academic year |
| department | text | Department/program |
| register_number | text | College registration ID |
| class_details | text | Section/batch info |
| hostel_block | text | Block name (A, B, C, etc.) |
| room_number | text | Room assignment |
| mentor_id | uuid | FK to user_directory (staff) |
| advisor_id | uuid | FK to user_directory (staff) |
| hod_id | uuid | FK to user_directory (HOD) |
| principal_id | uuid | FK to user_directory (principal) |
| created_at | timestamp | Profile creation time |
| updated_at | timestamp | Last update time |

**Indexes**:
- `idx_students_details_user_id` (user_id)
- `idx_students_details_register_number` (register_number)
- `idx_students_details_mentor_id` (mentor_id)

**Constraints**:
- user_id is unique (1 student profile per user)
- user_id is NOT NULL
- On delete user_directory row: cascade delete this row

**RLS**:
- Students see their own profile
- Faculty see students they mentor/advise/supervise
- Admins see all

---

### staff_details
**Purpose**: Staff member profile

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to user_directory (1:1, unique, NOT NULL) |
| full_name | text | Staff name |
| email | text | Unique email |
| mobile_number | text | Contact |
| gender | USER-DEFINED | M, F, Other |
| department | text | Department |
| institute | text | Institute |
| students | uuid[] | Array of student IDs they supervise |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### hod_details
**Purpose**: Head of Department profile

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to user_directory (1:1, unique, NOT NULL) |
| full_name | text | HOD name |
| email | text | Unique email |
| mobile_number | text | |
| gender | USER-DEFINED | M, F, Other |
| department | text | Department they head |
| institute | text | Institute |
| students | uuid[] | Array of student IDs under jurisdiction |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### principal_details
**Purpose**: Principal profile

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to user_directory (1:1, unique, NOT NULL) |
| full_name | text | |
| email | text | Unique |
| institute | text | Institute they lead |
| mobile_number | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### warden_details
**Purpose**: Hostel warden profile

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to user_directory (1:1, unique, NOT NULL) |
| full_name | text | |
| email | text | Unique |
| institute | text | Institute |
| mobile_number | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Request Management

### leave_requests
**Purpose**: Student leave/permission requests

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| student_id | uuid | FK to user_directory (NOT NULL) |
| student_email | text | Denormalized email (for filtering) |
| student_name | text | Denormalized name |
| mentor_id | uuid | FK to user_directory (staff) |
| mentor_email | text | Denormalized mentor email |
| departure_date | date | Leave start date |
| return_date | date | Return date |
| destination | text | Where student is going |
| reason | text | Why they need leave |
| status | text | pending, approved, rejected |
| approval_chain | text[] | Order of approvers: [mentor, advisor, hod] |
| current_approver | text | Who should approve next: mentor, advisor, hod, or null if final |
| mentor_status | text | pending, approved, rejected |
| advisor_status | text | pending, approved, rejected |
| hod_status | text | pending, approved, rejected |
| approved_by | text | Who gave final approval |
| rejected_by | text | Who rejected it |
| rejection_reason | text | Reason for rejection |
| created_at | timestamp | Request submission time |
| updated_at | timestamp | Last status change |

**Indexes**:
- `idx_leave_requests_student_id`
- `idx_leave_requests_mentor_id`
- `idx_leave_requests_status`
- `idx_leave_requests_current_approver`

**RLS**:
- Students: see own requests
- Mentors/advisors/HOD: see requests they need to approve
- Admins: see all

---

### outing_requests
**Purpose**: Student outing/short-term permission requests

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| student_id | uuid | FK to user_directory (NOT NULL) |
| student_email | text | Denormalized |
| student_name | text | Denormalized |
| mentor_id | uuid | FK to user_directory |
| mentor_email | text | Denormalized |
| departure_datetime | timestamp | Date + time student leaves |
| return_datetime | timestamp | Date + time student returns |
| destination | text | Where going |
| reason | text | Purpose of outing |
| status | text | pending, approved, rejected |
| approval_chain | text[] | [mentor] (typically single approver) |
| current_approver | text | mentor (usually) |
| mentor_status | text | pending, approved, rejected |
| advisor_status | text | pending, approved, rejected |
| hod_status | text | pending, approved, rejected |
| approved_by | text | Who approved |
| rejected_by | text | Who rejected |
| rejection_reason | text | Reason for rejection |
| created_at | timestamp | |
| updated_at | timestamp | |

**Similar structure and indexing to leave_requests**

---

### requests
**Purpose**: Unified request table (future consolidation)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| student_id | uuid | FK to user_directory (NOT NULL) |
| type | text | leave, outing, complaint, other |
| destination | text | Where going (leave/outing only) |
| reason | text | Why (mandate field) |
| departure_date | date | For leave |
| return_date | date | For leave |
| departure_datetime | timestamp | For outing |
| return_datetime | timestamp | For outing |
| status | text | pending, approved, rejected, escalated |
| current_approver_role | text | Whose turn to approve |
| approval_chain | text[] | Order of approvers |
| created_at | timestamp | |
| updated_at | timestamp | |

**Purpose**: This table provides flexibility for future request types beyond leave/outing

**Indexes**:
- `idx_requests_student_id`
- `idx_requests_type`
- `idx_requests_status`

---

## Workflow & Approvals

### request_approvals
**Purpose**: Detailed approval workflow tracking

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| request_id | uuid | FK to requests (NOT NULL) |
| approver_id | uuid | FK to user_directory (NOT NULL) |
| approver_role | text | Role of approver (mentor, advisor, hod, etc.) |
| status | text | pending, approved, rejected |
| reason | text | Approval/rejection reason |
| created_at | timestamp | When approval request was created |
| updated_at | timestamp | When status changed |

**Example workflow**:
1. Student submits leave request → request_id: ABC, status: pending
2. Mentor must approve → request_approvals row created: approver_role='mentor', status='pending'
3. Mentor approves → request_approvals updated: status='approved'
4. If advisor in chain → new row: approver_role='advisor', status='pending'
5. Advisor approves → status='approved'
6. leave_requests.status = 'approved'

**Indexes**:
- `idx_request_approvals_request_id`
- `idx_request_approvals_approver_id`
- `idx_request_approvals_approver_role`

---

### approval_requests
**Purpose**: Account creation approval workflow

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to user_directory (1:1, unique, NOT NULL) |
| name | text | Name from registration |
| email | text | Email |
| role | text | Role they're requesting (student, staff, mentor, etc.) |
| department | text | Department (if applicable) |
| status | text | pending, approved, rejected |
| approved_by | uuid | FK to user_directory (admin who approved) |
| rejection_reason | text | Why rejected |
| created_at | timestamp | Request submission |
| updated_at | timestamp | Last status change |

**Lifecycle**:
1. User registers (VerifyOTP creates user_directory row with status='pending')
2. email_trigger creates approval_requests row with status='pending'
3. Admin sees in AdminAccess → "Recently Verified Users"
4. Admin clicks "Approve" → approval_requests.status='approved', user_directory.access_status='approved'
5. admin_user_mailer triggers, sends password-creation email
6. User creates password → user_directory.password_created=true
7. User can log in

**Indexes**:
- `idx_approval_requests_user_id`
- `idx_approval_requests_email`
- `idx_approval_requests_status`

---

## User Engagement

### complaints
**Purpose**: Student complaints system with escalation

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| student_id | uuid | FK to user_directory (NOT NULL) |
| category | text | harassment, facilities, discipline, other |
| description | text | Complaint details |
| status | text | open, in_progress, resolved, closed |
| escalated_at | timestamp | When escalated to higher authority |
| resolved_at | timestamp | When marked resolved |
| resolution_notes | text | How it was resolved |
| created_at | timestamp | Complaint submission |
| updated_at | timestamp | Last update |

**Indexes**:
- `idx_complaints_student_id`
- `idx_complaints_category`
- `idx_complaints_status`

---

### notifications
**Purpose**: System notifications for users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to user_directory (NOT NULL) |
| title | text | Notification title |
| message | text | Notification body |
| is_read | boolean | Read/unread status |
| notification_type | text | request_update, approval, complaint, account, general |
| related_request_id | uuid | FK to requests (optional, for context) |
| created_at | timestamp | Sent at |
| updated_at | timestamp | |

**Example notifications**:
- "Your leave request was approved by your mentor"
- "New complaint received from student XYZ"
- "Your account has been approved. Please set your password."
- "Your outing request was rejected: Inconsistent timeline"

**Indexes**:
- `idx_notifications_user_id`
- `idx_notifications_is_read`
- `idx_notifications_notification_type`

**RLS**:
- Users see their own notifications
- Admins see all (for debugging/audit)

---

## Views

### user_profile_view
**Purpose**: Unified read model across all profile tables

**Columns** (selected):
- id, email, role, status, account_status (from user_directory)
- full_name, mobile_number, gender, institute (from role-specific table)
- mentor_id, advisor_id, hod_id, principal_id (from students_details if applicable)
- mentor_name, advisor_name, hod_name, principal_name (joined names)

**Query Pattern**:
```sql
select 
  ud.id, ud.email, ud.role, ud.status,
  coalesce(sd.full_name, st.full_name, hd.full_name, pr.full_name, wd.full_name) as full_name,
  ...
from public.user_directory ud
left join public.students_details sd on ud.id = sd.user_id
left join public.staff_details st on ud.id = st.user_id
left join public.hod_details hd on ud.id = hd.user_id
left join public.principal_details pr on ud.id = pr.user_id
left join public.warden_details wd on ud.id = wd.user_id
```

---

### all_requests_view
**Purpose**: Unified leave + outing requests

**Columns**:
- request_type (leave or outing)
- id, student_id, student_email, destination, reason, status...
- departure_datetime, return_datetime (NULL for leave)
- departure_date, return_date (NULL for outing)

**Use Case**: Dashboard widgets showing all recent requests regardless of type

---

## RLS Security Model

### Authentication Check
```sql
auth.jwt() ->> 'email'  -- Gets current user's email from JWT
```

### User ID Lookup
```sql
select id from user_directory 
where lower(email) = lower(auth.jwt() ->> 'email')
```

### Admin Check
```sql
is_current_user_admin()  -- Function checks role='admin' + approved status
```

### Policy Layers

**Layer 1: User Level**
- Students see own data (student_id = current_user_id)
- Faculty see assigned students
- Admins see all

**Layer 2: Request Level**
- Students see own requests
- Approvers see requests assigned to them
- Admins see all

**Layer 3: Account Level**
- Users see own approval status
- Admins see all pending approvals

---

## Query Examples

### As Student: Get My Leave Requests
```sql
SELECT * FROM leave_requests
WHERE student_id = get_current_user_id()
ORDER BY created_at DESC;
```

### As Mentor: Get Pending Requests I Should Approve
```sql
SELECT * FROM leave_requests
WHERE current_approver = 'mentor'
  AND mentor_id = get_current_user_id()
  AND status = 'pending'
ORDER BY created_at ASC;
```

### As Admin: Get All Pending Account Approvals
```sql
SELECT ar.*, ud.email, ud.role
FROM approval_requests ar
JOIN user_directory ud ON ar.user_id = ud.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at ASC;
```

### Administrator: Approve a Student's Leave
```sql
BEGIN;
  -- Update request status
  UPDATE leave_requests
  SET 
    status = 'approved',
    approved_by = 'admin',
    current_approver = NULL
  WHERE id = 'leave-123';

  -- Create notification
  INSERT INTO notifications (user_id, title, message)
  SELECT student_id, 'Leave Approved', 
    'Your leave request was approved'
  FROM leave_requests WHERE id = 'leave-123';
COMMIT;
```

### Staff: Reject an Outing with Reason
```sql
BEGIN;
  UPDATE outing_requests
  SET 
    status = 'rejected',
    rejected_by = get_current_user_id()::text,
    rejection_reason = 'Return time conflicts with exam'
  WHERE id = 'outing-456';

  INSERT INTO notifications (user_id, title, message)
  SELECT student_id, 'Request Declined',
    'Your outing request was declined: Return time conflicts with exam'
  FROM outing_requests WHERE id = 'outing-456';
COMMIT;
```

### Student: Submit a Complaint
```sql
INSERT INTO complaints (
  student_id, category, description, status
) 
VALUES (
  get_current_user_id(), 
  'facilities',
  'Hot water not available in Block A',
  'open'
);
```

---

## Migration Order for Deployment

1. **Run migrations in this order**:
   ```
   1. 20260407_create_registration_otps.sql
   2. 20260407_fix_user_directory_admin_rls.sql
   3. 20260407_split_user_profiles.sql
   4. 20260407_create_pass_requests.sql
   5. 20260407_database_reorganization.sql  ← Latest
   ```

2. **Deploy edge functions**:
   - `registration-otp` (sends/verifies OTP)
   - `admin-user-mailer` (sends password-creation emails)

3. **Verify**:
   - All tables exist
   - Backfill completed (check student_id populated in leave_requests/outing_requests)
   - RLS policies enabled
   - No orphaned rows

---

## Data Integrity Notes

### Foreign Key Constraints
- All profile tables reference user_directory (CASCADE on delete)
- All request tables reference user_directory (CASCADE on delete)
- Approvals reference requests and users

### Unique Constraints
- user_directory: email is unique
- registration_otp_challenges: email is primary key (one OTP per email at a time)
- profile tables: user_id is unique (one profile per user)
- staff/hod/principal/warden: email is unique

### Denormalized Fields (for performance)
- student_email, student_name in leave_requests/outing_requests
- Email addresses stored in faculty assignment fields
- **Note**: If email changes, these must be updated (consider triggers for future optimization)

---

## Performance Optimization Tips

1. **For large datasets**, use indexes on:
   - `(status, created_at)` - Recent requests
   - `(current_approver, status)` - Pending approvals
   - `(student_id, created_at)` - Student's request history

2. **Materialized views** can be used for:
   - Admin dashboards aggregating stats
   - Request approval metrics

3. **Consider partitioning** on:
   - `created_at` for leave_requests/outing_requests (by month)

---

**Last Updated**: 2026-04-07
**Schema Version**: 2.1
**Status**: Fully Reorganized and Optimized
