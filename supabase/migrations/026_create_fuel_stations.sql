-- =========================================================
-- Masroufi
-- Migration 026: Fixed UAE fuel station master data
-- =========================================================

create table if not exists public.fuel_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_path text not null,
  brand_color text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.fuel_stations to authenticated;
alter table public.fuel_stations enable row level security;

create policy "fuel_stations_read_authenticated"
on public.fuel_stations for select to authenticated
using (true);

insert into public.fuel_stations (name, slug, logo_path, brand_color, sort_order)
values
  ('ENOC', 'enoc', '/fuel-stations/enoc.svg', '#F6B900', 1),
  ('ADNOC', 'adnoc', '/fuel-stations/adnoc.svg', '#0B5CAB', 2),
  ('Emarat', 'emarat', '/fuel-stations/emarat.svg', '#008C45', 3)
on conflict (slug) do update set
  name = excluded.name,
  logo_path = excluded.logo_path,
  brand_color = excluded.brand_color,
  sort_order = excluded.sort_order,
  is_active = true;
