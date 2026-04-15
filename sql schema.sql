-- PassNTrack: Admin + Warden Multi-tenant Upgrade
-- Safe to run multiple times (idempotent where possible)

begin;

-- -------------------------------------------------------------------
-- Extensions
-- -------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------
-- Enums (guarded)
-- -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'hostel_block_type') then
    create type hostel_block_type as enum ('boys', 'girls', 'mixed', 'unknown');
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'complaint_status_enum') then
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'complaint_status_enum' and e.enumlabel = 'open'
    ) then
      alter type complaint_status_enum add value 'open';
    end if;
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'complaint_status_enum' and e.enumlabel = 'in_progress'
    ) then
      alter type complaint_status_enum add value 'in_progress';
    end if;
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'complaint_status_enum' and e.enumlabel = 'closed'
    ) then
      alter type complaint_status_enum add value 'closed';
    end if;
  end if;
end $$;

-- -------------------------------------------------------------------
-- Core Admin Config Tables
-- -------------------------------------------------------------------
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

-- Warden assignment mapping
create table if not exists public.warden_assignments (
  id uuid primary key default gen_random_uuid(),
  warden_id uuid not null references public.user_directory(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  block_id uuid not null references public.hostel_blocks(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  created_at timestamptz default now(),
  unique (warden_id, block_id)
);

-- Complaint notes (internal notes for wardens/admins)
create table if not exists public.complaint_notes (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  author_id uuid not null references public.user_directory(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);

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

-- -------------------------------------------------------------------
-- Add IDs to existing tables (non-breaking)
-- -------------------------------------------------------------------
alter table public.user_directory
  add column if not exists institution_id uuid references public.institutions(id);

alter table public.students_details
  add column if not exists institution_id uuid references public.institutions(id),
  add column if not exists department_id uuid references public.departments(id),
  add column if not exists block_id uuid references public.hostel_blocks(id),
  add column if not exists room_id uuid references public.rooms(id);

alter table public.staff_details
  add column if not exists institution_id uuid references public.institutions(id),
  add column if not exists department_id uuid references public.departments(id);

alter table public.hod_details
  add column if not exists institution_id uuid references public.institutions(id),
  add column if not exists department_id uuid references public.departments(id);

alter table public.warden_details
  add column if not exists institution_id uuid references public.institutions(id);

alter table public.principal_details
  add column if not exists institution_id uuid references public.institutions(id);

-- Ensure student_id on leave/outing for block-level RLS
alter table public.leave_requests
  add column if not exists student_id uuid references public.user_directory(id) on delete set null,
  add column if not exists departure_datetime timestamptz,
  add column if not exists return_datetime timestamptz;

alter table public.outing_requests
  add column if not exists student_id uuid references public.user_directory(id) on delete set null,
  add column if not exists departure_date date,
  add column if not exists return_date date;

alter table public.complaints
  add column if not exists forwarded_by_role text,
  add column if not exists forwarded_by_id uuid references public.user_directory(id) on delete set null,
  add column if not exists closed_reason text,
  add column if not exists closed_at timestamptz;

-- -------------------------------------------------------------------
-- Backfill Institutions
-- -------------------------------------------------------------------
insert into public.institutions (name)
select distinct trim(institute)
from (
  select institute from public.user_directory
  union all select institute from public.students_details
  union all select institute from public.staff_details
  union all select institute from public.hod_details
  union all select institute from public.warden_details
  union all select institute from public.principal_details
) s
where institute is not null and trim(institute) <> ''
on conflict (name) do nothing;

update public.user_directory ud
set institution_id = i.id
from public.institutions i
where ud.institution_id is null
  and i.name = ud.institute;

update public.students_details sd
set institution_id = i.id
from public.institutions i
where sd.institution_id is null
  and i.name = sd.institute;

update public.staff_details st
set institution_id = i.id
from public.institutions i
where st.institution_id is null
  and i.name = st.institute;

update public.hod_details hd
set institution_id = i.id
from public.institutions i
where hd.institution_id is null
  and i.name = hd.institute;

update public.warden_details wd
set institution_id = i.id
from public.institutions i
where wd.institution_id is null
  and i.name = wd.institute;

update public.principal_details pd
set institution_id = i.id
from public.institutions i
where pd.institution_id is null
  and i.name = pd.institute;

-- -------------------------------------------------------------------
-- Backfill Departments
-- -------------------------------------------------------------------
insert into public.departments (institution_id, name)
select distinct i.id, trim(x.department)
from (
  select institute, department from public.students_details
  union all select institute, department from public.staff_details
  union all select institute, department from public.hod_details
) x
join public.institutions i on i.name = x.institute
where x.department is not null and trim(x.department) <> ''
on conflict (institution_id, name) do nothing;

update public.students_details sd
set department_id = d.id
from public.departments d
join public.institutions i on i.id = d.institution_id
where sd.department_id is null
  and i.name = sd.institute
  and d.name = sd.department;

update public.staff_details st
set department_id = d.id
from public.departments d
join public.institutions i on i.id = d.institution_id
where st.department_id is null
  and i.name = st.institute
  and d.name = st.department;

update public.hod_details hd
set department_id = d.id
from public.departments d
join public.institutions i on i.id = d.institution_id
where hd.department_id is null
  and i.name = hd.institute
  and d.name = hd.department;

-- -------------------------------------------------------------------
-- Backfill Hostel Blocks + Rooms
-- -------------------------------------------------------------------
insert into public.hostel_blocks (institution_id, name)
select distinct i.id, trim(sd.hostel_block)
from public.students_details sd
join public.institutions i on i.name = sd.institute
where sd.hostel_block is not null and trim(sd.hostel_block) <> ''
on conflict (institution_id, name) do nothing;

insert into public.rooms (block_id, room_number)
select distinct hb.id, trim(sd.room_number)
from public.students_details sd
join public.institutions i on i.name = sd.institute
join public.hostel_blocks hb on hb.institution_id = i.id and hb.name = sd.hostel_block
where sd.room_number is not null and trim(sd.room_number) <> ''
on conflict (block_id, room_number) do nothing;

update public.students_details sd
set block_id = hb.id
from public.institutions i
join public.hostel_blocks hb on hb.institution_id = i.id
where sd.block_id is null
  and i.name = sd.institute
  and hb.name = sd.hostel_block;

update public.students_details sd
set room_id = r.id
from public.institutions i
join public.hostel_blocks hb on hb.institution_id = i.id
join public.rooms r on r.block_id = hb.id
where sd.room_id is null
  and i.name = sd.institute
  and hb.name = sd.hostel_block
  and r.room_number = sd.room_number;

update public.rooms r
set occupied_count = sub.count
from (
  select room_id, count(*) as count
  from public.students_details
  where room_id is not null
  group by room_id
) sub
where r.id = sub.room_id;

-- -------------------------------------------------------------------
-- Backfill student_id on leave/outing
-- -------------------------------------------------------------------
update public.leave_requests lr
set student_id = ud.id
from public.user_directory ud
where lr.student_id is null
  and lower(lr.student_email) = lower(ud.email);

update public.outing_requests orq
set student_id = ud.id
from public.user_directory ud
where orq.student_id is null
  and lower(orq.student_email) = lower(ud.email);

-- -------------------------------------------------------------------
-- Update user_profile_view with new IDs
-- -------------------------------------------------------------------
drop view if exists public.user_profile_view cascade;

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
  pr2.email as principal_email
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

-- -------------------------------------------------------------------
-- RLS Helpers
-- -------------------------------------------------------------------
create or replace function public.current_user_directory_id()
returns uuid
language sql stable
as $$
  select id from public.user_directory
  where lower(email) = lower(auth.jwt() ->> 'email')
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
  )
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
  )
$$;

-- -------------------------------------------------------------------
-- Enable RLS on new tables
-- -------------------------------------------------------------------
alter table public.institutions enable row level security;
alter table public.departments enable row level security;
alter table public.hostel_blocks enable row level security;
alter table public.rooms enable row level security;
alter table public.warden_assignments enable row level security;
alter table public.complaint_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.staff_details enable row level security;
alter table public.hod_details enable row level security;
alter table public.principal_details enable row level security;
alter table public.warden_details enable row level security;

-- -------------------------------------------------------------------
-- RLS: Admin full access to config tables
-- -------------------------------------------------------------------
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

drop policy if exists warden_assignments_admin_all on public.warden_assignments;
create policy warden_assignments_admin_all on public.warden_assignments
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

-- -------------------------------------------------------------------
-- RLS: Warden read access to assigned blocks and assignments
-- -------------------------------------------------------------------
drop policy if exists hostel_blocks_warden_read on public.hostel_blocks;
create policy hostel_blocks_warden_read on public.hostel_blocks
for select
using (
  public.is_current_user_admin()
  or exists (
    select 1 from public.warden_assignments wa
    where wa.warden_id = public.current_user_directory_id()
      and wa.block_id = hostel_blocks.id
  )
);

drop policy if exists rooms_warden_read on public.rooms;
create policy rooms_warden_read on public.rooms
for select
using (
  public.is_current_user_admin()
  or exists (
    select 1 from public.warden_assignments wa
    where wa.warden_id = public.current_user_directory_id()
      and wa.block_id = rooms.block_id
  )
);

drop policy if exists warden_assignments_read_own on public.warden_assignments;
create policy warden_assignments_read_own on public.warden_assignments
for select
using (warden_id = public.current_user_directory_id());

-- -------------------------------------------------------------------
-- RLS: Students_details (student + warden block + admin)
-- -------------------------------------------------------------------
drop policy if exists students_details_admin_all on public.students_details;
create policy students_details_admin_all on public.students_details
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists students_details_student_read_own on public.students_details;
create policy students_details_student_read_own on public.students_details
for select using (user_id = public.current_user_directory_id());

drop policy if exists students_details_warden_block_read on public.students_details;
create policy students_details_warden_block_read on public.students_details
for select using (
  public.is_current_user_warden()
  and exists (
    select 1 from public.warden_assignments wa
    where wa.warden_id = public.current_user_directory_id()
      and wa.block_id = students_details.block_id
  )
);

-- -------------------------------------------------------------------
-- RLS: Complaints (student own, warden block, admin)
-- -------------------------------------------------------------------
drop policy if exists complaints_admin_all on public.complaints;
create policy complaints_admin_all on public.complaints
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists complaints_principal_read on public.complaints;
create policy complaints_principal_read on public.complaints
for select using (public.is_current_user_principal());

drop policy if exists complaints_principal_update on public.complaints;
create policy complaints_principal_update on public.complaints
for update using (public.is_current_user_principal())
with check (public.is_current_user_principal());

drop policy if exists complaints_student_read_own on public.complaints;
create policy complaints_student_read_own on public.complaints
for select using (student_id = public.current_user_directory_id());

drop policy if exists complaints_student_insert_own on public.complaints;
create policy complaints_student_insert_own on public.complaints
for insert with check (student_id = public.current_user_directory_id());

drop policy if exists complaints_warden_block_read on public.complaints;
create policy complaints_warden_block_read on public.complaints
for select using (
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
create policy complaints_warden_block_update on public.complaints
for update using (
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

-- Complaint notes (warden/admin)
drop policy if exists complaint_notes_admin_all on public.complaint_notes;
create policy complaint_notes_admin_all on public.complaint_notes
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists complaint_notes_principal_read on public.complaint_notes;
create policy complaint_notes_principal_read on public.complaint_notes
for select using (public.is_current_user_principal());

drop policy if exists complaint_notes_warden_block_access on public.complaint_notes;
create policy complaint_notes_warden_block_access on public.complaint_notes
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
create policy complaint_notes_warden_block_insert on public.complaint_notes
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

-- -------------------------------------------------------------------
-- RLS: Leave/Outing (warden block + admin + student)
-- -------------------------------------------------------------------
drop policy if exists leave_requests_warden_block_read on public.leave_requests;
create policy leave_requests_warden_block_read on public.leave_requests
for select using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = leave_requests.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

drop policy if exists leave_requests_warden_block_update on public.leave_requests;
create policy leave_requests_warden_block_update on public.leave_requests
for update using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = leave_requests.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

drop policy if exists outing_requests_warden_block_read on public.outing_requests;
create policy outing_requests_warden_block_read on public.outing_requests
for select using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = outing_requests.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

drop policy if exists outing_requests_warden_block_update on public.outing_requests;
create policy outing_requests_warden_block_update on public.outing_requests
for update using (
  public.is_current_user_warden()
  and exists (
    select 1
    from public.students_details sd
    join public.warden_assignments wa on wa.block_id = sd.block_id
    where sd.user_id = outing_requests.student_id
      and wa.warden_id = public.current_user_directory_id()
  )
);

-- -------------------------------------------------------------------
-- Audit logs RLS
-- -------------------------------------------------------------------
drop policy if exists audit_logs_admin_all on public.audit_logs;
create policy audit_logs_admin_all on public.audit_logs
for all using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists audit_logs_read_own on public.audit_logs;
create policy audit_logs_read_own on public.audit_logs
for select using (actor_id = public.current_user_directory_id());

-- -------------------------------------------------------------------
-- Realtime
-- -------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'institutions'
  ) then
    alter publication supabase_realtime add table institutions;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'departments'
  ) then
    alter publication supabase_realtime add table departments;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'hostel_blocks'
  ) then
    alter publication supabase_realtime add table hostel_blocks;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'warden_assignments'
  ) then
    alter publication supabase_realtime add table warden_assignments;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'complaint_notes'
  ) then
    alter publication supabase_realtime add table complaint_notes;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime')
      and c.relname = 'audit_logs'
  ) then
    alter publication supabase_realtime add table audit_logs;
  end if;
end $$;

-- -------------------------------------------------------------------
-- Optional: Auto-escalate complaints after 7 days (if pg_cron enabled)
-- -------------------------------------------------------------------
create or replace function public.escalate_stale_complaints()
returns void
language plpgsql
as $$
begin
  update public.complaints
  set status = 'escalated',
      escalated_at = now()
  where status = 'pending'
    and created_at < now() - interval '7 days';
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'complaints_escalation_daily',
      '0 2 * * *',
      $cron$select public.escalate_stale_complaints();$cron$
    );
  end if;
end $$;

commit;