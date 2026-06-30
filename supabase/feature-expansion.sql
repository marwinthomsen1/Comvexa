create table if not exists recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text,
  customer_name text,
  amount numeric,
  frequency text default 'monthly',
  next_invoice_date date,
  status text default 'active',
  notes text,
  created_at timestamp default now()
);

create table if not exists staff_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  employee_name text,
  work_date date,
  start_time time,
  end_time time,
  location text,
  notes text,
  created_at timestamp default now()
);

create table if not exists whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  category text,
  message text,
  status text default 'active',
  created_at timestamp default now()
);

create table if not exists user_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_email text,
  role text default 'staff',
  module text,
  access_level text default 'view',
  created_at timestamp default now()
);

alter table recurring_invoices enable row level security;
alter table staff_schedules enable row level security;
alter table whatsapp_templates enable row level security;
alter table user_permissions enable row level security;

do $$
declare
  table_name text;
  policy_table text;
  action text;
begin
  foreach table_name in array array[
    'recurring_invoices',
    'staff_schedules',
    'whatsapp_templates',
    'user_permissions'
  ]
  loop
    foreach action in array array['view', 'create', 'update', 'delete']
    loop
      policy_table := format('company users can %s %s', action, replace(table_name, '_', ' '));

      if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = table_name
          and policyname = policy_table
      ) then
        if action = 'view' then
          execute format(
            'create policy %I on %I for select to authenticated using (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_table,
            table_name
          );
        elsif action = 'create' then
          execute format(
            'create policy %I on %I for insert to authenticated with check (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_table,
            table_name
          );
        elsif action = 'update' then
          execute format(
            'create policy %I on %I for update to authenticated using (company_id = (select company_id from profiles where id = auth.uid())) with check (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_table,
            table_name
          );
        else
          execute format(
            'create policy %I on %I for delete to authenticated using (company_id = (select company_id from profiles where id = auth.uid()))',
            policy_table,
            table_name
          );
        end if;
      end if;
    end loop;
  end loop;
end $$;
