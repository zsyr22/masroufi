-- =========================================================
-- Masroufi
-- Migration: 022 - Archive/restore integrity hardening
-- =========================================================
-- No destructive schema changes. This migration documents and enforces that
-- inactive master records remain readable through existing RLS while writes
-- continue to be scoped to their owner.

revoke update on table public.bills from anon;
revoke update on table public.stores from anon;

grant update on table public.bills to authenticated;
grant update on table public.stores to authenticated;

comment on column public.bills.is_active is
  'Soft archive flag. Archived bills remain linked to historical bill payments and transactions.';
comment on column public.stores.is_active is
  'Soft archive flag. Archived stores remain linked to historical purchases.';
