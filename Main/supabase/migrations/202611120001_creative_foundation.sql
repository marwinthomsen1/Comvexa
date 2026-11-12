-- New, isolated development project ONLY. Never run against the old Comvexa database.
-- Versioned migration; not applied to any Supabase project in Phase 2.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 240),
  created_at timestamptz not null default now()
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  unique(id, owner_id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  canvas_format text not null check (canvas_format in ('square','portrait','story','flyer')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  foreign key (campaign_id, owner_id) references public.campaigns(id, owner_id) on delete restrict
);
create index campaigns_owner_created on public.campaigns(owner_id, created_at desc);
create index projects_owner_created on public.projects(owner_id, created_at desc);
create index projects_campaign_owner on public.projects(campaign_id, owner_id);
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.campaigns enable row level security;
alter table public.campaigns force row level security;
alter table public.projects enable row level security;
alter table public.projects force row level security;
revoke all on public.profiles, public.campaigns, public.projects from anon;
grant select, insert, update, delete on public.profiles, public.campaigns, public.projects to authenticated;
create policy profiles_owner on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy campaigns_owner on public.campaigns for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy projects_owner on public.projects for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
commit;
