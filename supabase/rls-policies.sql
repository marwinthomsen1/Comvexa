alter table companies enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table employees enable row level security;
alter table services enable row level security;
alter table tasks enable row level security;
alter table bookings enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table supplier_bills enable row level security;
alter table documents enable row level security;
alter table inventory_items enable row level security;
alter table branches enable row level security;

create policy "authenticated users can create companies"
on companies for insert
to authenticated
with check (true);

create policy "users can view their company"
on companies for select
to authenticated
using (
  id = (
    select company_id
    from profiles
    where profiles.id = auth.uid()
  )
);

create policy "users can update their company"
on companies for update
to authenticated
using (
  id = (
    select company_id
    from profiles
    where profiles.id = auth.uid()
  )
)
with check (
  id = (
    select company_id
    from profiles
    where profiles.id = auth.uid()
  )
);

create policy "users can create their own profile"
on profiles for insert
to authenticated
with check (id = auth.uid());

create policy "users can view their own profile"
on profiles for select
to authenticated
using (id = auth.uid());

create policy "users can update their own profile"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "company users can view customers"
on customers for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create customers"
on customers for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update customers"
on customers for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete customers"
on customers for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view employees"
on employees for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create employees"
on employees for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update employees"
on employees for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete employees"
on employees for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view services"
on services for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create services"
on services for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update services"
on services for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete services"
on services for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view tasks"
on tasks for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create tasks"
on tasks for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update tasks"
on tasks for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete tasks"
on tasks for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view bookings"
on bookings for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create bookings"
on bookings for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update bookings"
on bookings for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete bookings"
on bookings for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view invoices"
on invoices for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create invoices"
on invoices for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update invoices"
on invoices for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete invoices"
on invoices for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view invoice items"
on invoice_items for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create invoice items"
on invoice_items for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update invoice items"
on invoice_items for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete invoice items"
on invoice_items for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view payments"
on payments for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create payments"
on payments for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update payments"
on payments for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete payments"
on payments for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view expenses"
on expenses for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create expenses"
on expenses for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update expenses"
on expenses for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete expenses"
on expenses for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view supplier bills"
on supplier_bills for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create supplier bills"
on supplier_bills for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update supplier bills"
on supplier_bills for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete supplier bills"
on supplier_bills for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view documents"
on documents for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create documents"
on documents for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update documents"
on documents for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete documents"
on documents for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view inventory items"
on inventory_items for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create inventory items"
on inventory_items for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update inventory items"
on inventory_items for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete inventory items"
on inventory_items for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can view branches"
on branches for select
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can create branches"
on branches for insert
to authenticated
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can update branches"
on branches for update
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()))
with check (company_id = (select company_id from profiles where id = auth.uid()));

create policy "company users can delete branches"
on branches for delete
to authenticated
using (company_id = (select company_id from profiles where id = auth.uid()));
