insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-documents',
  'company-documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "company users can upload pdf documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-documents'
  and (storage.foldername(name))[1] = (
    select company_id::text from public.profiles where id = auth.uid()
  )
);

create policy "company users can view pdf documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-documents'
  and (storage.foldername(name))[1] = (
    select company_id::text from public.profiles where id = auth.uid()
  )
);

create policy "company users can update pdf documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-documents'
  and (storage.foldername(name))[1] = (
    select company_id::text from public.profiles where id = auth.uid()
  )
)
with check (
  bucket_id = 'company-documents'
  and (storage.foldername(name))[1] = (
    select company_id::text from public.profiles where id = auth.uid()
  )
);

create policy "company users can delete pdf documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-documents'
  and (storage.foldername(name))[1] = (
    select company_id::text from public.profiles where id = auth.uid()
  )
);
