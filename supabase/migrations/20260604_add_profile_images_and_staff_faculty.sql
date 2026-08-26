-- Persist student avatars in Supabase Storage and allow staff-role users to appear as mentor/advisor options.

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists profile_images_public_read on storage.objects;
drop policy if exists profile_images_authenticated_insert on storage.objects;
drop policy if exists profile_images_authenticated_update on storage.objects;
drop policy if exists profile_images_authenticated_delete on storage.objects;

create policy profile_images_public_read
on storage.objects
for select
using (bucket_id = 'profile-images');

create policy profile_images_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy profile_images_authenticated_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy profile_images_authenticated_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- The live user_profile_view already exists in this project. We avoid replacing it here
-- because older deployments may have additional columns. The app now reads profile_image_url
-- directly from user_directory, so this migration only needs the storage and policy setup above.
y