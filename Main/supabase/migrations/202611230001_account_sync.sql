begin;
create table public.account_sync (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 revision integer not null default 0 check(revision>=0),
 manifest jsonb not null default '{"version":1,"entries":[]}'::jsonb,
 updated_at timestamptz not null default now(),
 check(jsonb_typeof(manifest)='object' and octet_length(manifest::text)<=3000000)
);
alter table public.account_sync enable row level security;
alter table public.account_sync force row level security;
revoke all on public.account_sync from anon;
grant select,insert,update on public.account_sync to authenticated;
create policy account_sync_owner on public.account_sync for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create function public.commit_account_sync(expected_revision integer,next_manifest jsonb) returns integer
language plpgsql security invoker set search_path='' as $$
declare current_revision integer;next_revision integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if expected_revision is null or expected_revision<0 or next_manifest is null or next_manifest->>'version' is distinct from '1' or jsonb_typeof(next_manifest->'entries') is distinct from 'array' or jsonb_array_length(next_manifest->'entries')>5000 then raise exception 'Invalid manifest'; end if;
 insert into public.account_sync(owner_id) values(auth.uid()) on conflict(owner_id) do nothing;
 select revision into current_revision from public.account_sync where owner_id=auth.uid() for update;
 if current_revision<>expected_revision then raise exception 'account_sync_conflict' using errcode='40001'; end if;
 next_revision=current_revision+1;
 update public.account_sync set revision=next_revision,manifest=next_manifest,updated_at=now() where owner_id=auth.uid();
 return next_revision;
end;$$;
revoke all on function public.commit_account_sync(integer,jsonb) from public,anon;
grant execute on function public.commit_account_sync(integer,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('comvexa-account-sync','comvexa-account-sync',false,4194304,array['application/octet-stream']);
create policy comvexa_sync_owner_read on storage.objects for select to authenticated using(bucket_id='comvexa-account-sync' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy comvexa_sync_owner_insert on storage.objects for insert to authenticated with check(bucket_id='comvexa-account-sync' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
