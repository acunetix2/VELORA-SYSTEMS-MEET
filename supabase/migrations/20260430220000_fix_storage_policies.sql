-- 1. Ensure the bucket is public and exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Drop old policies to avoid conflicts
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "User Control" on storage.objects;

-- 3. Create fresh, robust policies
-- ALLOW PUBLIC READ
create policy "Public Access" on storage.objects for select using (bucket_id = 'avatars');

-- ALLOW INDIVIDUAL CONTROL (Insert/Update/Delete)
create policy "User Control" on storage.objects for all 
using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = auth.uid()::text
);
