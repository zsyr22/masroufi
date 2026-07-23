-- =========================================================
-- Masroufi
-- Migration: 002 - Transactions core
-- Purpose:
--   Create categories, payees, and basic income/expense
--   transactions with indexes, grants, triggers, and RLS.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------

create type public.transaction_type as enum (
  'income',
  'expense'
);

create type public.payee_type as enum (
  'store',
  'restaurant',
  'company',
  'government',
  'person',
  'other'
);

-- ---------------------------------------------------------
-- 2. Categories
-- ---------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null
    check (char_length(trim(name)) between 1 and 80),

  transaction_type public.transaction_type not null,

  is_system boolean not null default false,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index categories_user_id_idx
  on public.categories(user_id);

create unique index categories_unique_active_name_idx
  on public.categories(
    user_id,
    lower(name),
    transaction_type
  )
  where is_active = true;

-- ---------------------------------------------------------
-- 3. Payees
-- Stores, people, companies, and other recipients.
-- ---------------------------------------------------------

create table public.payees (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null
    check (char_length(trim(name)) between 1 and 100),

  type public.payee_type not null default 'other',

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index payees_user_id_idx
  on public.payees(user_id);

create unique index payees_unique_active_name_idx
  on public.payees(user_id, lower(name))
  where is_active = true;

-- ---------------------------------------------------------
-- 4. Transactions
-- ---------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  account_id uuid not null
    references public.accounts(id)
    on delete restrict,

  category_id uuid not null
    references public.categories(id)
    on delete restrict,

  payee_id uuid
    references public.payees(id)
    on delete set null,

  type public.transaction_type not null,

  amount numeric(14, 2) not null
    check (amount > 0),

  currency public.currency_code not null,

  transaction_date date not null default current_date,

  notes text
    check (
      notes is null
      or char_length(notes) <= 500
    ),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index transactions_user_date_idx
  on public.transactions(
    user_id,
    transaction_date desc
  );

create index transactions_account_idx
  on public.transactions(account_id);

create index transactions_category_idx
  on public.transactions(category_id);

create index transactions_payee_idx
  on public.transactions(payee_id);

-- ---------------------------------------------------------
-- 5. updated_at triggers
-- Uses public.set_updated_at() from migration 001.
-- ---------------------------------------------------------

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create trigger payees_set_updated_at
before update on public.payees
for each row
execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------

grant usage on type public.transaction_type
  to authenticated;

grant usage on type public.payee_type
  to authenticated;

grant select, insert, update, delete
  on table public.categories
  to authenticated;

grant select, insert, update, delete
  on table public.payees
  to authenticated;

grant select, insert, update, delete
  on table public.transactions
  to authenticated;

-- ---------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------

alter table public.categories enable row level security;
alter table public.payees enable row level security;
alter table public.transactions enable row level security;

create policy "categories_select_own"
on public.categories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "categories_insert_own"
on public.categories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "categories_update_own"
on public.categories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "categories_delete_own"
on public.categories
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "payees_select_own"
on public.payees
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "payees_insert_own"
on public.payees
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "payees_update_own"
on public.payees
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "payees_delete_own"
on public.payees
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------
-- 8. Documentation
-- ---------------------------------------------------------

comment on table public.categories is
  'User-owned income and expense categories.';

comment on table public.payees is
  'Stores, people, companies, and other payment recipients.';

comment on table public.transactions is
  'Income and expense records linked to accounts and categories.';