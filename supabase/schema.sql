create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  address text,
  logo_url text,
  plan text default 'basic',
  created_at timestamp default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  full_name text,
  role text default 'owner',
  created_at timestamp default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamp default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  phone text,
  email text,
  position text,
  salary numeric,
  status text default 'active',
  start_date date,
  notes text,
  created_at timestamp default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  description text,
  price numeric,
  duration_minutes integer,
  status text default 'active',
  created_at timestamp default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text,
  description text,
  assigned_to uuid references employees(id) on delete set null,
  status text default 'pending',
  priority text default 'normal',
  due_date date,
  created_at timestamp default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  booking_date date,
  start_time time,
  end_time time,
  status text default 'pending',
  notes text,
  created_at timestamp default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  invoice_number text,
  total_amount numeric,
  payment_status text default 'unpaid',
  due_date date,
  created_at timestamp default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete cascade,
  description text,
  quantity numeric,
  unit_price numeric,
  total numeric,
  created_at timestamp default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  amount numeric,
  payment_method text,
  payment_date date,
  notes text,
  created_at timestamp default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text,
  category text,
  amount numeric,
  tax_amount numeric,
  expense_date date,
  payment_method text,
  vendor text,
  notes text,
  created_at timestamp default now()
);

create table if not exists supplier_bills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  supplier_name text,
  bill_number text,
  total_amount numeric,
  payment_status text default 'unpaid',
  due_date date,
  notes text,
  created_at timestamp default now()
);

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

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text,
  file_url text,
  document_type text,
  expiry_date date,
  notes text,
  created_at timestamp default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  quantity numeric,
  unit text,
  low_stock_alert numeric,
  supplier text,
  created_at timestamp default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text,
  address text,
  phone text,
  created_at timestamp default now()
);

-- Row Level Security policies will be added later so authenticated users can
-- only access records that belong to their profile.company_id.
