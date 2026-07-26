-- Basic-plan workflow expansion: quotes, customer-linked invoice delivery,
-- and receipt evidence. Run this after schema.sql on existing projects.

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  quote_number text,
  customer_name text,
  customer_email text,
  total_amount numeric,
  status text default 'draft',
  valid_until date,
  notes text,
  converted_invoice_id uuid references invoices(id) on delete set null,
  created_at timestamp default now()
);

alter table invoices
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists notes text;

alter table expenses
  add column if not exists receipt_url text;

create index if not exists quotes_company_id_idx on quotes (company_id);
create index if not exists quotes_customer_id_idx on quotes (customer_id);

alter table quotes enable row level security;

drop policy if exists "company users can manage quotes" on quotes;
create policy "company users can manage quotes"
on quotes
for all
to authenticated
using (
  company_id = (select company_id from profiles where id = auth.uid())
)
with check (
  company_id = (select company_id from profiles where id = auth.uid())
);

do $$
begin
  if to_regprocedure('public.company_can_access_plan(text)') is not null then
    drop policy if exists "subscription plan access" on quotes;
    create policy "subscription plan access"
    on quotes
    as restrictive
    for all
    to authenticated
    using (public.company_can_access_plan('basic'))
    with check (public.company_can_access_plan('basic'));
  end if;
end $$;
