-- New Comvexa DEVELOPMENT project only. Private, immutable user-owned backups.
-- This does not require or alter the earlier planning-metadata tables.
begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('comvexa-library-backups','comvexa-library-backups',false,52428800,array['application/json']);
create policy comvexa_backup_owner_read on storage.objects
for select to authenticated
using (bucket_id='comvexa-library-backups' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy comvexa_backup_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id='comvexa-library-backups' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
