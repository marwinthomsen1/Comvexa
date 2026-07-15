-- Apply after schema.sql, feature-expansion.sql, and ultra-modules.sql.
-- Protect tenant identity and billing fields, then enforce subscription plans in RLS.

create or replace function public.protect_profile_tenant_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
    new.company_id is distinct from old.company_id or
    new.role is distinct from old.role
  ) then
    raise exception 'Only an administrator can change profile company or role.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_tenant_fields on public.profiles;
create trigger protect_profile_tenant_fields
before update of company_id, role on public.profiles
for each row execute function public.protect_profile_tenant_fields();

create or replace function public.protect_company_billing_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
    new.plan is distinct from old.plan or
    new.subscription_status is distinct from old.subscription_status or
    new.payment_provider is distinct from old.payment_provider or
    new.paddle_customer_id is distinct from old.paddle_customer_id or
    new.paddle_subscription_id is distinct from old.paddle_subscription_id or
    new.billing_cycle is distinct from old.billing_cycle or
    new.trial_started_at is distinct from old.trial_started_at or
    new.trial_ends_at is distinct from old.trial_ends_at or
    new.cancellation_scheduled_at is distinct from old.cancellation_scheduled_at or
    new.cancellation_effective_at is distinct from old.cancellation_effective_at or
    new.cancellation_reason is distinct from old.cancellation_reason or
    new.cancellation_retention_factor is distinct from old.cancellation_retention_factor or
    new.cancellation_feedback is distinct from old.cancellation_feedback or
    new.cancellation_requested_by is distinct from old.cancellation_requested_by or
    new.cancellation_withdrawn_at is distinct from old.cancellation_withdrawn_at
  ) then
    raise exception 'Billing fields can only be changed by a trusted server process.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_company_billing_fields on public.companies;
create trigger protect_company_billing_fields
before update on public.companies
for each row execute function public.protect_company_billing_fields();

-- Company creation is handled by the security-definer auth trigger.
revoke insert on public.companies from authenticated;

create or replace function public.company_can_access_plan(required_plan text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.companies c on c.id = p.company_id
    where p.id = auth.uid()
      and (
        c.subscription_status = 'active'
        or (
          c.subscription_status = 'trialing'
          and c.trial_ends_at is not null
          and c.trial_ends_at > now()
        )
      )
      and case lower(coalesce(c.plan, 'basic'))
        when 'ultra' then 3
        when 'pro' then 2
        else 1
      end >= case lower(required_plan)
        when 'ultra' then 3
        when 'pro' then 2
        else 1
      end
  );
$$;

revoke all on function public.company_can_access_plan(text) from public;
grant execute on function public.company_can_access_plan(text) to authenticated;

do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('customers', 'basic'),
      ('services', 'basic'),
      ('tasks', 'basic'),
      ('invoices', 'basic'),
      ('invoice_items', 'basic'),
      ('payments', 'basic'),
      ('expenses', 'basic'),
      ('employees', 'pro'),
      ('bookings', 'pro'),
      ('documents', 'pro'),
      ('recurring_invoices', 'pro'),
      ('staff_schedules', 'pro'),
      ('whatsapp_templates', 'pro'),
      ('supplier_bills', 'ultra'),
      ('inventory_items', 'ultra'),
      ('branches', 'ultra'),
      ('user_permissions', 'ultra'),
      ('purchase_orders', 'ultra'),
      ('time_attendance', 'ultra'),
      ('approval_requests', 'ultra'),
      ('audit_logs', 'ultra'),
      ('automation_rules', 'ultra'),
      ('customer_portal_items', 'ultra'),
      ('branch_analytics', 'ultra'),
      ('white_label_tasks', 'ultra'),
      ('data_import_jobs', 'ultra'),
      ('ai_assistant_notes', 'ultra')
    ) as plans(table_name, required_plan)
  loop
    if to_regclass(format('public.%I', target.table_name)) is not null then
      execute format('drop policy if exists "subscription plan access" on public.%I', target.table_name);
      execute format(
        'create policy "subscription plan access" on public.%I as restrictive for all to authenticated using (public.company_can_access_plan(%L)) with check (public.company_can_access_plan(%L))',
        target.table_name,
        target.required_plan,
        target.required_plan
      );
    end if;
  end loop;
end;
$$;
