-- =========================================================
-- Masroufi
-- Migration 025: Dedicated fuel module
-- =========================================================

create type public.fuel_type as enum (
  'e_plus_91',
  'special_95',
  'super_98',
  'diesel',
  'other'
);

create table public.fuel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  station_name text not null check (char_length(trim(station_name)) between 1 and 100),
  fuel_type public.fuel_type not null,
  price_per_liter numeric(10,3) not null check (price_per_liter > 0),
  liters numeric(10,3) not null check (liters > 0),
  total numeric(14,2) not null check (total > 0),
  currency public.currency_code not null,
  odometer_km numeric(12,1) check (odometer_km is null or odometer_km >= 0),
  fuel_date date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fuel_total_matches check (abs(round(price_per_liter * liters, 2) - total) <= 0.02)
);

create index fuel_entries_user_date_idx on public.fuel_entries(user_id, fuel_date desc);
create index fuel_entries_account_idx on public.fuel_entries(account_id);
create index fuel_entries_station_idx on public.fuel_entries(user_id, lower(station_name));

create trigger fuel_entries_set_updated_at
before update on public.fuel_entries
for each row execute function public.set_updated_at();

grant usage on type public.fuel_type to authenticated;
grant select, insert, update, delete on public.fuel_entries to authenticated;

alter table public.fuel_entries enable row level security;
create policy "fuel_entries_select_own" on public.fuel_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "fuel_entries_insert_own" on public.fuel_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "fuel_entries_update_own" on public.fuel_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "fuel_entries_delete_own" on public.fuel_entries for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.create_fuel_entry(
  p_account_id uuid,
  p_station_name text,
  p_fuel_type public.fuel_type,
  p_price_per_liter numeric,
  p_liters numeric,
  p_total numeric,
  p_odometer_km numeric,
  p_fuel_date date,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_currency public.currency_code;
  v_category_id uuid;
  v_transaction_id uuid;
  v_fuel_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select currency into v_currency from public.accounts
  where id = p_account_id and user_id = v_user_id and is_active = true;
  if v_currency is null then raise exception 'Account not found'; end if;

  select id into v_category_id from public.categories
  where user_id = v_user_id and lower(name) = 'fuel' and transaction_type = 'expense' and is_active = true
  limit 1;

  if v_category_id is null then
    insert into public.categories(user_id, name, transaction_type, is_system)
    values (v_user_id, 'Fuel', 'expense', true)
    returning id into v_category_id;
  end if;

  insert into public.transactions(user_id, account_id, category_id, type, amount, currency, transaction_date, notes)
  values (v_user_id, p_account_id, v_category_id, 'expense', round(p_total, 2), v_currency, p_fuel_date,
    nullif(trim(concat('Fuel · ', p_station_name, case when coalesce(trim(p_notes),'') <> '' then ' · ' || trim(p_notes) else '' end)), ''))
  returning id into v_transaction_id;

  insert into public.fuel_entries(user_id, transaction_id, account_id, station_name, fuel_type, price_per_liter, liters, total, currency, odometer_km, fuel_date, notes)
  values (v_user_id, v_transaction_id, p_account_id, trim(p_station_name), p_fuel_type, p_price_per_liter, p_liters, round(p_total,2), v_currency, p_odometer_km, p_fuel_date, nullif(trim(p_notes),''))
  returning id into v_fuel_id;

  return v_fuel_id;
end;
$$;

create or replace function public.update_fuel_entry(
  p_fuel_id uuid,
  p_account_id uuid,
  p_station_name text,
  p_fuel_type public.fuel_type,
  p_price_per_liter numeric,
  p_liters numeric,
  p_total numeric,
  p_odometer_km numeric,
  p_fuel_date date,
  p_notes text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_currency public.currency_code;
  v_transaction_id uuid;
  v_category_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select transaction_id into v_transaction_id from public.fuel_entries where id = p_fuel_id and user_id = v_user_id;
  if v_transaction_id is null then raise exception 'Fuel entry not found'; end if;
  select currency into v_currency from public.accounts where id = p_account_id and user_id = v_user_id and is_active = true;
  if v_currency is null then raise exception 'Account not found'; end if;
  select category_id into v_category_id from public.transactions where id = v_transaction_id and user_id = v_user_id;

  update public.fuel_entries set
    account_id = p_account_id, station_name = trim(p_station_name), fuel_type = p_fuel_type,
    price_per_liter = p_price_per_liter, liters = p_liters, total = round(p_total,2), currency = v_currency,
    odometer_km = p_odometer_km, fuel_date = p_fuel_date, notes = nullif(trim(p_notes),'')
  where id = p_fuel_id and user_id = v_user_id;

  perform set_config('masroufi.allow_linked_transaction_update', 'on', true);
  update public.transactions set
    account_id = p_account_id, category_id = v_category_id, amount = round(p_total,2), currency = v_currency,
    transaction_date = p_fuel_date,
    notes = nullif(trim(concat('Fuel · ', p_station_name, case when coalesce(trim(p_notes),'') <> '' then ' · ' || trim(p_notes) else '' end)), '')
  where id = v_transaction_id and user_id = v_user_id;
end;
$$;

revoke all on function public.create_fuel_entry(uuid,text,public.fuel_type,numeric,numeric,numeric,numeric,date,text) from public;
revoke all on function public.update_fuel_entry(uuid,uuid,text,public.fuel_type,numeric,numeric,numeric,numeric,date,text) from public;
grant execute on function public.create_fuel_entry(uuid,text,public.fuel_type,numeric,numeric,numeric,numeric,date,text) to authenticated;
grant execute on function public.update_fuel_entry(uuid,uuid,text,public.fuel_type,numeric,numeric,numeric,numeric,date,text) to authenticated;

-- Extend linked transaction protection to fuel entries.
create or replace function public.prevent_linked_transaction_update()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_setting('masroufi.allow_linked_transaction_update', true) = 'on' then
    return new;
  end if;

  if exists (select 1 from public.purchases p where p.transaction_id = old.id)
    or exists (select 1 from public.bill_payments bp where bp.transaction_id = old.id)
    or exists (select 1 from public.fuel_entries f where f.transaction_id = old.id)
  then
    if new.amount is distinct from old.amount or new.account_id is distinct from old.account_id
      or new.category_id is distinct from old.category_id or new.payee_id is distinct from old.payee_id
      or new.type is distinct from old.type or new.currency is distinct from old.currency
      or new.transaction_date is distinct from old.transaction_date or new.notes is distinct from old.notes
    then raise exception using errcode = 'P0001', message = 'This transaction is managed by its original purchase, bill payment, or fuel entry.';
    end if;
  end if;
  return new;
end;
$$;
