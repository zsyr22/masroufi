-- =========================================================
-- Masroufi
-- Migration: 001 - Initial accounts schema
-- Purpose:
--   Create account-related enum types, accounts table,
--   indexes, updated_at automation, grants, and RLS policies.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------

create type public.account_type as enum (
  'bank',
  'cash',
  'savings'
);

create type public.currency_code as enum (
  'AED',
  'USD'
);

-- ---------------------------------------------------------
-- 2. Accounts table
-- ---------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null
    check (char_length(trim(name)) between 1 and 100),

  type public.account_type not null,

  currency public.currency_code not null default 'AED',

  opening_balance numeric(14, 2) not null default 0,

  is_active boolean not null default true,

  is_included_in_available_balance boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------

create index accounts_user_id_idx
  on public.accounts(user_id);

create index accounts_user_active_idx
  on public.accounts(user_id, is_active);

-- Prevent duplicate active account names for the same user
-- within the same currency.
create unique index accounts_unique_active_name_idx
  on public.accounts(user_id, lower(name), currency)
  where is_active = true;

-- ---------------------------------------------------------
-- 4. Automatically update updated_at
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 5. Data API permissions
-- ---------------------------------------------------------

grant usage on type public.account_type
  to authenticated;

grant usage on type public.currency_code
  to authenticated;

grant select, insert, update, delete
  on table public.accounts
  to authenticated;

-- ---------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------

alter table public.accounts enable row level security;

create policy "accounts_select_own"
on public.accounts
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "accounts_insert_own"
on public.accounts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "accounts_update_own"
on public.accounts
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy "accounts_delete_own"
on public.accounts
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

-- ---------------------------------------------------------
-- 7. Documentation
-- ---------------------------------------------------------

comment on table public.accounts is
  'Financial accounts owned by individual Masroufi users.';

comment on column public.accounts.opening_balance is
  'Account balance before any transactions are recorded.';

comment on column public.accounts.is_included_in_available_balance is
  'Controls whether the account is counted as spendable money. Savings accounts can be excluded.';
