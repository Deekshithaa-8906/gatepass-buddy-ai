-- Allow staff, HOD, principal, and warden users to save their own onboarding
-- details into their role-specific profile tables.

alter table public.staff_details enable row level security;
alter table public.hod_details enable row level security;
alter table public.principal_details enable row level security;
alter table public.warden_details enable row level security;

create or replace function public.current_user_directory_id()
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

grant execute on function public.current_user_directory_id() to authenticated;

grant select, insert, update, delete on public.staff_details to authenticated;
grant select, insert, update, delete on public.hod_details to authenticated;
grant select, insert, update, delete on public.principal_details to authenticated;
grant select, insert, update, delete on public.warden_details to authenticated;

-- Staff
drop policy if exists staff_details_read_own on public.staff_details;
drop policy if exists staff_details_insert_own on public.staff_details;
drop policy if exists staff_details_update_own on public.staff_details;
drop policy if exists staff_details_delete_own on public.staff_details;

create policy staff_details_read_own
on public.staff_details
for select
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy staff_details_insert_own
on public.staff_details
for insert
to authenticated
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy staff_details_update_own
on public.staff_details
for update
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
)
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy staff_details_delete_own
on public.staff_details
for delete
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

-- HOD
drop policy if exists hod_details_read_own on public.hod_details;
drop policy if exists hod_details_insert_own on public.hod_details;
drop policy if exists hod_details_update_own on public.hod_details;
drop policy if exists hod_details_delete_own on public.hod_details;

create policy hod_details_read_own
on public.hod_details
for select
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy hod_details_insert_own
on public.hod_details
for insert
to authenticated
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy hod_details_update_own
on public.hod_details
for update
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
)
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy hod_details_delete_own
on public.hod_details
for delete
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

-- Principal
drop policy if exists principal_details_read_own on public.principal_details;
drop policy if exists principal_details_insert_own on public.principal_details;
drop policy if exists principal_details_update_own on public.principal_details;
drop policy if exists principal_details_delete_own on public.principal_details;

create policy principal_details_read_own
on public.principal_details
for select
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy principal_details_insert_own
on public.principal_details
for insert
to authenticated
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy principal_details_update_own
on public.principal_details
for update
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
)
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy principal_details_delete_own
on public.principal_details
for delete
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

-- Warden
drop policy if exists warden_details_read_own on public.warden_details;
drop policy if exists warden_details_insert_own on public.warden_details;
drop policy if exists warden_details_update_own on public.warden_details;
drop policy if exists warden_details_delete_own on public.warden_details;

create policy warden_details_read_own
on public.warden_details
for select
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy warden_details_insert_own
on public.warden_details
for insert
to authenticated
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy warden_details_update_own
on public.warden_details
for update
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
)
with check (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy warden_details_delete_own
on public.warden_details
for delete
to authenticated
using (
  user_id = public.current_user_directory_id()
  or lower(email) = lower(auth.jwt() ->> 'email')
);
