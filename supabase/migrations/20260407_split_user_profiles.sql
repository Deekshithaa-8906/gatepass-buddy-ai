-- Split profile data out of user_directory while keeping auth/status in user_directory.

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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.principal_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  full_name text,
  email text unique,
  institute text,
  mobile_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.warden_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.user_directory(id) on delete cascade,
  full_name text,
  email text unique,
  institute text,
  mobile_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_students_details_user_id on public.students_details(user_id);
create index if not exists idx_students_details_register_number on public.students_details(register_number);
create index if not exists idx_staff_details_user_id on public.staff_details(user_id);
create index if not exists idx_hod_details_user_id on public.hod_details(user_id);
create index if not exists idx_principal_details_user_id on public.principal_details(user_id);
create index if not exists idx_warden_details_user_id on public.warden_details(user_id);

-- Backfill students_details from existing user_directory data.
insert into public.students_details (
  user_id,
  parent_number,
  parent_name,
  class_details,
  full_name,
  mobile_number,
  gender,
  institute,
  year,
  department,
  register_number,
  hostel_block,
  room_number,
  mentor_id,
  advisor_id,
  hod_id,
  principal_id,
  updated_at
)
select
  ud.id,
  ud.parent_mobile,
  ud.parent_name,
  ud.class_details,
  ud.full_name,
  ud.mobile_number,
  ud.gender,
  ud.institute,
  ud.year_of_study,
  ud.department,
  ud.register_number,
  ud.hostel_block,
  ud.room_number,
  mentor_user.id,
  advisor_user.id,
  hod_user.id,
  principal_user.id,
  now()
from public.user_directory ud
left join public.user_directory mentor_user on lower(mentor_user.email) = lower(ud.mentor_email)
left join public.user_directory advisor_user on lower(advisor_user.email) = lower(ud.advisor_email)
left join public.user_directory hod_user on lower(hod_user.email) = lower(ud.hod_email)
left join public.user_directory principal_user on lower(principal_user.email) = lower(ud.principal_email)
where lower((ud.role)::text) = 'student'
on conflict (user_id) do update set
  parent_number = excluded.parent_number,
  parent_name = excluded.parent_name,
  class_details = excluded.class_details,
  full_name = excluded.full_name,
  mobile_number = excluded.mobile_number,
  gender = excluded.gender,
  institute = excluded.institute,
  year = excluded.year,
  department = excluded.department,
  register_number = excluded.register_number,
  hostel_block = excluded.hostel_block,
  room_number = excluded.room_number,
  mentor_id = excluded.mentor_id,
  advisor_id = excluded.advisor_id,
  hod_id = excluded.hod_id,
  principal_id = excluded.principal_id,
  updated_at = now();

-- Backfill staff role tables from existing user_directory data.
insert into public.staff_details (user_id, full_name, email, mobile_number, gender, department, institute, updated_at)
select ud.id, ud.full_name, ud.email, ud.mobile_number, ud.gender, ud.department, ud.institute, now()
from public.user_directory ud
where lower((ud.role)::text) in ('mentor', 'advisor')
on conflict (user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  mobile_number = excluded.mobile_number,
  gender = excluded.gender,
  department = excluded.department,
  institute = excluded.institute,
  updated_at = now();

insert into public.hod_details (user_id, full_name, email, mobile_number, gender, department, institute, updated_at)
select ud.id, ud.full_name, ud.email, ud.mobile_number, ud.gender, ud.department, ud.institute, now()
from public.user_directory ud
where lower((ud.role)::text) = 'hod'
on conflict (user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  mobile_number = excluded.mobile_number,
  gender = excluded.gender,
  department = excluded.department,
  institute = excluded.institute,
  updated_at = now();

insert into public.principal_details (user_id, full_name, email, institute, mobile_number, updated_at)
select ud.id, ud.full_name, ud.email, ud.institute, ud.mobile_number, now()
from public.user_directory ud
where lower((ud.role)::text) = 'principal'
on conflict (user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  institute = excluded.institute,
  mobile_number = excluded.mobile_number,
  updated_at = now();

insert into public.warden_details (user_id, full_name, email, institute, mobile_number, updated_at)
select ud.id, ud.full_name, ud.email, ud.institute, ud.mobile_number, now()
from public.user_directory ud
where lower((ud.role)::text) = 'warden'
on conflict (user_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  institute = excluded.institute,
  mobile_number = excluded.mobile_number,
  updated_at = now();

drop view if exists public.user_profile_view;
create view public.user_profile_view as
select
  ud.id,
  ud.email,
  ud.role,
  ud.access_status,
  ud.account_status,
  ud.status,
  ud.password_created,
  ud.onboarding_complete,
  ud.created_at,
  ud.updated_at,
  coalesce(sd.full_name, st.full_name, hd.full_name, pd.full_name, wd.full_name) as full_name,
  coalesce(sd.mobile_number, st.mobile_number, hd.mobile_number, pd.mobile_number, wd.mobile_number) as mobile_number,
  sd.parent_name,
  sd.parent_number as parent_mobile,
  coalesce(sd.gender, st.gender, hd.gender) as gender,
  coalesce(sd.institute, st.institute, hd.institute, pd.institute, wd.institute) as institute,
  sd.year as year_of_study,
  coalesce(sd.department, st.department, hd.department) as department,
  sd.register_number,
  sd.class_details,
  sd.hostel_block,
  sd.room_number,
  sd.mentor_id,
  sd.advisor_id,
  sd.hod_id,
  sd.principal_id,
  mentor_user.full_name as mentor,
  mentor_user.email as mentor_email,
  advisor_user.full_name as advisor,
  advisor_user.email as advisor_email,
  hod_user.full_name as hod,
  hod_user.email as hod_email,
  principal_user.full_name as principal,
  principal_user.email as principal_email
from public.user_directory ud
left join public.students_details sd on sd.user_id = ud.id
left join public.staff_details st on st.user_id = ud.id
left join public.hod_details hd on hd.user_id = ud.id
left join public.principal_details pd on pd.user_id = ud.id
left join public.warden_details wd on wd.user_id = ud.id
left join public.user_directory mentor_user on mentor_user.id = sd.mentor_id
left join public.user_directory advisor_user on advisor_user.id = sd.advisor_id
left join public.user_directory hod_user on hod_user.id = sd.hod_id
left join public.user_directory principal_user on principal_user.id = sd.principal_id;