-- =========================================================
-- Masroufi
-- Migration: 009
-- Link subscription payments to transactions
-- =========================================================

alter table public.transactions
add column if not exists subscription_id uuid;

alter table public.transactions
drop constraint if exists transactions_subscription_id_fkey;

alter table public.transactions
add constraint transactions_subscription_id_fkey
foreign key (subscription_id)
references public.subscriptions(id)
on delete set null;

create index if not exists transactions_subscription_id_idx
on public.transactions(subscription_id);

grant select, insert, update, delete
on table public.transactions
to authenticated;