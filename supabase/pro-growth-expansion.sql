-- Pro growth workflows. Run after schema.sql and basic-plan-expansion.sql.

create table if not exists sales_leads (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, company_name text, email text, phone text, value numeric, stage text default 'new',
  next_action text, next_action_date date, source text, notes text, created_at timestamptz default now()
);
create table if not exists team_invitations (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  email text, full_name text, role text default 'staff', status text default 'pending',
  invited_at timestamptz default now(), accepted_at timestamptz, created_at timestamptz default now()
);
create table if not exists employee_leave (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  employee_name text, leave_type text, start_date date, end_date date, status text default 'pending',
  notes text, created_at timestamptz default now()
);
create table if not exists timesheets (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  employee_name text, work_date date, hours numeric, billable_hours numeric, hourly_rate numeric,
  project text, status text default 'draft', notes text, created_at timestamptz default now()
);
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  employee_name text, period text, revenue numeric, commission_rate numeric, commission_amount numeric,
  status text default 'pending', notes text, created_at timestamptz default now()
);
create table if not exists credit_notes (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  invoice_number text, customer_name text, credit_number text, amount numeric, reason text,
  status text default 'draft', issued_date date, created_at timestamptz default now()
);
create table if not exists customer_statements (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  customer_name text, customer_email text, period_start date, period_end date, opening_balance numeric,
  invoiced numeric, paid numeric, closing_balance numeric, status text default 'draft', created_at timestamptz default now()
);
create table if not exists report_schedules (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, report_type text, frequency text default 'monthly', recipient_email text,
  next_send_date date, status text default 'active', created_at timestamptz default now()
);
create table if not exists booking_settings (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade unique,
  public_slug text unique, public_booking_enabled boolean default false, deposit_type text default 'none',
  deposit_amount numeric default 0, cancellation_hours integer default 24, confirmation_enabled boolean default true,
  reminder_enabled boolean default true, calendar_feed_token uuid default gen_random_uuid(),
  calendar_feed_enabled boolean default true, created_at timestamptz default now()
);

alter table quotes add column if not exists decision_status text default 'pending',
  add column if not exists decided_at timestamptz,
  add column if not exists signer_name text,
  add column if not exists signature_text text,
  add column if not exists revision_number integer default 1;
alter table bookings add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists deposit_amount numeric default 0,
  add column if not exists deposit_status text default 'not_required',
  add column if not exists cancellation_reason text,
  add column if not exists no_show boolean default false,
  add column if not exists confirmation_sent_at timestamptz;
alter table invoices add column if not exists late_fee numeric default 0,
  add column if not exists reminders_enabled boolean default true,
  add column if not exists last_reminder_at timestamptz,
  add column if not exists reminder_count integer default 0;
alter table tasks add column if not exists recurrence text,
  add column if not exists next_recurrence_date date;
alter table documents add column if not exists reminder_days integer default 30;

do $$
declare table_name text;
begin
  foreach table_name in array array['sales_leads','team_invitations','employee_leave','timesheets','commissions','credit_notes','customer_statements','report_schedules','booking_settings']
  loop
    execute format('alter table %I enable row level security', table_name);
    execute format('drop policy if exists "company users can manage %s" on %I', table_name, table_name);
    execute format('create policy "company users can manage %s" on %I for all to authenticated using (company_id = (select company_id from profiles where id = auth.uid())) with check (company_id = (select company_id from profiles where id = auth.uid()))', table_name, table_name);
    if to_regprocedure('public.company_can_access_plan(text)') is not null then
      execute format('drop policy if exists "subscription plan access" on %I', table_name);
      execute format('create policy "subscription plan access" on %I as restrictive for all to authenticated using (public.company_can_access_plan(''pro'')) with check (public.company_can_access_plan(''pro''))', table_name);
    end if;
  end loop;
end $$;
