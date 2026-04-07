alter table public.user_directory enable row level security;

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

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

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