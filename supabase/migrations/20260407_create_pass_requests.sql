-- Create outing_requests table
create table if not exists public.outing_requests (
  id uuid primary key default gen_random_uuid(),
  student_email text not null,
  student_name text not null,
  mentor_email text,
  departure_datetime timestamp with time zone not null,
  return_datetime timestamp with time zone not null,
  destination text not null,
  reason text not null,
  status text not null default 'pending', -- pending, approved, rejected
  mentor_status text default 'pending', -- pending, approved, rejected
  advisor_status text default 'pending',
  hod_status text default 'pending',
  approval_chain text[] default array['mentor'], -- order of approval
  current_approver text default 'mentor', -- who should approve next
  approved_by text, -- who approved it
  rejected_by text, -- who rejected it
  rejection_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create leave_requests table
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_email text not null,
  student_name text not null,
  mentor_email text,
  departure_date date not null,
  return_date date not null,
  destination text not null,
  reason text not null,
  status text not null default 'pending', -- pending, approved, rejected
  mentor_status text default 'pending',
  advisor_status text default 'pending',
  hod_status text default 'pending',
  approval_chain text[] default array['mentor'],
  current_approver text default 'mentor',
  approved_by text,
  rejected_by text,
  rejection_reason text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists idx_outing_requests_student_email on public.outing_requests(student_email);
create index if not exists idx_outing_requests_mentor_email on public.outing_requests(mentor_email);
create index if not exists idx_outing_requests_status on public.outing_requests(status);
create index if not exists idx_outing_requests_current_approver on public.outing_requests(current_approver);

create index if not exists idx_leave_requests_student_email on public.leave_requests(student_email);
create index if not exists idx_leave_requests_mentor_email on public.leave_requests(mentor_email);
create index if not exists idx_leave_requests_status on public.leave_requests(status);
create index if not exists idx_leave_requests_current_approver on public.leave_requests(current_approver);

-- Add RLS policies for students (read own requests)
alter table public.outing_requests enable row level security;
alter table public.leave_requests enable row level security;

drop policy if exists outing_requests_students_read_own on public.outing_requests;
create policy outing_requests_students_read_own
on public.outing_requests
for select
to authenticated
using (lower(student_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists outing_requests_students_insert_own on public.outing_requests;
create policy outing_requests_students_insert_own
on public.outing_requests
for insert
to authenticated
with check (lower(student_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists leave_requests_students_read_own on public.leave_requests;
create policy leave_requests_students_read_own
on public.leave_requests
for select
to authenticated
using (lower(student_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists leave_requests_students_insert_own on public.leave_requests;
create policy leave_requests_students_insert_own
on public.leave_requests
for insert
to authenticated
with check (lower(student_email) = lower(auth.jwt() ->> 'email'));

-- Add policies for faculty (mentors/advisors/hods) to read/update requests assigned to them
drop policy if exists outing_requests_mentor_read on public.outing_requests;
create policy outing_requests_mentor_read
on public.outing_requests
for select
to authenticated
using (
  lower(mentor_email) = lower(auth.jwt() ->> 'email')
  or lower(auth.jwt() ->> 'email') = 'admin@snsgroups.com'
);

drop policy if exists outing_requests_mentor_update on public.outing_requests;
create policy outing_requests_mentor_update
on public.outing_requests
for update
to authenticated
using (
  lower(mentor_email) = lower(auth.jwt() ->> 'email')
  or lower(auth.jwt() ->> 'email') = 'admin@snsgroups.com'
);

drop policy if exists leave_requests_mentor_read on public.leave_requests;
create policy leave_requests_mentor_read
on public.leave_requests
for select
to authenticated
using (
  lower(mentor_email) = lower(auth.jwt() ->> 'email')
  or lower(auth.jwt() ->> 'email') = 'admin@snsgroups.com'
);

drop policy if exists leave_requests_mentor_update on public.leave_requests;
create policy leave_requests_mentor_update
on public.leave_requests
for update
to authenticated
using (
  lower(mentor_email) = lower(auth.jwt() ->> 'email')
  or lower(auth.jwt() ->> 'email') = 'admin@snsgroups.com'
);
