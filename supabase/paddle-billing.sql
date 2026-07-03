alter table companies
  add column if not exists subscription_status text default 'inactive',
  add column if not exists payment_provider text,
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists billing_cycle text;

create index if not exists companies_paddle_subscription_id_idx
  on companies (paddle_subscription_id);
