create extension if not exists "pgcrypto";

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  supplier text,
  item text,
  branch text,
  amount numeric,
  expected_date date,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists time_attendance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  employee text,
  record_type text,
  attendance_date date,
  hours numeric,
  manager text,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  request text,
  request_type text,
  requested_by text,
  approver text,
  due_date date,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  event text,
  area text,
  user_name text,
  event_date date,
  risk text default 'low',
  status text default 'active',
  details text,
  created_at timestamp default now()
);

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  trigger_name text,
  action text,
  owner text,
  next_run date,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists customer_portal_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer text,
  portal_item text,
  item_type text,
  due_date date,
  assigned_to text,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists branch_analytics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  branch text,
  period text,
  revenue numeric,
  expenses numeric,
  bookings numeric,
  status text default 'active',
  notes text,
  created_at timestamp default now()
);

create table if not exists white_label_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  asset text,
  asset_type text,
  color text,
  owner text,
  due_date date,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists data_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  source text,
  record_type text,
  rows_count integer,
  owner text,
  target_date date,
  status text default 'planned',
  notes text,
  created_at timestamp default now()
);

create table if not exists ai_assistant_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  prompt text,
  response text,
  created_at timestamp default now()
);

create index if not exists purchase_orders_company_id_idx on purchase_orders(company_id);
create index if not exists time_attendance_company_id_idx on time_attendance(company_id);
create index if not exists approval_requests_company_id_idx on approval_requests(company_id);
create index if not exists audit_logs_company_id_idx on audit_logs(company_id);
create index if not exists automation_rules_company_id_idx on automation_rules(company_id);
create index if not exists customer_portal_items_company_id_idx on customer_portal_items(company_id);
create index if not exists branch_analytics_company_id_idx on branch_analytics(company_id);
create index if not exists white_label_tasks_company_id_idx on white_label_tasks(company_id);
create index if not exists data_import_jobs_company_id_idx on data_import_jobs(company_id);
create index if not exists ai_assistant_notes_company_id_idx on ai_assistant_notes(company_id);

alter table purchase_orders enable row level security;
alter table time_attendance enable row level security;
alter table approval_requests enable row level security;
alter table audit_logs enable row level security;
alter table automation_rules enable row level security;
alter table customer_portal_items enable row level security;
alter table branch_analytics enable row level security;
alter table white_label_tasks enable row level security;
alter table data_import_jobs enable row level security;
alter table ai_assistant_notes enable row level security;

do $$
declare
  target_table text;
  policy_name text;
  action_name text;
begin
  foreach target_table in array array[
    'purchase_orders',
    'time_attendance',
    'approval_requests',
    'audit_logs',
    'automation_rules',
    'customer_portal_items',
    'branch_analytics',
    'white_label_tasks',
    'data_import_jobs',
    'ai_assistant_notes'
  ]
  loop
    foreach action_name in array array['view', 'create', 'update', 'delete']
    loop
      policy_name := format('company users can %s %s', action_name, replace(target_table, '_', ' '));

      if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = target_table
          and policyname = policy_name
      ) then
        if action_name = 'view' then
          execute format(
            'create policy %I on %I for select to authenticated using (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_name,
            target_table
          );
        elsif action_name = 'create' then
          execute format(
            'create policy %I on %I for insert to authenticated with check (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_name,
            target_table
          );
        elsif action_name = 'update' then
          execute format(
            'create policy %I on %I for update to authenticated using (company_id = (select company_id from profiles where id = auth.uid())) with check (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_name,
            target_table
          );
        else
          execute format(
            'create policy %I on %I for delete to authenticated using (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_name,
            target_table
          );
        end if;
      end if;
    end loop;
  end loop;
end $$;
