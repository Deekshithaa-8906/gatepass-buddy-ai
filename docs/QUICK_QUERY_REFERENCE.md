# Database Quick Reference Guide

## Common Queries by Role

### 👨‍🎓 STUDENT QUERIES

#### Get My Profile
```sql
select * from public.user_profile_view
where id = get_current_user_id();
```

#### Get My Leave Requests
```sql
select * from public.leave_requests
where student_id = get_current_user_id()
order by created_at desc;
```

#### Get My Outing Requests
```sql
select * from public.outing_requests
where student_id = get_current_user_id()
order by created_at desc;
```

#### Get My Pending Requests
```sql
select 
  'leave' as type, id, destination, reason, status, created_at
from public.leave_requests
where student_id = get_current_user_id() and status = 'pending'
union all
select 
  'outing' as type, id, destination, reason, status, created_at
from public.outing_requests
where student_id = get_current_user_id() and status = 'pending'
order by created_at desc;
```

#### Get My Notifications
```sql
select * from public.notifications
where user_id = get_current_user_id()
order by created_at desc
limit 20;
```

#### Mark Notification as Read
```sql
update public.notifications
set is_read = true
where id = 'notification-uuid'
  and user_id = get_current_user_id();
```

#### File a Complaint
```sql
insert into public.complaints (
  student_id, category, description, status
) values (
  get_current_user_id(),
  'facilities',  -- categories: harassment, facilities, discipline, other
  'Describe your complaint here...',
  'open'
);
```

#### Get My Complaints
```sql
select * from public.complaints
where student_id = get_current_user_id()
order by created_at desc;
```

---

### 👨‍🏫 STAFF/MENTOR QUERIES

#### Get My Students
```sql
select 
  sd.id, sd.full_name, sd.email, sd.register_number,
  sd.hostel_block, sd.room_number, ud.status
from public.students_details sd
join public.user_directory ud on sd.user_id = ud.id
where sd.mentor_id = get_current_user_id()
order by sd.full_name;
```

#### Get Pending Leave Requests I Should Approve
```sql
select 
  lr.id, lr.student_name, lr.student_email,
  lr.departure_date, lr.return_date,
  lr.reason, lr.created_at
from public.leave_requests lr
where lr.mentor_id = get_current_user_id()
  and lr.current_approver = 'mentor'
  and lr.status = 'pending'
order by lr.created_at asc;
```

#### Get Pending Outing Requests I Should Approve
```sql
select 
  or_.id, or_.student_name, or_.student_email,
  or_.departure_datetime, or_.return_datetime,
  or_.reason, or_.created_at
from public.outing_requests or_
where or_.mentor_id = get_current_user_id()
  and or_.current_approver = 'mentor'
  and or_.status = 'pending'
order by or_.created_at asc;
```

#### Approve a Leave Request
```python
# Python example using supabase-py
import supabase from 'supabase'

supabase_client = supabase.create_client(url, key)

# Update the request
supabase_client.table('leave_requests').update(
  {
    'status': 'approved',
    'mentor_status': 'approved',
    'current_approver': 'advisor'  # or None if final
  }
).eq('id', 'leaf-request-uuid').execute()

# Notify student
supabase_client.table('notifications').insert(
  {
    'user_id': student_id,
    'title': 'Leave Request Approved',
    'message': f'Your leave from {start_date} to {end_date} was approved by mentor.',
    'notification_type': 'request_update',
    'related_request_id': 'leaf-request-uuid'
  }
).execute()

# Track in approvals
supabase_client.table('request_approvals').insert(
  {
    'request_id': 'leaf-request-uuid',
    'approver_id': get_current_user_id(),
    'approver_role': 'mentor',
    'status': 'approved',
    'reason': 'Looks good'
  }
).execute()
```

#### Reject a Request with Reason
```sql
update public.leave_requests
set 
  status = 'rejected',
  mentor_status = 'rejected',
  rejected_by = 'mentor',
  rejection_reason = 'Your dates clash with exam schedule'
where id = 'leaf-request-uuid';

-- Then notify student (see above)
```

#### Get Request History (My Approvals)
```sql
select 
  ra.created_at,
  ra.approver_role,
  ra.status,
  ra.reason,
  lr.student_name,
  lr.destination
from public.request_approvals ra
join public.leave_requests lr on ra.request_id = lr.id
where ra.approver_id = get_current_user_id()
order by ra.created_at desc;
```

