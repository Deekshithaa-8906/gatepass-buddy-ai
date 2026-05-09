-- PassNTrack full rebuild (schema + RLS + views + storage)
-- Safe for fresh projects. Uses IF NOT EXISTS and DROP POLICY guards.

begin;

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'hostel_block_type') then
    create type hostel_block_type as enum ('boys', 'girls', 'mixed', 'unknown');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'complaint_status_enum') then
    create type complaint_status_enum as enum (
      'open',
      'in_progress',
      'resolved',
      'closed',
      'escalated'
    );
  end if;
end $$;

-- Helper function for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Core user directory (auth-linked)
create table if not exists public.user_directory (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  role text not null,
  status text default 'pending',
  access_status text default 'pending',
  account_status text default 'inactive',
  password_created boolean default false,
  onboarding_complete boolean default false,
  full_name text,
  mobile_number text,
  gender text,
  institute text,
  department text,
  register_number text,
  class_details text,
  parent_name text,
  parent_mobile text,
  parent_number text,
  year text,
  year_of_study text,
  hostel_block text,
  room_number text,
  mentor text,
  mentor_email text,
  advisor text,
  advisor_email text,
  hod text,
  hod_email text,
  principal text,
  principal_email text,
  profile_image_url text,
  institution_id uuid,
  department_id uuid,
  block_id uuid,
  room_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_directory_role_institute_department
  on public.user_directory (role, institute, department);
create index if not exists idx_user_directory_email on public.user_directory (email);

-- Core admin config tables
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  institution_type text check (institution_type in ('college', 'university')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (institution_id, name)
);

create table if not exists public.hostel_blocks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  block_type hostel_block_type not null default 'unknown',
  capacity int4 not null default 0,
  floors int4,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (institution_id, name)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.hostel_blocks(id) on delete cascade,
  room_number text not null,
  capacity int4 not null default 0,
  occupied_count int4 not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (block_id, room_number)
);

