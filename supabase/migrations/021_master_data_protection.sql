-- =========================================================
-- Masroufi
-- Migration 021: Master data protection
-- Prevent destructive deletion of records that already have history.
-- Archiving / deactivation remains allowed.
-- =========================================================

create or replace function public.protect_master_data_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_used boolean := false;
begin
  case tg_table_name
    when 'stores' then
      select exists(select 1 from public.purchases where store_id = old.id)
      into v_used;

    when 'categories' then
      select
        exists(select 1 from public.transactions where category_id = old.id)
        or exists(select 1 from public.purchases where category_id = old.id)
        or exists(select 1 from public.purchase_items where category_id = old.id)
        or exists(select 1 from public.products where default_category_id = old.id)
        or exists(select 1 from public.bills where category_id = old.id)
        or exists(select 1 from public.subscriptions where category_id = old.id)
      into v_used;

    when 'accounts' then
      select
        exists(select 1 from public.transactions where account_id = old.id)
        or exists(select 1 from public.transfers where from_account_id = old.id or to_account_id = old.id)
        or exists(select 1 from public.purchases where account_id = old.id)
        or exists(select 1 from public.bills where default_account_id = old.id)
        or exists(select 1 from public.subscriptions where account_id = old.id)
      into v_used;

    when 'people' then
      select exists(select 1 from public.person_balance_entries where person_id = old.id)
      into v_used;

    when 'bills' then
      select exists(select 1 from public.bill_payments where bill_id = old.id)
      into v_used;

    when 'subscriptions' then
      select exists(select 1 from public.transactions where subscription_id = old.id)
      into v_used;

    else
      raise exception 'Unsupported protected table: %', tg_table_name;
  end case;

  if v_used then
    raise exception using
      errcode = '23503',
      message = format('%s has financial history and cannot be deleted. Archive or deactivate it instead.', initcap(tg_table_name));
  end if;

  return old;
end;
$$;

revoke all on function public.protect_master_data_delete() from public;
revoke all on function public.protect_master_data_delete() from anon;
grant execute on function public.protect_master_data_delete() to authenticated, postgres;

-- Recreate guards idempotently.
do $$
declare
  v_table text;
begin
  foreach v_table in array array['stores','categories','accounts','people','bills','subscriptions']
  loop
    execute format('drop trigger if exists protect_%I_delete on public.%I', v_table, v_table);
    execute format(
      'create trigger protect_%I_delete before delete on public.%I for each row execute function public.protect_master_data_delete()',
      v_table,
      v_table
    );
  end loop;
end $$;

-- Preserve bill history even if an older FK was created with CASCADE.
alter table public.bill_payments
  drop constraint if exists bill_payments_bill_id_fkey;

alter table public.bill_payments
  add constraint bill_payments_bill_id_fkey
  foreign key (bill_id)
  references public.bills(id)
  on delete restrict;

-- Preserve person ledgers.
alter table public.person_balance_entries
  drop constraint if exists person_balance_entries_person_id_fkey;

alter table public.person_balance_entries
  add constraint person_balance_entries_person_id_fkey
  foreign key (person_id)
  references public.people(id)
  on delete restrict;
