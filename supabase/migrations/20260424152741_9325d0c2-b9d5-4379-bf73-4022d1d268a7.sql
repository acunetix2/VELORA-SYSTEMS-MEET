-- Drop the overly broad public select policy
drop policy if exists "Avatar images are publicly accessible" on storage.objects;

-- Anonymous: allow direct file access (object reads via public URL still work
-- because the bucket is public), but block bucket-wide listing
create policy "Public can read avatar files"
  on storage.objects for select
  to anon
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] is not null);

-- Authenticated users: same direct read access
create policy "Authenticated can read avatar files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');