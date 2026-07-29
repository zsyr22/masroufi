-- =========================================================
-- Masroufi
-- Migration: 010 - Transfers
-- =========================================================

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  currency public.currency_code not null,
  transfer_date date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_different_accounts check (from_account_id <> to_account_id)
);

create index if not exists transfers_user_date_idx
  on public.transfers(user_id, transfer_date desc, created_at desc);

create index if not exists transfers_from_account_idx
  on public.transfers(from_account_id);

create index if not exists transfers_to_account_idx
  on public.transfers(to_account_id);

create or replace trigger transfers_set_updated_at
before update on public.transfers
for each row
execute function public.set_updated_at();

grant select, insert, update, delete
  on table public.transfers
  to authenticated;

alter table public.transfers enable row level security;

drop policy if exists "transfers_select_own" on public.transfers;
create policy "transfers_select_own"
on public.transfers for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "transfers_insert_own" on public.transfers;
create policy "transfers_insert_own"
on public.transfers for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "transfers_update_own" on public.transfers;
create policy "transfers_update_own"
on public.transfers for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "transfers_delete_own" on public.transfers;
create policy "transfers_delete_own"
on public.transfers for delete to authenticated
using ((select auth.uid()) = user_id);
