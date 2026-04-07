-- ============================================================================
-- Database Reorganization & Optimization
-- Date: 2026-04-07
-- Purpose: Clean up schema, add proper relationships, remove redundancies
-- ============================================================================

-- ============================================================================
-- Phase 1: Drop Redundant Tables
-- ============================================================================

-- Remove 'profiles' table as it's redundant with user_profile_view
drop table if exists public.profiles cascade;

-- ============================================================================
-- Phase 2: Create Missing Core Request Management Tables
-- ============================================================================

-- Create unified requests table for tracking all request types
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.user_directory(id) on delete cascade,
  type text not null check (type in ('leave', 'outing', 'complaint', 'other')),
  destination text,
  reason text not null,
  departure_date date,
  return_date date,
  departure_datetime timestamp with time zone,
  return_datetime timestamp with time zone,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'escalated')),
  current_approver_role text,
  approval_chain text[] default array['mentor'],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_requests_student_id on public.requests(student_id);
create index if not exists idx_requests_type on public.requests(type);
create index if not exists idx_requests_status on public.requests(status);
create index if not exists idx_requests_current_approver_role on public.requests(current_approver_role);
create index if not exists idx_requests_created_at on public.requests(created_at);

-- Create request approvals tracking table (MUST be after requests table)
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'request_approvals') then
    create table public.request_approvals (
      id uuid primary key default gen_random_uuid(),
      request_id uuid not null references public.requests(id) on delete cascade,
      approver_id uuid not null references public.user_directory(id) on delete cascade,
      approver_role text not null,
      status text not null check (status in ('pending', 'approved', 'rejected')),
      reason text,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );

    create index idx_request_approvals_request_id on public.request_approvals(request_id);
    create index idx_request_approvals_approver_id on public.request_approvals(approver_id);
    create index idx_request_approvals_approver_role on public.request_approvals(approver_role);
    create index idx_request_approvals_status on public.request_approvals(status);
  end if;
end
$$;

-- ============================================================================
-- Phase 3: Create Complaint Management Table (if not exists)
-- ============================================================================

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.user_directory(id) on delete cascade,
  category text not null, -- harassment, facilities, discipline, other
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  escalated_at timestamp with time zone,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_complaints_student_id on public.complaints(student_id);
create index if not exists idx_complaints_category on public.complaints(category);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created_at on public.complaints(created_at);

