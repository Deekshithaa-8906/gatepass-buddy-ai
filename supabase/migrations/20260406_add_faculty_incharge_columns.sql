-- Add student faculty in-charge assignment columns to user_directory.
-- Run this migration in Supabase SQL editor (or via CLI migrations) before using Profile Save.

alter table public.user_directory
  add column if not exists mentor text,
  add column if not exists mentor_email text,
  add column if not exists advisor text,
  add column if not exists advisor_email text,
  add column if not exists hod text,
  add column if not exists hod_email text,
  add column if not exists principal text,
  add column if not exists principal_email text;

-- Optional indexes to speed up institute/department/role option lookups.
create index if not exists idx_user_directory_role_institute_department
  on public.user_directory (role, institute, department);

create index if not exists idx_user_directory_email
  on public.user_directory (email);
