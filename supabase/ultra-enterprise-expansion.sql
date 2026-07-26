-- Ultra enterprise control layer. Run after ultra-modules.sql and security-hardening.sql.

create table if not exists legal_entities (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, registration_number text, country text, base_currency text, tax_number text,
  parent_entity text, status text default 'active', created_at timestamptz default now()
);
create table if not exists cost_centers (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, code text, entity text, branch text, manager text, annual_budget numeric,
  status text default 'active', created_at timestamptz default now()
);
create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, code text, branch text, address text, manager text, warehouse_type text,
  status text default 'active', created_at timestamptz default now()
);
create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  transfer_number text, item text, quantity numeric, from_warehouse text, to_warehouse text,
  transfer_date date, status text default 'planned', notes text, created_at timestamptz default now()
);
create table if not exists inventory_batches (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  item text, sku text, warehouse text, batch_number text, serial_number text, quantity numeric,
  manufactured_date date, expiry_date date, barcode text, status text default 'available', created_at timestamptz default now()
);
create table if not exists stock_counts (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  count_name text, warehouse text, count_type text, scheduled_date date, counted_items integer,
  variance_value numeric, owner text, status text default 'planned', created_at timestamptz default now()
);
create table if not exists supplier_quotes (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  request_number text, supplier text, item text, quantity numeric, quoted_amount numeric,
  valid_until date, lead_time_days integer, score numeric, status text default 'received', created_at timestamptz default now()
);
create table if not exists goods_receipts (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  receipt_number text, purchase_order text, supplier text, warehouse text, received_date date,
  quantity_ordered numeric, quantity_received numeric, bill_number text, match_status text default 'pending',
  status text default 'received', created_at timestamptz default now()
);
create table if not exists supplier_scorecards (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  supplier text, period text, quality_score numeric, delivery_score numeric, price_score numeric,
  issue_count integer, overall_score numeric, status text default 'active', created_at timestamptz default now()
);
create table if not exists business_contracts (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  contract_name text, counterparty text, contract_type text, start_date date, renewal_date date,
  annual_value numeric, owner text, notice_days integer, status text default 'active', created_at timestamptz default now()
);
create table if not exists enterprise_security_policies (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  policy_name text, policy_type text, provider text, enforcement text, configuration text,
  last_reviewed date, owner text, status text default 'draft', created_at timestamptz default now()
);
create table if not exists integration_connections (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, provider text, connection_type text, environment text, endpoint_url text,
  credential_reference text, last_sync_at timestamptz, status text default 'disconnected', created_at timestamptz default now()
);
create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, endpoint_url text, event_types text, signing_secret_reference text,
  last_delivery_at timestamptz, failure_count integer default 0, status text default 'active', created_at timestamptz default now()
);
create table if not exists custom_fields (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  module text, field_name text, field_key text, field_type text, options text, required boolean default false,
  display_order integer, status text default 'active', created_at timestamptz default now()
);
create table if not exists enterprise_budgets (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, entity text, branch text, cost_center text, fiscal_period text, budget_amount numeric,
  actual_amount numeric, forecast_amount numeric, owner text, status text default 'active', created_at timestamptz default now()
);
create table if not exists enterprise_projects (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  project_name text, customer text, manager text, start_date date, target_date date, budget numeric,
  cost_to_date numeric, revenue_to_date numeric, completion_percent numeric, status text default 'active', created_at timestamptz default now()
);
create table if not exists custom_dashboards (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, audience text, metrics text, filters text, refresh_frequency text,
  owner text, shared boolean default false, status text default 'draft', created_at timestamptz default now()
);
create table if not exists enterprise_support_requests (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  subject text, request_type text, priority text, requested_by text, owner text, target_date date,
  details text, status text default 'open', created_at timestamptz default now()
);
create table if not exists sandbox_workspaces (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade,
  name text, purpose text, data_mode text, refresh_frequency text, expires_at date,
  owner text, status text default 'planned', created_at timestamptz default now()
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'legal_entities','cost_centers','warehouses','stock_transfers','inventory_batches','stock_counts',
    'supplier_quotes','goods_receipts','supplier_scorecards','business_contracts',
    'enterprise_security_policies','integration_connections','webhook_endpoints','custom_fields',
    'enterprise_budgets','enterprise_projects','custom_dashboards','enterprise_support_requests','sandbox_workspaces'
  ]
  loop
    execute format('alter table %I enable row level security', table_name);
    execute format('drop policy if exists "company users can manage %s" on %I', table_name, table_name);
    execute format('create policy "company users can manage %s" on %I for all to authenticated using (company_id = (select company_id from profiles where id = auth.uid())) with check (company_id = (select company_id from profiles where id = auth.uid()))', table_name, table_name);
    if to_regprocedure('public.company_can_access_plan(text)') is not null then
      execute format('drop policy if exists "subscription plan access" on %I', table_name);
      execute format('create policy "subscription plan access" on %I as restrictive for all to authenticated using (public.company_can_access_plan(''ultra'')) with check (public.company_can_access_plan(''ultra''))', table_name);
    end if;
  end loop;
end $$;
