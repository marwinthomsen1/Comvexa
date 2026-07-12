create extension if not exists "pgcrypto";

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  country text,
  city text,
  industry text,
  instagram_url text,
  email text,
  whatsapp text,
  website text,
  status text not null default 'New',
  source text not null default 'Manual',
  notes text,
  last_contacted_at timestamp,
  follow_up_at date,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  constraint leads_status_check check (
    status in ('New', 'Contacted', 'Replied', 'Trial Started', 'Customer', 'Not Interested', 'Follow Up Later')
  ),
  constraint leads_source_check check (
    source in ('Instagram', 'Google', 'Facebook', 'Website', 'Referral', 'Manual')
  )
);

create index if not exists leads_company_name_idx on leads(company_name);
create index if not exists leads_country_idx on leads(country);
create index if not exists leads_industry_idx on leads(industry);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_source_idx on leads(source);
create index if not exists leads_follow_up_at_idx on leads(follow_up_at);
create index if not exists leads_created_at_idx on leads(created_at desc);

alter table leads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
      and policyname = 'leads are service role only'
  ) then
    create policy "leads are service role only"
    on leads
    for all
    using (false)
    with check (false);
  end if;
end $$;
