-- Allow authenticated users to manage their own student profile row during onboarding.
-- The frontend upserts students_details using user_directory.id as user_id,
-- so the policy matches the current auth user's email to the corresponding directory row.

alter table public.students_details enable row level security;

-- Clean up older versions if they exist.
drop policy if exists students_details_read_own on public.students_details;
drop policy if exists students_details_insert_own on public.students_details;
drop policy if exists students_details_update_own on public.students_details;
drop policy if exists students_details_delete_own on public.students_details;

create policy students_details_read_own
on public.students_details
for select
to authenticated
using (
  user_id = (
    select id
    from public.user_directory
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

create policy students_details_insert_own
on public.students_details
for insert
to authenticated
with check (
  user_id = (
    select id
    from public.user_directory
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

create policy students_details_update_own
on public.students_details
for update
to authenticated
using (
  user_id = (
    select id
    from public.user_directory
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  user_id = (
    select id
    from public.user_directory
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

create policy students_details_delete_own
on public.students_details
for delete
to authenticated
using (
  user_id = (
    select id
    from public.user_directory
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

-- Keep the admin directory in sync when onboarding data is saved.
-- This makes onboarding completion authoritative even if the client-side
-- follow-up update is skipped or interrupted.
create or replace function public.sync_user_directory_on_profile_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  target_user_id := coalesce(new.user_id, old.user_id);

  if target_user_id is null then
    return coalesce(new, old);
  end if;

  update public.user_directory
  set
    onboarding_complete = true,
    status = case
      when lower(coalesce(status, '')) in ('pending', 'approved') then 'active'
      else status
    end,
    account_status = case
      when lower(coalesce(account_status, '')) in ('pending', 'inactive') then 'active'
      else account_status
    end,
    updated_at = now()
  where id = target_user_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_students_details_sync_user_directory on public.students_details;
create trigger trg_students_details_sync_user_directory
after insert or update on public.students_details
for each row
execute function public.sync_user_directory_on_profile_save();

drop trigger if exists trg_staff_details_sync_user_directory on public.staff_details;
create trigger trg_staff_details_sync_user_directory
after insert or update on public.staff_details
for each row
execute function public.sync_user_directory_on_profile_save();

drop trigger if exists trg_hod_details_sync_user_directory on public.hod_details;
create trigger trg_hod_details_sync_user_directory
after insert or update on public.hod_details
for each row
execute function public.sync_user_directory_on_profile_save();

drop trigger if exists trg_principal_details_sync_user_directory on public.principal_details;
create trigger trg_principal_details_sync_user_directory
after insert or update on public.principal_details
for each row
execute function public.sync_user_directory_on_profile_save();

drop trigger if exists trg_warden_details_sync_user_directory on public.warden_details;
create trigger trg_warden_details_sync_user_directory
after insert or update on public.warden_details
for each row
execute function public.sync_user_directory_on_profile_save();

-- Backfill users who already completed onboarding but were left pending.
update public.user_directory ud
set
  onboarding_complete = true,
  status = case
    when lower(coalesce(ud.status, '')) in ('pending', 'approved') then 'active'
    else ud.status
  end,
  account_status = case
    when lower(coalesce(ud.account_status, '')) in ('pending', 'inactive') then 'active'
    else ud.account_status
  end,
  updated_at = now()
where exists (
  select 1
  from (
    select user_id from public.students_details
    union
    select user_id from public.staff_details
    union
    select user_id from public.hod_details
    union
    select user_id from public.principal_details
    union
    select user_id from public.warden_details
  ) profiles
  where profiles.user_id = ud.id
);