---

### 👑 HOD/PRINCIPAL QUERIES

#### Get All Students in My Department
```sql
select 
  sd.id, sd.full_name, sd.register_number,
  sd.email, sd.hostel_block, ud.status
from public.students_details sd
join public.user_directory ud on sd.user_id = ud.id
where sd.department = (
  select department from public.hod_details 
  where user_id = get_current_user_id()
)
order by sd.full_name;
```

#### Get Pending Requests for HOD Approval
```sql
select 
  'leave' as type, id, student_name, destination, reason, 
  created_at, current_approver
from public.leave_requests
where hod_id = get_current_user_id()
  and current_approver = 'hod'
  and status = 'pending'
union all
select 
  'outing' as type, id, student_name, destination, reason,
  created_at, current_approver
from public.outing_requests
where hod_id = get_current_user_id()
  and current_approver = 'hod'
  and status = 'pending'
order by created_at asc;
```

#### Get Complaints from My Students
```sql
select 
  c.id, c.student_id, c.category, c.description,
  c.status, c.escalated_at, c.created_at,
  sd.full_name, sd.email
from public.complaints c
join public.students_details sd on c.student_id = sd.user_id
where sd.hod_id = get_current_user_id()
order by c.created_at desc;
```

#### Escalate a Complaint
```sql
update public.complaints
set 
  status = 'escalated',
  escalated_at = now()
where id = 'complaint-uuid'
  and student_id in (
    select user_id from public.students_details 
    where hod_id = get_current_user_id()
  );
```

---

### 👨‍💼 ADMIN QUERIES

#### Get All Pending Account Approvals
```sql
select 
  ar.id, ar.user_id, ar.email, ar.name, ar.role, ar.department,
  ar.created_at, ud.status
from public.approval_requests ar
join public.user_directory ud on ar.user_id = ud.id
where ar.status = 'pending'
order by ar.created_at asc;
```

#### Approve a User Account
```python
# Step 1: Update approval_requests
supabase.table('approval_requests').update({
  'status': 'approved',
  'approved_by': get_current_user_id()
}).eq('user_id', user_id).execute()

# Step 2: Update user_directory
supabase.table('user_directory').update({
  'access_status': 'approved',
  'status': 'approved'
}).eq('id', user_id).execute()

# Step 3: Trigger email (edge function)
# admin_user_mailer will send password setup email

# Step 4: Notify user
supabase.table('notifications').insert({
  'user_id': user_id,
  'title': 'Account Approved',
  'message': 'Your account has been approved. Check email for password setup link.',
  'notification_type': 'account'
}).execute()
```

#### Reject a User Account
```sql
update public.approval_requests
set 
  status = 'rejected',
  approved_by = get_current_user_id(),
  rejection_reason = 'Department verification pending'
where user_id = 'user-uuid';

update public.user_directory
set access_status = 'rejected'
where id = 'user-uuid';
```

#### Get All Requests with Approval Status
```sql
select 
  'leave' as type,
  lr.id, lr.student_name, lr.status,
  lr.mentor_status, lr.advisor_status, lr.hod_status,
  lr.created_at
from public.leave_requests lr
union all
select 
  'outing' as type,
  or_.id, or_.student_name, or_.status,
  or_.mentor_status, or_.advisor_status, or_.hod_status,
  or_.created_at
from public.outing_requests or_
order by created_at desc
limit 100;
```

#### Get System Statistics
```sql
select
  (select count(*) from public.user_directory where role = 'student') as total_students,
  (select count(*) from public.user_directory where role = 'staff') as total_staff,
  (select count(*) from public.leave_requests where status = 'pending') as pending_leave,
  (select count(*) from public.outing_requests where status = 'pending') as pending_outing,
  (select count(*) from public.complaints where status = 'open') as open_complaints,
  (select count(*) from public.approval_requests where status = 'pending') as pending_approvals;
```

#### Cleanup Old OTP Entries (30+ days)
```sql
delete from public.registration_otp_challenges
where created_at < now() - interval '30 days'
  and verified_at is null;  -- Only delete unverified OTPs
```

