-- AutoMaster marketplace schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Administrator',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  make text not null,
  model text not null,
  year integer not null check (year between 1950 and 2035),
  price numeric(12,2) not null check (price >= 0),
  mileage integer not null default 0 check (mileage >= 0),
  fuel text not null default 'Petrol',
  transmission text not null default 'Automatic',
  body_style text not null default 'Other',
  exterior_color text not null default '',
  description text not null default '',
  image_url text,
  status text not null default 'available' check (status in ('available','reserved','sold')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_public_listing_idx on public.vehicles(status, featured desc, created_at desc);
create index if not exists vehicles_make_price_idx on public.vehicles(make, price);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  customer_name text not null check (length(customer_name) between 2 and 120),
  email text not null check (length(email) between 3 and 320),
  phone text not null default '' check (length(phone) <= 80),
  message text not null check (length(message) between 5 and 4000),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_idx on public.enquiries(created_at desc);
create index if not exists enquiries_status_idx on public.enquiries(status, created_at desc);

alter table public.admin_users enable row level security;
alter table public.vehicles enable row level security;
alter table public.enquiries enable row level security;

grant select on public.admin_users to authenticated;
grant select on public.vehicles to anon, authenticated;
grant insert, update, delete on public.vehicles to authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, update on public.enquiries to authenticated;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users" on public.admin_users for select to authenticated using (public.is_admin());

drop policy if exists "public can read available vehicles" on public.vehicles;
create policy "public can read available vehicles" on public.vehicles for select to anon, authenticated using (status = 'available' or public.is_admin());
drop policy if exists "admins can insert vehicles" on public.vehicles;
create policy "admins can insert vehicles" on public.vehicles for insert to authenticated with check (public.is_admin());
drop policy if exists "admins can update vehicles" on public.vehicles;
create policy "admins can update vehicles" on public.vehicles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins can delete vehicles" on public.vehicles;
create policy "admins can delete vehicles" on public.vehicles for delete to authenticated using (public.is_admin());

drop policy if exists "anyone can send an enquiry" on public.enquiries;
create policy "anyone can send an enquiry" on public.enquiries for insert to anon, authenticated with check (status = 'new');
drop policy if exists "admins can read enquiries" on public.enquiries;
create policy "admins can read enquiries" on public.enquiries for select to authenticated using (public.is_admin());
drop policy if exists "admins can update enquiries" on public.enquiries;
create policy "admins can update enquiries" on public.enquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public image delivery; writes stay restricted to admin accounts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicles', 'vehicles', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "public can view vehicle images" on storage.objects;
create policy "public can view vehicle images" on storage.objects for select using (bucket_id = 'vehicles');
drop policy if exists "admins can upload vehicle images" on storage.objects;
create policy "admins can upload vehicle images" on storage.objects for insert to authenticated with check (bucket_id = 'vehicles' and public.is_admin());
drop policy if exists "admins can update vehicle images" on storage.objects;
create policy "admins can update vehicle images" on storage.objects for update to authenticated using (bucket_id = 'vehicles' and public.is_admin()) with check (bucket_id = 'vehicles' and public.is_admin());
drop policy if exists "admins can delete vehicle images" on storage.objects;
create policy "admins can delete vehicle images" on storage.objects for delete to authenticated using (bucket_id = 'vehicles' and public.is_admin());