create table if not exists public.warden_assignments (
  id uuid primary key default gen_random_uuid(),
  warden_id uuid not null references public.user_directory(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  block_id uuid not null references public.hostel_blocks(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz default now(),
  unique (warden_id, block_id)
);

-- Profile detail tables
create table if not exists public.students_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.user_directory(id) on delete cascade,
  parent_number text,
  parent_name text,
  class_details text,
  full_name text,
  mobile_number text,
  gender text,
  institute text,
  year text,
  department text,
  register_number text,
  hostel_block text,
  room_number text,
  mentor_id uuid references public.user_directory(id),
  advisor_id uuid references public.user_directory(id),
  hod_id uuid references public.user_directory(id),
  principal_id uuid references public.user_directory(id),
  institution_id uuid references public.institutions(id),
  department_id uuid references public.departments(id),
  block_id uuid references public.hostel_blocks(id),
  room_id uuid references public.rooms(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.staff_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  full_name text,
  email text unique,
  mobile_number text,
  gender text,
  department text,
  institute text,
  students uuid[] default '{}',
  institution_id uuid references public.institutions(id),
  department_id uuid references public.departments(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hod_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  full_name text,
  email text unique,
  mobile_number text,
  gender text,
  department text,
  institute text,
  students uuid[] default '{}',
  institution_id uuid references public.institutions(id),
  department_id uuid references public.departments(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.principal_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  full_name text,
  email text unique,
  institute text,
  mobile_number text,
  institution_id uuid references public.institutions(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.warden_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  full_name text,
  email text unique,
  institute text,
  mobile_number text,
  institution_id uuid references public.institutions(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_students_details_user_id on public.students_details(user_id);
create index if not exists idx_students_details_register_number on public.students_details(register_number);
create index if not exists idx_staff_details_user_id on public.staff_details(user_id);
create index if not exists idx_hod_details_user_id on public.hod_details(user_id);
create index if not exists idx_principal_details_user_id on public.principal_details(user_id);
create index if not exists idx_warden_details_user_id on public.warden_details(user_id);

-- Requests tables (leave + outing)
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_email text not null,
  student_name text not null,
  mentor_email text,
  departure_date date not null,
  return_date date not null,
  destination text not null,
  reason text not null,
  status text not null default 'pending',
  mentor_status text default 'pending',
  advisor_status text default 'pending',
  hod_status text default 'pending',
  approval_chain text[] default array['mentor'],
  current_approver text default 'mentor',
  approved_by text,
  rejected_by text,
  rejection_reason text,
  student_id uuid references public.user_directory(id) on delete set null,
  mentor_id uuid references public.user_directory(id) on delete set null,
  advisor_id uuid references public.user_directory(id) on delete set null,
  hod_id uuid references public.user_directory(id) on delete set null,
  departure_datetime timestamptz,
  return_datetime timestamptz,
  duration_minutes int4,
  is_emergency boolean default false,
  is_medical boolean default false,
  current_stage text default 'mentor',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.outing_requests (
  id uuid primary key default gen_random_uuid(),
  student_email text not null,
  student_name text not null,
  mentor_email text,
  departure_datetime timestamptz not null,
  return_datetime timestamptz not null,
  destination text not null,
  reason text not null,
  status text not null default 'pending',
  mentor_status text default 'pending',
  advisor_status text default 'pending',
  hod_status text default 'pending',
  approval_chain text[] default array['mentor'],
  current_approver text default 'mentor',
  approved_by text,
  rejected_by text,
  rejection_reason text,
  student_id uuid references public.user_directory(id) on delete set null,
  mentor_id uuid references public.user_directory(id) on delete set null,
  advisor_id uuid references public.user_directory(id) on delete set null,
  hod_id uuid references public.user_directory(id) on delete set null,
  departure_date date,
  return_date date,
  duration_minutes int4,
  is_emergency boolean default false,
  is_medical boolean default false,
  current_stage text default 'mentor',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_outing_requests_student_email on public.outing_requests(student_email);
create index if not exists idx_outing_requests_mentor_email on public.outing_requests(mentor_email);
create index if not exists idx_outing_requests_status on public.outing_requests(status);
create index if not exists idx_outing_requests_current_approver on public.outing_requests(current_approver);
create index if not exists idx_outing_requests_student_id on public.outing_requests(student_id);

create index if not exists idx_leave_requests_student_email on public.leave_requests(student_email);
create index if not exists idx_leave_requests_mentor_email on public.leave_requests(mentor_email);
create index if not exists idx_leave_requests_status on public.leave_requests(status);
create index if not exists idx_leave_requests_current_approver on public.leave_requests(current_approver);
create index if not exists idx_leave_requests_student_id on public.leave_requests(student_id);

-- Approval history tables
create table if not exists public.request_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  approver_id uuid references public.user_directory(id) on delete set null,
  approver_role text not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'reconsidered')),
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_request_approvals_request_id on public.request_approvals(request_id);
create index if not exists idx_request_approvals_approver_id on public.request_approvals(approver_id);
create index if not exists idx_request_approvals_status on public.request_approvals(status);

create table if not exists public.pass_request_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  request_type text not null check (request_type in ('leave', 'outing')),
  approver_id uuid references public.user_directory(id) on delete set null,
  approver_email text,
  approver_name text,
  approver_role text not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'reconsidered')),
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_pass_request_approvals_request_id on public.pass_request_approvals(request_id);
create index if not exists idx_pass_request_approvals_approver_id on public.pass_request_approvals(approver_id);

-- Complaints
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.user_directory(id) on delete cascade,
  category text not null,
  description text not null,
  status complaint_status_enum not null default 'open',
  assigned_to uuid references public.user_directory(id) on delete set null,
  forwarded_by_role text,
  forwarded_by_id uuid references public.user_directory(id) on delete set null,
  escalated_at timestamptz,
  resolved_at timestamptz,
  closed_reason text,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_complaints_student_id on public.complaints(student_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_created_at on public.complaints(created_at);

create table if not exists public.complaint_notes (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  author_id uuid not null references public.user_directory(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_directory(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  notification_type text default 'general',
  related_request_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at);

-- Account approval requests
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_approval_requests_user_id on public.approval_requests(user_id);
create index if not exists idx_approval_requests_email on public.approval_requests(email);
create index if not exists idx_approval_requests_status on public.approval_requests(status);

-- Registration OTP challenges
create table if not exists public.registration_otp_challenges (
  email text primary key,
  role text not null default 'student',
  otp_hash text not null,
  otp_salt text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registration_otp_challenges_expires_at
  on public.registration_otp_challenges (expires_at);

-- Request documents
create table if not exists public.request_documents (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('leave', 'outing')),
  request_id uuid not null,
  file_url text not null,
  uploaded_by uuid not null references public.user_directory(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_request_documents_request_id on public.request_documents(request_id);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.user_directory(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Views
drop view if exists public.user_profile_view;
create view public.user_profile_view as
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
  ud.institution_id,
  inst.name as institution_name,
  coalesce(sd.full_name, st.full_name, hd.full_name, pr.full_name, wd.full_name) as full_name,
  coalesce(sd.mobile_number, st.mobile_number, hd.mobile_number, pr.mobile_number, wd.mobile_number) as mobile_number,
  coalesce(sd.gender, st.gender, hd.gender) as gender,
  coalesce(sd.institute, st.institute, hd.institute, pr.institute, wd.institute) as institute,
  sd.register_number,
  sd.class_details,
  sd.parent_name,
  sd.parent_number as parent_number,
  sd.parent_number as parent_mobile,
  sd.year as year,
  sd.year as year_of_study,
  coalesce(sd.department, st.department, hd.department) as department,
  st.department as staff_department,
  hd.department as hod_department,
  sd.department_id,
  dep.name as department_name,
  sd.hostel_block,
  sd.block_id,
  hb.name as block_name,
  sd.room_number,
  sd.room_id,
  r.capacity as room_capacity,
  r.occupied_count as room_occupied_count,
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
  pr2.email as principal_email,
  ud.profile_image_url
from public.user_directory ud
left join public.students_details sd on sd.user_id = ud.id
left join public.staff_details st on st.user_id = ud.id
left join public.hod_details hd on hd.user_id = ud.id
left join public.principal_details pr on pr.user_id = ud.id
left join public.warden_details wd on wd.user_id = ud.id
left join public.institutions inst on inst.id = ud.institution_id
left join public.departments dep on dep.id = sd.department_id
left join public.hostel_blocks hb on hb.id = sd.block_id
left join public.rooms r on r.id = sd.room_id
left join public.user_directory m on m.id = sd.mentor_id
left join public.user_directory adv on adv.id = sd.advisor_id
left join public.user_directory h on h.id = sd.hod_id
left join public.user_directory pr2 on pr2.id = sd.principal_id;

-- All requests view
drop view if exists public.all_requests_view;
create view public.all_requests_view as
select
  'leave' as request_type,
  lr.id,
  coalesce(lr.student_id, ud.id) as student_id,
  lr.student_email,
  lr.student_name,
  lr.mentor_email,
  lr.destination,
  lr.reason,
  lr.status,
  lr.departure_datetime,
  lr.return_datetime,
  lr.departure_date,
  lr.return_date,
  lr.current_approver,
  lr.approval_chain,
  lr.created_at,
  lr.updated_at
from public.leave_requests lr
left join public.user_directory ud on lower(ud.email) = lower(lr.student_email)
union all
select
  'outing' as request_type,
  or_.id,
  coalesce(or_.student_id, ud.id) as student_id,
  or_.student_email,
  or_.student_name,
  or_.mentor_email,
  or_.destination,
  or_.reason,
  or_.status,
  or_.departure_datetime,
  or_.return_datetime,
  or_.departure_date,
  or_.return_date,
  or_.current_approver,
  or_.approval_chain,
  or_.created_at,
  or_.updated_at
from public.outing_requests or_
left join public.user_directory ud on lower(ud.email) = lower(or_.student_email);

-- Helper functions
create or replace function public.current_user_directory_id()
returns uuid
language sql stable
as $$
  select id from public.user_directory
  where lower(email) = lower(auth.jwt() ->> 'email')
$$;

create or replace function public.get_current_user_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from public.user_directory
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

create or replace function public.get_current_user_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select (role)::text
  from public.user_directory
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_directory u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
      and lower((u.role)::text) = 'admin'
      and lower(coalesce((u.access_status)::text, u.status, '')) in ('approved', 'active')
  );
$$;

create or replace function public.is_current_user_warden()
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.user_directory
    where id = public.current_user_directory_id()
      and role = 'warden'
  );
$$;

create or replace function public.is_current_user_principal()
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.user_directory
    where id = public.current_user_directory_id()
      and role = 'principal'
  );
$$;

-- Enable RLS
alter table public.user_directory enable row level security;
alter table public.students_details enable row level security;
alter table public.staff_details enable row level security;
alter table public.hod_details enable row level security;
alter table public.principal_details enable row level security;
alter table public.warden_details enable row level security;
alter table public.institutions enable row level security;
alter table public.departments enable row level security;
alter table public.hostel_blocks enable row level security;
alter table public.rooms enable row level security;
alter table public.warden_assignments enable row level security;
alter table public.leave_requests enable row level security;
alter table public.outing_requests enable row level security;
alter table public.request_approvals enable row level security;
alter table public.pass_request_approvals enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_notes enable row level security;
alter table public.notifications enable row level security;
alter table public.approval_requests enable row level security;
alter table public.registration_otp_challenges enable row level security;
alter table public.request_documents enable row level security;
alter table public.audit_logs enable row level security;

-- Policies: user_directory
drop policy if exists user_directory_read_own on public.user_directory;
create policy user_directory_read_own
on public.user_directory
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists user_directory_admin_read_all on public.user_directory;
create policy user_directory_admin_read_all
on public.user_directory
for select
to authenticated
using (public.is_current_user_admin());

drop policy if exists user_directory_admin_update_all on public.user_directory;
create policy user_directory_admin_update_all
on public.user_directory
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Policies: profile detail tables (read own + admin)
drop policy if exists students_details_read_own on public.students_details;
create policy students_details_read_own
on public.students_details
for select
to authenticated
using (user_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists students_details_admin_all on public.students_details;
create policy students_details_admin_all
on public.students_details
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists staff_details_read_own on public.staff_details;
create policy staff_details_read_own
on public.staff_details
for select
to authenticated
using (user_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists staff_details_admin_all on public.staff_details;
create policy staff_details_admin_all
on public.staff_details
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists hod_details_read_own on public.hod_details;
create policy hod_details_read_own
on public.hod_details
for select
to authenticated
using (user_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists hod_details_admin_all on public.hod_details;
create policy hod_details_admin_all
on public.hod_details
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists principal_details_read_own on public.principal_details;
create policy principal_details_read_own
on public.principal_details
for select
to authenticated
using (user_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists principal_details_admin_all on public.principal_details;
create policy principal_details_admin_all
on public.principal_details
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists warden_details_read_own on public.warden_details;
create policy warden_details_read_own
on public.warden_details
for select
to authenticated
using (user_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists warden_details_admin_all on public.warden_details;
create policy warden_details_admin_all
on public.warden_details
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Policies: admin config tables
drop policy if exists institutions_admin_all on public.institutions;
create policy institutions_admin_all on public.institutions
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists departments_admin_all on public.departments;
create policy departments_admin_all on public.departments
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists hostel_blocks_admin_all on public.hostel_blocks;
create policy hostel_blocks_admin_all on public.hostel_blocks
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists rooms_admin_all on public.rooms;
create policy rooms_admin_all on public.rooms
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- Policies: warden assignments
drop policy if exists warden_assignments_read_own on public.warden_assignments;
create policy warden_assignments_read_own on public.warden_assignments
for select using (warden_id = public.current_user_directory_id() or public.is_current_user_admin());

-- Policies: leave/outing (students)
drop policy if exists leave_requests_students_read_own on public.leave_requests;
create policy leave_requests_students_read_own
on public.leave_requests
for select
to authenticated
using (coalesce(student_id, (select id from public.user_directory where lower(email) = lower(leave_requests.student_email) limit 1)) = public.current_user_directory_id());

drop policy if exists leave_requests_students_insert_own on public.leave_requests;
create policy leave_requests_students_insert_own
on public.leave_requests
for insert
to authenticated
with check (lower(student_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists outing_requests_students_read_own on public.outing_requests;
create policy outing_requests_students_read_own
on public.outing_requests
for select
to authenticated
using (coalesce(student_id, (select id from public.user_directory where lower(email) = lower(outing_requests.student_email) limit 1)) = public.current_user_directory_id());

drop policy if exists outing_requests_students_insert_own on public.outing_requests;
create policy outing_requests_students_insert_own
on public.outing_requests
for insert
to authenticated
with check (lower(student_email) = lower(auth.jwt() ->> 'email'));

-- Policies: leave/outing (mentor/advisor/hod via students_details mapping)
drop policy if exists leave_requests_faculty_read on public.leave_requests;
create policy leave_requests_faculty_read
on public.leave_requests
for select
to authenticated
using (
  public.is_current_user_admin()
  or exists (
    select 1
    from public.students_details sd
    where sd.user_id = coalesce(leave_requests.student_id, (select id from public.user_directory where lower(email) = lower(leave_requests.student_email) limit 1))
      and (
        sd.mentor_id = public.current_user_directory_id()
        or sd.advisor_id = public.current_user_directory_id()
        or sd.hod_id = public.current_user_directory_id()
      )
  )
);

drop policy if exists leave_requests_faculty_update on public.leave_requests;
create policy leave_requests_faculty_update
on public.leave_requests
for update
to authenticated
using (
  public.is_current_user_admin()
  or exists (
    select 1
    from public.students_details sd
    where sd.user_id = coalesce(leave_requests.student_id, (select id from public.user_directory where lower(email) = lower(leave_requests.student_email) limit 1))
      and (
        sd.mentor_id = public.current_user_directory_id()
        or sd.advisor_id = public.current_user_directory_id()
        or sd.hod_id = public.current_user_directory_id()
      )
  )
);

drop policy if exists outing_requests_faculty_read on public.outing_requests;
create policy outing_requests_faculty_read
on public.outing_requests
for select
to authenticated
using (
  public.is_current_user_admin()
  or exists (
    select 1
    from public.students_details sd
    where sd.user_id = coalesce(outing_requests.student_id, (select id from public.user_directory where lower(email) = lower(outing_requests.student_email) limit 1))
      and (
        sd.mentor_id = public.current_user_directory_id()
        or sd.advisor_id = public.current_user_directory_id()
        or sd.hod_id = public.current_user_directory_id()
      )
  )
);

drop policy if exists outing_requests_faculty_update on public.outing_requests;
create policy outing_requests_faculty_update
on public.outing_requests
for update
to authenticated
using (
  public.is_current_user_admin()
  or exists (
    select 1
    from public.students_details sd
    where sd.user_id = coalesce(outing_requests.student_id, (select id from public.user_directory where lower(email) = lower(outing_requests.student_email) limit 1))
      and (
        sd.mentor_id = public.current_user_directory_id()
        or sd.advisor_id = public.current_user_directory_id()
        or sd.hod_id = public.current_user_directory_id()
      )
  )
);

-- Policies: leave/outing (warden block)
drop policy if exists leave_requests_warden_block_read on public.leave_requests;
create policy leave_requests_warden_block_read on public.leave_requests
for select using (
  public.is_current_user_admin()
  or (
    public.is_current_user_warden()
    and exists (
      select 1
      from public.students_details sd
      join public.warden_assignments wa on wa.block_id = sd.block_id
      where sd.user_id = leave_requests.student_id
        and wa.warden_id = public.current_user_directory_id()
    )
  )
);

drop policy if exists leave_requests_warden_block_update on public.leave_requests;
create policy leave_requests_warden_block_update on public.leave_requests
for update using (
  public.is_current_user_admin()
  or (
    public.is_current_user_warden()
    and exists (
      select 1
      from public.students_details sd
      join public.warden_assignments wa on wa.block_id = sd.block_id
      where sd.user_id = leave_requests.student_id
        and wa.warden_id = public.current_user_directory_id()
    )
  )
);

drop policy if exists outing_requests_warden_block_read on public.outing_requests;
create policy outing_requests_warden_block_read on public.outing_requests
for select using (
  public.is_current_user_admin()
  or (
    public.is_current_user_warden()
    and exists (
      select 1
      from public.students_details sd
      join public.warden_assignments wa on wa.block_id = sd.block_id
      where sd.user_id = outing_requests.student_id
        and wa.warden_id = public.current_user_directory_id()
    )
  )
);

drop policy if exists outing_requests_warden_block_update on public.outing_requests;
create policy outing_requests_warden_block_update on public.outing_requests
for update using (
  public.is_current_user_admin()
  or (
    public.is_current_user_warden()
    and exists (
      select 1
      from public.students_details sd
      join public.warden_assignments wa on wa.block_id = sd.block_id
      where sd.user_id = outing_requests.student_id
        and wa.warden_id = public.current_user_directory_id()
    )
  )
);

-- Policies: request approvals
drop policy if exists request_approvals_approver_read on public.request_approvals;
create policy request_approvals_approver_read
on public.request_approvals
for select
to authenticated
using (approver_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists request_approvals_approver_insert on public.request_approvals;
create policy request_approvals_approver_insert
on public.request_approvals
for insert
to authenticated
with check (approver_id = public.current_user_directory_id() or public.is_current_user_admin());

-- Policies: pass_request_approvals
drop policy if exists pass_request_approvals_read on public.pass_request_approvals;
create policy pass_request_approvals_read
on public.pass_request_approvals
for select
to authenticated
using (approver_id = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists pass_request_approvals_insert on public.pass_request_approvals;
create policy pass_request_approvals_insert
on public.pass_request_approvals
for insert
to authenticated
with check (approver_id = public.current_user_directory_id() or public.is_current_user_admin());

-- Policies: complaints
drop policy if exists complaints_admin_all on public.complaints;
create policy complaints_admin_all on public.complaints
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists complaints_student_read_own on public.complaints;
create policy complaints_student_read_own
on public.complaints
for select
to authenticated
using (student_id = public.current_user_directory_id());

drop policy if exists complaints_student_insert_own on public.complaints;
create policy complaints_student_insert_own
on public.complaints
for insert
to authenticated
with check (student_id = public.current_user_directory_id());

drop policy if exists complaints_warden_block_read on public.complaints;
create policy complaints_warden_block_read
on public.complaints
for select
using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = complaints.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

drop policy if exists complaints_warden_block_update on public.complaints;
create policy complaints_warden_block_update
on public.complaints
for update
using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = complaints.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
) with check (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = complaints.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

drop policy if exists complaints_principal_read on public.complaints;
create policy complaints_principal_read
on public.complaints
for select using (public.is_current_user_principal());

drop policy if exists complaints_principal_update on public.complaints;
create policy complaints_principal_update
on public.complaints
for update using (public.is_current_user_principal())
with check (public.is_current_user_principal());

-- Policies: complaint notes
drop policy if exists complaint_notes_admin_all on public.complaint_notes;
create policy complaint_notes_admin_all on public.complaint_notes
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists complaint_notes_principal_read on public.complaint_notes;
create policy complaint_notes_principal_read
on public.complaint_notes
for select using (public.is_current_user_principal());

drop policy if exists complaint_notes_warden_block_access on public.complaint_notes;
create policy complaint_notes_warden_block_access
on public.complaint_notes
for select using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.complaints c
    join public.students_details sd on sd.user_id = c.student_id
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where c.id = complaint_notes.complaint_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

drop policy if exists complaint_notes_warden_block_insert on public.complaint_notes;
create policy complaint_notes_warden_block_insert
on public.complaint_notes
for insert with check (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.complaints c
    join public.students_details sd on sd.user_id = c.student_id
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where c.id = complaint_notes.complaint_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

-- Policies: notifications
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own
on public.notifications
for select
to authenticated
using (user_id = public.current_user_directory_id());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = public.current_user_directory_id())
with check (user_id = public.current_user_directory_id());

-- Policies: approval_requests
drop policy if exists approval_requests_admin_all on public.approval_requests;
create policy approval_requests_admin_all
on public.approval_requests
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- Policies: request_documents
drop policy if exists request_documents_read_own on public.request_documents;
create policy request_documents_read_own
on public.request_documents
for select
to authenticated
using (uploaded_by = public.current_user_directory_id() or public.is_current_user_admin());

drop policy if exists request_documents_insert_own on public.request_documents;
create policy request_documents_insert_own
on public.request_documents
for insert
to authenticated
with check (uploaded_by = public.current_user_directory_id() or public.is_current_user_admin());

-- Policies: audit_logs
drop policy if exists audit_logs_admin_all on public.audit_logs;
create policy audit_logs_admin_all
on public.audit_logs
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists audit_logs_read_own on public.audit_logs;
create policy audit_logs_read_own
on public.audit_logs
for select using (actor_id = public.current_user_directory_id());

-- Grant permissions
grant select on public.user_profile_view to authenticated;
grant select on public.all_requests_view to authenticated;
grant execute on function public.get_current_user_id() to authenticated;
grant execute on function public.get_current_user_role() to authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

-- Triggers for updated_at
create trigger update_user_directory_updated_at
before update on public.user_directory
for each row execute function public.update_updated_at_column();

create trigger update_leave_requests_updated_at
before update on public.leave_requests
for each row execute function public.update_updated_at_column();

create trigger update_outing_requests_updated_at
before update on public.outing_requests
for each row execute function public.update_updated_at_column();

create trigger update_request_approvals_updated_at
before update on public.request_approvals
for each row execute function public.update_updated_at_column();

-- Storage buckets (requires storage schema)
do $$
begin
  perform storage.create_bucket('profile-images', public := true);
exception when others then
  null;
end $$;

do $$
begin
  perform storage.create_bucket('request-documents', public := false);
exception when others then
  null;
end $$;

-- Storage policies (guarded to avoid ownership errors)
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and pg_get_userbyid(c.relowner) = current_user
  ) then
    alter table storage.objects enable row level security;

    drop policy if exists profile_images_read_public on storage.objects;
    create policy profile_images_read_public
    on storage.objects
    for select
    using (bucket_id = 'profile-images');

    drop policy if exists profile_images_upload_own on storage.objects;
    create policy profile_images_upload_own
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'profile-images' and owner = auth.uid());

    drop policy if exists request_docs_read_own on storage.objects;
    create policy request_docs_read_own
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'request-documents' and owner = auth.uid());

    drop policy if exists request_docs_upload_own on storage.objects;
    create policy request_docs_upload_own
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'request-documents' and owner = auth.uid());
  else
    raise notice 'Skipping storage policy creation: current user does not own storage.objects.';
  end if;
end $$;

-- Realtime publication (idempotent)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'leave_requests'
  ) then
    alter publication supabase_realtime add table leave_requests;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'outing_requests'
  ) then
    alter publication supabase_realtime add table outing_requests;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'request_approvals'
  ) then
    alter publication supabase_realtime add table request_approvals;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'complaints'
  ) then
    alter publication supabase_realtime add table complaints;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

commit;
