-- CLICIO MVP Schema
-- Run this in Supabase SQL Editor

-- 1. TENANTS
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  address text,
  phone text,
  email text,
  created_at timestamptz default now()
);

-- 2. PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  tenant_id uuid not null references tenants(id),
  email text not null,
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz default now()
);

-- 3. CUSTOMERS
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  phone text,
  vehicle text,
  plate text,
  stamps integer default 0,
  created_at timestamptz default now()
);

-- 4. SERVICES
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  price integer,
  duration integer,
  created_at timestamptz default now()
);

-- 5. BOOKINGS
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  booking_date date not null,
  booking_time time not null,
  status text not null default 'reserved' check (status in ('reserved', 'waiting', 'in_progress', 'ready', 'delivered')),
  created_at timestamptz default now()
);

-- 6. LOYALTY RULES
create table if not exists loyalty_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  required_stamps integer not null,
  reward_name text not null,
  created_at timestamptz default now()
);

-- 7. STAMP HISTORY
create table if not exists stamp_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  booking_id uuid references bookings(id),
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_profiles_tenant_id on profiles(tenant_id);
create index if not exists idx_customers_tenant_id on customers(tenant_id);
create index if not exists idx_services_tenant_id on services(tenant_id);
create index if not exists idx_bookings_tenant_id on bookings(tenant_id);
create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_stamp_history_tenant_id on stamp_history(tenant_id);
create index if not exists idx_customers_phone on customers(phone);

-- ENABLE RLS
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table loyalty_rules enable row level security;
alter table stamp_history enable row level security;

-- RLS POLICIES FOR TENANTS
create policy "tenant_insert" on tenants for insert to authenticated with check (true);

create policy "tenant_select" on tenants for select to authenticated using (
  id = (select tenant_id from profiles where id = auth.uid())
);

create policy "tenant_update" on tenants for update to authenticated using (
  id = (select tenant_id from profiles where id = auth.uid())
) with check (
  id = (select tenant_id from profiles where id = auth.uid())
);

-- RLS POLICIES FOR PROFILES (split to avoid circular reference)
create policy "profile_select_own" on profiles for select to authenticated using (
  id = auth.uid()
);

create policy "profile_select_tenant" on profiles for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "profile_insert" on profiles for insert to authenticated with check (id = auth.uid());

create policy "profile_update" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- RLS POLICIES FOR CUSTOMERS
create policy "customer_select" on customers for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "customer_insert" on customers for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);

create policy "customer_update" on customers for update to authenticated using (
  tenant_id = public.get_user_tenant_id()
) with check (
  tenant_id = public.get_user_tenant_id()
);

-- RLS POLICIES FOR SERVICES
create policy "service_select" on services for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "service_insert" on services for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);

create policy "service_update" on services for update to authenticated using (
  tenant_id = public.get_user_tenant_id()
) with check (
  tenant_id = public.get_user_tenant_id()
);

create policy "service_delete" on services for delete to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

-- RLS POLICIES FOR BOOKINGS
create policy "booking_select" on bookings for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "booking_insert" on bookings for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);

create policy "booking_update" on bookings for update to authenticated using (
  tenant_id = public.get_user_tenant_id()
) with check (
  tenant_id = public.get_user_tenant_id()
);

-- RLS POLICIES FOR LOYALTY
create policy "loyalty_select" on loyalty_rules for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "loyalty_insert" on loyalty_rules for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);

create policy "loyalty_update" on loyalty_rules for update to authenticated using (
  tenant_id = public.get_user_tenant_id()
) with check (
  tenant_id = public.get_user_tenant_id()
);

create policy "loyalty_delete" on loyalty_rules for delete to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

-- RLS POLICIES FOR STAMP HISTORY
create policy "stamp_select" on stamp_history for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "stamp_insert" on stamp_history for insert to authenticated with check (
  tenant_id = public.get_user_tenant_id()
);

-- PUBLIC ACCESS: tenant public site
create policy "tenant_public_select" on tenants for select to anon using (true);

