-- 1. Create the meeting-previews bucket
insert into storage.buckets (id, name, public)
values ('meeting-previews', 'meeting-previews', true)
on conflict (id) do update set public = true;

-- 2. Create policies for the meeting-previews bucket
-- ALLOW PUBLIC READ
create policy "Meeting previews are publicly accessible" 
on storage.objects for select 
using (bucket_id = 'meeting-previews');

-- ALLOW INDIVIDUAL CONTROL (Insert/Update/Delete)
create policy "Users can manage their own meeting previews" 
on storage.objects for all 
using (
  bucket_id = 'meeting-previews' 
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meeting-previews' 
  and (storage.foldername(name))[1] = auth.uid()::text
);
