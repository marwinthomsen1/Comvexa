create extension if not exists "pgcrypto";

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text,
  email_type text,
  subject text,
  status text,
  resend_id text,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now()
);

create index if not exists email_logs_recipient_idx on email_logs(recipient);
create index if not exists email_logs_email_type_idx on email_logs(email_type);
create index if not exists email_logs_status_idx on email_logs(status);
create index if not exists email_logs_created_at_idx on email_logs(created_at desc);

alter table email_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'email_logs'
      and policyname = 'email logs are service role only'
  ) then
    create policy "email logs are service role only"
    on email_logs
    for all
    using (false)
    with check (false);
  end if;
end $$;