create policy "customer_public_insert" on customers for insert to anon with check (true);

create policy "service_public_select" on services for select to anon using (true);

-- Function: Get tenant by slug (for public site)
create or replace function get_tenant_by_slug(slug text)
returns table (
  id uuid, name text, slug text, logo_url text, address text, phone text, email text
)
language sql
security invoker
stable
as $$
  select id, name, slug, logo_url, address, phone, email
  from tenants
  where tenants.slug = slug;
$$;

-- Function: Get tenant_id for current user (bypasses RLS to avoid infinite recursion)
create or replace function public.get_user_tenant_id()
returns uuid
language sql
security definer
stable
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

revoke execute on function public.get_user_tenant_id from anon, public;
grant execute on function public.get_user_tenant_id to authenticated;

-- Function: Create tenant on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  tenant_id uuid;
  tenant_slug text;
begin
  tenant_slug := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'taller_nombre', 'taller'), '[^a-z0-9]+', '-', 'g'));
  tenant_slug := tenant_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.tenants (name, slug, email)
  values (coalesce(new.raw_user_meta_data ->> 'taller_nombre', 'Mi Taller'), tenant_slug, new.email)
  returning id into tenant_id;

  insert into public.profiles (id, tenant_id, email, role)
  values (new.id, tenant_id, new.email, 'owner');

  return new;
end;
$$;

-- Trigger: Create tenant + profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Revoke public execute on trigger functions
revoke execute on function handle_new_user from anon, authenticated;

-- Function: Add stamp when booking delivered
create or replace function handle_booking_delivered()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'delivered' and (old.status is null or old.status != 'delivered') then
    insert into public.stamp_history (tenant_id, customer_id, booking_id)
    values (new.tenant_id, new.customer_id, new.id);
    update public.customers set stamps = stamps + 1
    where id = new.customer_id;
  end if;
  return new;
end;
$$;

revoke execute on function handle_booking_delivered from anon, authenticated;

drop trigger if exists on_booking_delivered on bookings;
create trigger on_booking_delivered
  after update on bookings
  for each row execute function handle_booking_delivered();

-- 8. REWARD NOTIFICATIONS
create table if not exists reward_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  reward_id uuid not null references loyalty_rules(id),
  notified bool default false,
  created_at timestamptz default now()
);

alter table reward_notifications enable row level security;

create policy "reward_notification_select" on reward_notifications for select to authenticated using (
  tenant_id = public.get_user_tenant_id()
);

create policy "reward_notification_update" on reward_notifications for update to authenticated using (
  tenant_id = public.get_user_tenant_id()
) with check (
  tenant_id = public.get_user_tenant_id()
);

create index if not exists idx_reward_notifications_tenant_id on reward_notifications(tenant_id);
create index if not exists idx_reward_notifications_customer_id on reward_notifications(customer_id);

-- Function: Check reward eligibility when stamps change
create or replace function check_reward_eligibility()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.stamps > old.stamps then
    insert into public.reward_notifications (tenant_id, customer_id, reward_id)
    select new.tenant_id, new.id, lr.id
    from public.loyalty_rules lr
    where lr.tenant_id = new.tenant_id
      and new.stamps >= lr.required_stamps
      and not exists (
        select 1 from public.reward_notifications rn
        where rn.customer_id = new.id and rn.reward_id = lr.id
      );
  end if;
  return new;
end;
$$;

revoke execute on function check_reward_eligibility from anon, authenticated;

drop trigger if exists on_customer_stamps_update on customers;
create trigger on_customer_stamps_update
  after update on customers
  for each row execute function check_reward_eligibility();

-- Additional FK indexes
create index if not exists idx_bookings_customer_id on bookings(customer_id);
create index if not exists idx_bookings_service_id on bookings(service_id);
create index if not exists idx_loyalty_rules_tenant_id on loyalty_rules(tenant_id);
create index if not exists idx_stamp_history_booking_id on stamp_history(booking_id);
create index if not exists idx_stamp_history_customer_id on stamp_history(customer_id);