#### Get All Users List
```sql
select 
  ud.id, ud.email, ud.role, ud.access_status, ud.account_status,
  ud.password_created, ud.created_at,
  coalesce(sd.full_name, st.full_name, hd.full_name, 
           pr.full_name, w.full_name) as full_name
from public.user_directory ud
left join public.students_details sd on ud.id = sd.user_id
left join public.staff_details st on ud.id = st.user_id
left join public.hod_details hd on ud.id = hd.user_id
left join public.principal_details pr on ud.id = pr.user_id
left join public.warden_details w on ud.id = w.user_id
order by ud.created_at desc;
```

---

### 🏰 WARDEN QUERIES

#### Get Students in My Hostel Block
```sql
-- Assuming warden_details has hostel_block column
select 
  sd.id, sd.full_name, sd.email, sd.register_number,
  sd.room_number, ud.status
from public.students_details sd
join public.user_directory ud on sd.user_id = ud.id
where sd.hostel_block = (
  select hostel_block from public.warden_details
  where user_id = get_current_user_id()
)
order by sd.room_number;
```

#### Track Check-In/Out (Future Field)
```sql
-- Currently not in schema, but structure ready:
-- Could add to leave_requests/outing_requests:
-- - checked_out_datetime
-- - checked_in_datetime
-- - warden_id

-- Query would be:
-- select * from public.outing_requests
-- where warden_id = get_current_user_id()
-- and status = 'approved'
-- and return_datetime > now()
```

---

## Useful Helper Functions

### Get Current User ID
```sql
select public.get_current_user_id();
```

### Get Current User Role
```sql
select public.get_current_user_role();
```

### Check if Current User is Admin
```sql
select public.is_current_user_admin();
```

### Check if User is Current User
```sql
select case
  when lower(email) = lower(auth.jwt() ->> 'email') then true
  else false
end as is_current_user
from public.user_directory
where id = 'some-user-uuid';
```

---

## Real-Time Subscriptions (React)

### Subscribe to My Leave Requests
```typescript
const subscription = supabase
  .from('leave_requests')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Clean up
supabase.removeSubscription(subscription)
```

### Subscribe to Requests I Should Approve
```typescript
const subscription = supabase
  .from('leave_requests')
  .on('UPDATE', payload => {
    // Check if current_approver is 'mentor' and mentor_id is me
  })
  .subscribe()
```

---

## Bulk Operations

### Bulk Approve Requests (Admin)
```sql
update public.leave_requests
set 
  status = 'approved',
  current_approver = null,
  approved_by = 'admin'
where id in (
  'uuid-1', 'uuid-2', 'uuid-3'...
);
```

### Bulk Send Notifications
```sql
insert into public.notifications (user_id, title, message, notification_type)
select distinct student_id, 'System Maintenance', 
  'System will be down for maintenance tomorrow 2-4 AM',
  'general'
from public.students_details;
```

---

## Transaction Example (Complex Operation)

```sql
begin;

-- Step 1: Update request
update public.leave_requests
set status = 'approved', current_approver = null
where id = 'leaf-uuid';

-- Step 2: Track approval
insert into public.request_approvals (
  request_id, approver_id, approver_role, status, reason
) values (
  'leaf-uuid',
  (select id from user_directory where lower(email) = lower('mentor@example.com')),
  'mentor',
  'approved',
  'Duration looks good'
);

-- Step 3: Notify student
insert into public.notifications (user_id, title, message)
select student_id, 'Approved', 'Your leave was approved'
from public.leave_requests where id = 'leaf-uuid';

-- Commit all or rollback if any fails
commit;
```

---

## Performance Tips

1. **Always use indexed columns** in WHERE clauses:
   - student_id, mentor_id (foreign keys)
   - status, created_at (for filtering)

2. **Avoid N+1 queries**: Use joins instead of loops

3. **Paginate large results**:
   ```sql
   select * from public.leave_requests
   where student_id = 'xxx'
   order by created_at desc
   limit 20 offset 40;  -- Page 3
   ```

4. **Use views** for complex joins

5. **Index your filters** before adding WHERE clause

---

## Emergency Queries

### Check Database Health
```sql
select 
  current_database(),
  current_schema(),
  (select count(*) from pg_stat_statements) as queries_tracked;
```

### Find Slow Queries
```sql
select 
  query, calls, mean_time, max_time
from pg_stat_statements
where query not like '%pg_stat_statements%'
order by mean_time desc
limit 10;
```

### Check Table Sizes
```sql
select 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
from pg_tables
where schemaname = 'public'
order by pg_total_relation_size('public.' || tablename) desc;
```

---

**Tip**: Bookmark this doc for quick reference during development! 🚀
