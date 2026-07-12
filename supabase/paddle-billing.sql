alter table companies
  add column if not exists subscription_status text default 'inactive',
  add column if not exists payment_provider text,
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists billing_cycle text,
  add column if not exists trial_started_at timestamp,
  add column if not exists trial_ends_at timestamp,
  add column if not exists cancellation_scheduled_at timestamptz,
  add column if not exists cancellation_effective_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_retention_factor text,
  add column if not exists cancellation_feedback text,
  add column if not exists cancellation_requested_by uuid references auth.users(id) on delete set null,
  add column if not exists cancellation_withdrawn_at timestamptz;

create index if not exists companies_paddle_subscription_id_idx
  on companies (paddle_subscription_id);
