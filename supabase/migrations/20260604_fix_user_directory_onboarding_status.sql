-- Allow authenticated users to finish onboarding by updating their own
-- user_directory row, and backfill any users who already completed onboarding
-- but are still stuck in pending state.

drop policy if exists user_directory_self_update_own on public.user_directory;

create policy user_directory_self_update_own
on public.user_directory
for update
to authenticated
using (
  lower(email) = lower(auth.jwt() ->> 'email')
)
with check (
  lower(email) = lower(auth.jwt() ->> 'email')
);

create or replace function public.enforce_user_directory_self_update_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;

  if lower(coalesce(old.email, '')) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'You can only update your own account';
  end if;

  if new.id <> old.id
    or lower(coalesce(new.email, '')) <> lower(coalesce(old.email, ''))
    or coalesce(new.role, '') <> coalesce(old.role, '')
    or coalesce(new.access_status, '') <> coalesce(old.access_status, '')
    or coalesce(new.full_name, '') <> coalesce(old.full_name, '')
    or coalesce(new.mobile_number, '') <> coalesce(old.mobile_number, '')
    or coalesce(new.gender, '') <> coalesce(old.gender, '')
    or coalesce(new.institute, '') <> coalesce(old.institute, '')
    or coalesce(new.department, '') <> coalesce(old.department, '')
    or coalesce(new.register_number, '') <> coalesce(old.register_number, '')
    or coalesce(new.class_details, '') <> coalesce(old.class_details, '')
    or coalesce(new.parent_name, '') <> coalesce(old.parent_name, '')
    or coalesce(new.parent_mobile, '') <> coalesce(old.parent_mobile, '')
    or coalesce(new.parent_number, '') <> coalesce(old.parent_number, '')
    or coalesce(new.year, '') <> coalesce(old.year, '')
    or coalesce(new.year_of_study, '') <> coalesce(old.year_of_study, '')
    or coalesce(new.hostel_block, '') <> coalesce(old.hostel_block, '')
    or coalesce(new.room_number, '') <> coalesce(old.room_number, '')
    or coalesce(new.mentor, '') <> coalesce(old.mentor, '')
    or coalesce(new.mentor_email, '') <> coalesce(old.mentor_email, '')
    or coalesce(new.advisor, '') <> coalesce(old.advisor, '')
    or coalesce(new.advisor_email, '') <> coalesce(old.advisor_email, '')
    or coalesce(new.hod, '') <> coalesce(old.hod, '')
    or coalesce(new.hod_email, '') <> coalesce(old.hod_email, '')
    or coalesce(new.principal, '') <> coalesce(old.principal, '')
    or coalesce(new.principal_email, '') <> coalesce(old.principal_email, '')
    or coalesce(new.profile_image_url, '') <> coalesce(old.profile_image_url, '')
    or coalesce(new.institution_id::text, '') <> coalesce(old.institution_id::text, '')
    or coalesce(new.department_id::text, '') <> coalesce(old.department_id::text, '')
    or coalesce(new.block_id::text, '') <> coalesce(old.block_id::text, '')
    or coalesce(new.room_id::text, '') <> coalesce(old.room_id::text, '') then
    raise exception 'You can only change onboarding status fields';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_user_directory_self_update_limits on public.user_directory;
create trigger trg_user_directory_self_update_limits
before update on public.user_directory
for each row
execute function public.enforce_user_directory_self_update_limits();

update public.user_directory
set
  status = 'active',
  account_status = 'active',
  updated_at = now()
where onboarding_complete = true
  and lower(coalesce(status, '')) in ('pending', 'approved')
  and lower(coalesce(account_status, '')) in ('pending', 'inactive');