-- =========================================================
-- Masroufi
-- Migration: 016 - Harden multi-user RPC security
-- Purpose:
--   1) Remove the obsolete pre-managed-stores create_purchase overload.
--   2) Remove PUBLIC/anon EXECUTE from client-callable RPC functions.
--   3) Explicitly allow only authenticated users to call active RPCs.
--
-- This migration does not modify or delete application data.
-- =========================================================

begin;

-- Obsolete RPC from migration 011. The current application uses the
-- store_id/channel/delivery_fee overload introduced by migrations 012/015.
drop function if exists public.create_purchase(
  text,
  text,
  uuid,
  uuid,
  date,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
);

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default.
-- Remove that implicit access from the active application RPCs.
revoke all on function public.create_default_categories() from public;
revoke all on function public.create_default_categories() from anon;

grant execute on function public.create_default_categories()
  to authenticated;

revoke all on function public.pay_bill(
  uuid,
  uuid,
  numeric,
  date,
  date,
  text
) from public;
revoke all on function public.pay_bill(
  uuid,
  uuid,
  numeric,
  date,
  date,
  text
) from anon;

grant execute on function public.pay_bill(
  uuid,
  uuid,
  numeric,
  date,
  date,
  text
) to authenticated;

revoke all on function public.create_purchase(
  uuid,
  public.purchase_channel,
  text,
  uuid,
  uuid,
  date,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) from public;
revoke all on function public.create_purchase(
  uuid,
  public.purchase_channel,
  text,
  uuid,
  uuid,
  date,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) from anon;

grant execute on function public.create_purchase(
  uuid,
  public.purchase_channel,
  text,
  uuid,
  uuid,
  date,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) to authenticated;

commit;