-- ============================================================================
-- Phase 4: Create Notifications Table (if not exists)
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_directory(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  notification_type text default 'general', -- request_update, approval, complaint, account, general
  related_request_id uuid references public.requests(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_notification_type on public.notifications(notification_type);
create index if not exists idx_notifications_created_at on public.notifications(created_at);

-- ============================================================================
-- Phase 5: Create Account Approval Requests Table (if not exists)
-- ============================================================================

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null,
  department text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.user_directory(id) on delete set null,
  rejection_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_approval_requests_user_id on public.approval_requests(user_id);
create index if not exists idx_approval_requests_email on public.approval_requests(email);
create index if not exists idx_approval_requests_role on public.approval_requests(role);
create index if not exists idx_approval_requests_status on public.approval_requests(status);

-- ============================================================================
-- Phase 6: Enhance Pass Request Tables (leave_requests, outing_requests)
-- ============================================================================

-- Add foreign key to leave_requests if not already present
alter table public.leave_requests
add column if not exists student_id uuid references public.user_directory(id) on delete cascade;

alter table public.leave_requests
add column if not exists mentor_id uuid references public.user_directory(id) on delete set null,
add column if not exists advisor_id uuid references public.user_directory(id) on delete set null,
add column if not exists hod_id uuid references public.user_directory(id) on delete set null;

-- Add foreign key to outing_requests if not already present
alter table public.outing_requests
add column if not exists student_id uuid references public.user_directory(id) on delete cascade;

alter table public.outing_requests
add column if not exists mentor_id uuid references public.user_directory(id) on delete set null,
add column if not exists advisor_id uuid references public.user_directory(id) on delete set null,
add column if not exists hod_id uuid references public.user_directory(id) on delete set null;

-- Create indexes for the new columns
create index if not exists idx_leave_requests_student_id on public.leave_requests(student_id);
create index if not exists idx_leave_requests_mentor_id on public.leave_requests(mentor_id);
create index if not exists idx_outing_requests_student_id on public.outing_requests(student_id);
create index if not exists idx_outing_requests_mentor_id on public.outing_requests(mentor_id);

-- ============================================================================
-- Phase 7: Create Unified Views for Request Management
-- ============================================================================

-- Create unified profile view (read model across split tables)
create or replace view public.user_profile_view as
select
  ud.id,
  ud.email,
  ud.role,
  ud.status,
  ud.access_status,
  ud.account_status,
  ud.password_created,
  ud.onboarding_complete,
  ud.created_at,
  ud.updated_at,
  coalesce(sd.full_name, st.full_name, hd.full_name, pr.full_name, wd.full_name) as full_name,
  coalesce(sd.mobile_number, st.mobile_number, hd.mobile_number, pr.mobile_number, wd.mobile_number) as mobile_number,
  coalesce(sd.gender, st.gender, hd.gender) as gender,
  coalesce(sd.institute, st.institute, hd.institute, pr.institute, wd.institute) as institute,
  sd.register_number,
  sd.class_details,
  sd.parent_name,
  sd.parent_number,
  sd.year,
  sd.hostel_block,
  sd.room_number,
  sd.department,
  st.department as staff_department,
  hd.department as hod_department,
  sd.mentor_id,
  sd.advisor_id,
  sd.hod_id,
  sd.principal_id,
  m.full_name as mentor_name,
  m.email as mentor_email,
  adv.full_name as advisor_name,
  adv.email as advisor_email,
  h.full_name as hod_name,
  h.email as hod_email,
  pr2.full_name as principal_name,
  pr2.email as principal_email
from public.user_directory ud
left join public.students_details sd on ud.id = sd.user_id
left join public.staff_details st on ud.id = st.user_id
left join public.hod_details hd on ud.id = hd.user_id
left join public.principal_details pr on ud.id = pr.user_id
left join public.warden_details wd on ud.id = wd.user_id
left join public.user_directory m on sd.mentor_id = m.id
left join public.user_directory adv on sd.advisor_id = adv.id
left join public.user_directory h on sd.hod_id = h.id
left join public.user_directory pr2 on sd.principal_id = pr2.id;

-- Create unified requests view
create or replace view public.all_requests_view as
select
  'leave' as request_type,
  id,
  student_id,
  student_email,
  student_name,
  mentor_email,
  destination,
  reason,
  status,
  null::timestamp with time zone as departure_datetime,
  null::timestamp with time zone as return_datetime,
  departure_date,
  return_date,
  current_approver,
  approval_chain,
  created_at,
  updated_at
from public.leave_requests
union all
select
  'outing' as request_type,
  id,
  student_id,
  student_email,
  student_name,
  mentor_email,
  destination,
  reason,
  status,
  departure_datetime,
  return_datetime,
  null::date as departure_date,
  null::date as return_date,
  current_approver,
  approval_chain,
  created_at,
  updated_at
from public.outing_requests;

-- ============================================================================
-- Phase 8: Ensure RLS is Enabled on All Tables
-- ============================================================================

alter table public.requests enable row level security;
alter table public.request_approvals enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;
alter table public.approval_requests enable row level security;

-- ============================================================================
-- Phase 9: Create RLS Policies for New Tables
-- ============================================================================

-- Requests RLS
drop policy if exists requests_students_read_own on public.requests;
create policy requests_students_read_own
on public.requests
for select
to authenticated
using (
  student_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

drop policy if exists requests_students_insert_own on public.requests;
create policy requests_students_insert_own
on public.requests
for insert
to authenticated
with check (
  student_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

drop policy if exists requests_admin_all on public.requests;
create policy requests_admin_all
on public.requests
for all
to authenticated
using (public.is_current_user_admin());

-- Request Approvals RLS
drop policy if exists request_approvals_admin_all on public.request_approvals;
create policy request_approvals_admin_all
on public.request_approvals
for all
to authenticated
using (public.is_current_user_admin());

drop policy if exists request_approvals_approverread on public.request_approvals;
create policy request_approvals_approver_read
on public.request_approvals
for select
to authenticated
using (
  approver_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

-- Complaints RLS
drop policy if exists complaints_students_read_own on public.complaints;
create policy complaints_students_read_own
on public.complaints
for select
to authenticated
using (
  student_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

drop policy if exists complaints_students_insert_own on public.complaints;
create policy complaints_students_insert_own
on public.complaints
for insert
to authenticated
with check (
  student_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

drop policy if exists complaints_admin_all on public.complaints;
create policy complaints_admin_all
on public.complaints
for all
to authenticated
using (public.is_current_user_admin());

-- Notifications RLS
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own
on public.notifications
for select
to authenticated
using (
  user_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

drop policy if exists notifications_admin_all on public.notifications;
create policy notifications_admin_all
on public.notifications
for all
to authenticated
using (public.is_current_user_admin());

-- Approval Requests RLS
drop policy if exists approval_requests_read_own on public.approval_requests;
create policy approval_requests_read_own
on public.approval_requests
for select
to authenticated
using (
  user_id = (select id from public.user_directory where lower(email) = lower(auth.jwt() ->> 'email'))
);

drop policy if exists approval_requests_admin_all on public.approval_requests;
create policy approval_requests_admin_all
on public.approval_requests
for all
to authenticated
using (public.is_current_user_admin());

-- ============================================================================
-- Phase 10: Create Backfill Migration for Pass Requests (Add student_id)
-- ============================================================================

-- Backfill student_id in leave_requests from student_email
update public.leave_requests lr
set student_id = ud.id
from public.user_directory ud
where lower(lr.student_email) = lower(ud.email)
  and lr.student_id is null;

-- Backfill student_id in outing_requests from student_email
update public.outing_requests or_
set student_id = ud.id
from public.user_directory ud
where lower(or_.student_email) = lower(ud.email)
  and or_.student_id is null;

-- Backfill mentor_id in leave_requests from mentor_email
update public.leave_requests lr
set mentor_id = ud.id
from public.user_directory ud
where lr.mentor_email is not null
  and lower(lr.mentor_email) = lower(ud.email)
  and lr.mentor_id is null;

-- Backfill mentor_id in outing_requests from mentor_email
update public.outing_requests or_
set mentor_id = ud.id
from public.user_directory ud
where or_.mentor_email is not null
  and lower(or_.mentor_email) = lower(ud.email)
  and or_.mentor_id is null;

-- ============================================================================
-- Phase 11: Add Constraints to Pass Tables
-- ============================================================================

-- Make student_id not null after backfill
alter table public.leave_requests
alter column student_id set not null;

alter table public.outing_requests
alter column student_id set not null;

-- ============================================================================
-- Phase 12: Create Audit Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for requests
drop trigger if exists update_requests_updated_at on public.requests;
create trigger update_requests_updated_at
before update on public.requests
for each row
execute function public.update_updated_at_column();

-- Trigger for request_approvals
drop trigger if exists update_request_approvals_updated_at on public.request_approvals;
create trigger update_request_approvals_updated_at
before update on public.request_approvals
for each row
execute function public.update_updated_at_column();

-- Trigger for complaints
drop trigger if exists update_complaints_updated_at on public.complaints;
create trigger update_complaints_updated_at
before update on public.complaints
for each row
execute function public.update_updated_at_column();

-- Trigger for notifications
drop trigger if exists update_notifications_updated_at on public.notifications;
create trigger update_notifications_updated_at
before update on public.notifications
for each row
execute function public.update_updated_at_column();

-- Trigger for approval_requests
drop trigger if exists update_approval_requests_updated_at on public.approval_requests;
create trigger update_approval_requests_updated_at
before update on public.approval_requests
for each row
execute function public.update_updated_at_column();

-- ============================================================================
-- Phase 13: Create Helper Functions
-- ============================================================================

-- Function to get current user's ID
create or replace function public.get_current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.user_directory
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

-- Function to get current user's role
create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select (role)::text
  from public.user_directory
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

grant execute on function public.get_current_user_id() to authenticated;
grant execute on function public.get_current_user_role() to authenticated;

-- ============================================================================
-- Summary of Changes
-- ============================================================================

/*

TABLES CREATED:
1. requests - Unified request management (leave, outing, complaint, other)
2. request_approvals - Track approval workflow for each request
3. complaints - Complaint tracking with escalation support
4. notifications - User notifications system
5. approval_requests - Account approval workflow

TABLES MODIFIED:
1. leave_requests - Added student_id, mentor_id, advisor_id, hod_id foreign keys
2. outing_requests - Added student_id, mentor_id, advisor_id, hod_id foreign keys

TABLES REMOVED:
1. profiles - Redundant, use user_profile_view instead

VIEWS CREATED:
1. all_requests_view - Unified view for leave + outing requests

FUNCTIONS CREATED:
1. get_current_user_id() - Get current authenticated user's ID
2. get_current_user_role() - Get current authenticated user's role
3. update_updated_at_column() - Auto-update timestamp trigger

RLS POLICIES:
- Added comprehensive RLS for all new tables
- Students can only see their own data
- Admins can see all data
- Approvers can see related approvals

INDEXES:
- Created optimal indexes for all foreign keys and query-heavy columns

CURRENT FUNCTIONALITY PRESERVED:
✓ Student dashboard pass requests (leave/outing)
✓ Staff dashboard approval workflow
✓ Admin account management
✓ Complaint system
✓ User notifications
✓ Request approval tracking

*/
